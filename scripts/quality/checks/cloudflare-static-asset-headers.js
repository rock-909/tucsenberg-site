const fs = require("node:fs");
const path = require("node:path");

const EXPECTED_STATIC_ASSET_HEADER_ROUTE = "/_next/static/*";
const EXPECTED_STATIC_ASSET_CACHE_CONTROL = "public,max-age=31536000,immutable";
const EXPECTED_DOWNLOADS_HEADER_ROUTE = "/downloads/*";
const EXPECTED_DOWNLOADS_NOINDEX = "X-Robots-Tag: noindex";
// 拿真实路径去问「它最终被怎样服务」，而不是问「文件里有没有这一行」。
const STATIC_ASSET_PROBE_PATH = "/_next/static/chunks/main.js";
const DOWNLOADS_PROBE_PATH = "/downloads/product-spec.pdf";
const SOURCE_HEADERS_PATH = "public/_headers";
const OPENNEXT_ASSET_HEADERS_PATH = ".open-next/assets/_headers";
const WRANGLER_CONFIG_PATH = "wrangler.jsonc";
const WRANGLER_ASSET_DIRECTORY = '".open-next/assets"';

function readRepoFile(context, relativePath) {
  return context.readFileSync(path.join(context.rootDir, relativePath), "utf8");
}

function repoFileExists(context, relativePath) {
  return context.existsSync(path.join(context.rootDir, relativePath));
}

/**
 * 把 `_headers` 拆成「路由行 + 它底下的响应头行」。
 *
 * 全文件查字符串是不够的：noindex 写在 `/images/*` 底下、`/downloads/*` 底下一条
 * 都没有时，两个子串都还在文件里，检查照样绿，而 PDF 已经能被收录。
 * 归属必须查，所以要按块解析。
 */
function parseHeaderBlocks(headers) {
  const blocks = [];
  let current = null;

  for (const rawLine of headers.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;

    // 路由行也可以写成带域名的绝对 URL（Cloudflare 的「只给某个域名加头」写法）。
    // 不认它，那种行会被当成上一个块的响应头，noindex 就会被算到不属于它的路由
    // 名下——检查绿，而 PDF 已经能被收录。归属查错比不查更危险。
    if (line.startsWith("/") || /^https?:\/\//u.test(line)) {
      current = { route: line, headerLines: [] };
      blocks.push(current);
    } else if (current) {
      current.headerLines.push(line);
    }
  }

  return blocks;
}

/**
 * 比较响应头时把空格抹平。
 *
 * `public,max-age=86400` 和 `public, max-age=86400` 是同一条头，HTTP 规范两种都
 * 合法。逐字符全等会在业主重排一次格式时变红，而意图完全没坏——这个文件自己就
 * 写着「缓存时长是业主可调参数，钉死数字会让业主一改就红」，格式同理。
 *
 * 只抹分隔符两侧的空格，不抹 token 内部的。全删会让 `X-Robots-Tag: no index`
 * 判绿——Google 不认 `no index`，PDF 照样被收录，而门禁说没事。
 */
function normalizeHeaderLine(line) {
  return line.replace(/\s*([:,])\s*/gu, "$1").toLowerCase();
}

/**
 * `X-Robots-Tag: none` 在 Google 的定义里等于 `noindex, nofollow`，比只写
 * noindex 更严。不展开就会把它判红，等于逼着业主把防护改弱。
 */
const ROBOTS_DIRECTIVE_ALIASES = new Map([["none", ["noindex", "nofollow"]]]);

function expandDirectives(name, directives) {
  if (name !== "x-robots-tag") return directives;

  const expanded = new Set();
  for (const directive of directives) {
    for (const alias of ROBOTS_DIRECTIVE_ALIASES.get(directive) ?? [
      directive,
    ]) {
      expanded.add(alias);
    }
  }
  return expanded;
}

/** `! Header-Name` 撤掉一条头。返回被撤掉的头名，不是撤销行的就返回 null。 */
function parseDetachedHeaderName(line) {
  if (!line.startsWith("!")) return null;
  return normalizeHeaderLine(line.slice(1).trim()).replace(/:$/u, "");
}

/**
 * 拆成「头名 + 指令集合」。
 *
 * 整行全等会把更强的写法判红：`X-Robots-Tag: noindex, nofollow` 比只写 noindex
 * 更严，门禁却拦下来，还报「does not carry X-Robots-Tag: noindex」——它明明带了。
 * 一个逼着业主不许加强防护的检查，该改的是检查。所以只要求「要的指令都在」，
 * 多出来的不管。
 */
function parseHeaderLine(line) {
  const [rawName, ...rest] = normalizeHeaderLine(line).split(":");
  const directives = new Set(rest.join(":").split(",").filter(Boolean));
  return { name: rawName, directives: expandDirectives(rawName, directives) };
}

/**
 * 把一条路由行变成路径匹配器。带域名的绝对 URL 返回 null。
 *
 * 不对称是故意的，两个方向的错代价不一样：
 *
 * - 带域名的规则**不能用来证明**防护到位。它只对那一个域名生效，而这里不知道
 *   线上会用哪个域名（预览域名就是另一个）。当成生效就是假绿：PDF 在实际域名上
 *   照样能被收录，门禁说没事。
 * - 带域名的规则**可以用来判定防护被撤掉**。撤销走 `collectDownloadsDetachFailures`，
 *   那里不看域名，任何一条下载路由撤掉这条头都算数。
 *
 * 一句话：域名规则只能减分，不能加分。
 */
function routeToPattern(route) {
  if (/^https?:\/\//u.test(route)) return null;

  const escaped = route.replace(/[.+?^${}()|[\]\\]/gu, "\\$&");
  const pattern = escaped.replace(/\*/gu, ".*").replace(/:[a-z_]+/giu, "[^/]+");
  return new RegExp(`^${pattern}$`, "u");
}

/**
 * 算出某个路径最终真正拿到的响应头。
 *
 * 只比对「路由字符串完全相等」的块是不够的，会同时错两个方向：
 *
 * - 假绿：`/downloads/*` 底下写着 noindex，但下面再写一个更具体的
 *   `/downloads/private.pdf` 加一行 `! X-Robots-Tag`，就能把它撤掉。Cloudflare
 *   支持这种撤销写法，而只看 `/downloads/*` 的检查一无所知。
 * - 假红：同一条头被拆到两个块里（`Cache-Control: public, max-age=…` 一块、
 *   `Cache-Control: immutable` 另一块）。Cloudflare 会用逗号合并成完整的一条，
 *   而按行比对的检查会说它不完整。
 *
 * 所以按 Cloudflare 自己的规则来：所有匹配的块依次作用，同名头的指令并起来，
 * `!` 开头的行把那条头整个撤掉。
 */
function resolveEffectiveHeaders(blocks, targetPath) {
  const effective = new Map();

  for (const block of blocks) {
    const pattern = routeToPattern(block.route);
    if (pattern === null || !pattern.test(targetPath)) continue;

    for (const line of block.headerLines) {
      const detached = parseDetachedHeaderName(line);
      if (detached !== null) {
        effective.delete(detached);
        continue;
      }
      const { name, directives } = parseHeaderLine(line);
      const merged = effective.get(name) ?? new Set();
      for (const directive of directives) merged.add(directive);
      effective.set(name, merged);
    }
  }

  return effective;
}

/**
 * 探一条路径只能证明那一条路径。撤销可以发生在别的具体文件上：
 * `/downloads/*` 底下写着 noindex，再来一个 `/downloads/private.pdf` 加一行
 * `! X-Robots-Tag`，被放出去的是那一个 PDF，而探测路径完全正常。
 *
 * 逐个 PDF 探不现实，所以这里 fail closed：只要有任何一条下载路由撤掉这条头就红。
 * 这确实会拦住「业主故意想让某个 PDF 被收录」——那正好是该停下来问一句的事，
 * 不是应该静悄悄通过的事。
 */
function collectDownloadsDetachFailures(blocks, relativePath) {
  const detached = blocks.filter(
    (block) =>
      block.route.replace(/^https?:\/\/[^/]*/u, "").startsWith("/downloads") &&
      block.headerLines.some(
        (line) => parseDetachedHeaderName(line) === "x-robots-tag",
      ),
  );

  return detached.map(
    (block) =>
      `"${block.route}" in ${relativePath} detaches "${EXPECTED_DOWNLOADS_NOINDEX}"`,
  );
}

function collectServedPathFailures(
  blocks,
  relativePath,
  targetPath,
  expectedHeader,
) {
  const wanted = parseHeaderLine(expectedHeader);
  const actual = resolveEffectiveHeaders(blocks, targetPath).get(wanted.name);

  if (!actual) {
    return [
      `${targetPath} in ${relativePath} is served without "${wanted.name}"`,
    ];
  }

  const missing = [...wanted.directives].filter(
    (directive) => !actual.has(directive),
  );
  if (missing.length > 0) {
    return [
      `${targetPath} in ${relativePath} does not carry "${expectedHeader}"`,
    ];
  }

  return [];
}

function collectHeaderFileFailures(context, relativePath) {
  if (!repoFileExists(context, relativePath)) {
    return [`missing Cloudflare build output header file: ${relativePath}`];
  }

  const blocks = parseHeaderBlocks(readRepoFile(context, relativePath));

  // 查的是「一个真实路径最终被怎样服务」，不是「文件里有没有某一行」。
  //
  // 构建产物的缓存时长确实钉死在一年 immutable：那些文件名带内容哈希，改内容就
  // 换文件名，业主没有理由去调它。`/downloads/*` 和 `/images/*` 的缓存秒数不查
  // ——那两个是业主可调参数，钉死数字会让他一改就红而意图完全没坏。
  return [
    ...collectServedPathFailures(
      blocks,
      relativePath,
      STATIC_ASSET_PROBE_PATH,
      `Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
    ),
    ...collectServedPathFailures(
      blocks,
      relativePath,
      DOWNLOADS_PROBE_PATH,
      EXPECTED_DOWNLOADS_NOINDEX,
    ),
    ...collectDownloadsDetachFailures(blocks, relativePath),
  ];
}

function createCloudflareStaticAssetHeaderContext({
  rootDir = process.cwd(),
  existsSync = fs.existsSync,
  readFileSync = fs.readFileSync,
} = {}) {
  return {
    rootDir,
    existsSync,
    readFileSync,
  };
}

function collectCloudflareStaticAssetHeaderFailures(options = {}) {
  const context = createCloudflareStaticAssetHeaderContext(options);
  const failures = [];

  if (!repoFileExists(context, WRANGLER_CONFIG_PATH)) {
    failures.push(`missing ${WRANGLER_CONFIG_PATH}`);
  } else {
    const wrangler = readRepoFile(context, WRANGLER_CONFIG_PATH);
    if (!wrangler.includes(WRANGLER_ASSET_DIRECTORY)) {
      failures.push(
        `${WRANGLER_CONFIG_PATH} must keep assets.directory set to .open-next/assets`,
      );
    }
  }

  failures.push(...collectHeaderFileFailures(context, SOURCE_HEADERS_PATH));
  failures.push(
    ...collectHeaderFileFailures(context, OPENNEXT_ASSET_HEADERS_PATH),
  );

  return failures;
}

function runCloudflareStaticAssetHeaderCli(options = {}) {
  const failures = collectCloudflareStaticAssetHeaderFailures(options);

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`Cloudflare static asset header check failed: ${failure}`);
    }
    console.error(
      "Run `pnpm build` then `pnpm website:build:cf` before this artifact check.",
    );
    return false;
  }

  console.log(
    "Cloudflare static asset headers are present in source and OpenNext output.",
  );
  return true;
}

module.exports = {
  EXPECTED_DOWNLOADS_HEADER_ROUTE,
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
  EXPECTED_STATIC_ASSET_HEADER_ROUTE,
  OPENNEXT_ASSET_HEADERS_PATH,
  SOURCE_HEADERS_PATH,
  collectCloudflareStaticAssetHeaderFailures,
  createCloudflareStaticAssetHeaderContext,
  runCloudflareStaticAssetHeaderCli,
};
