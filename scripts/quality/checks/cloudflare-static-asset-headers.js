const fs = require("node:fs");
const path = require("node:path");

const EXPECTED_STATIC_ASSET_HEADER_ROUTE = "/_next/static/*";
const EXPECTED_STATIC_ASSET_CACHE_CONTROL = "public,max-age=31536000,immutable";
const EXPECTED_DOWNLOADS_HEADER_ROUTE = "/downloads/*";
const EXPECTED_DOWNLOADS_NOINDEX = "X-Robots-Tag: noindex";
// 两类被证明的资源：源目录 → 它们最终的 URL 前缀。写死一条探针路径证明不了什么，
// 以前那条 `/_next/static/chunks/main.js` 在构建产物里根本不存在，真实文件名全带
// 内容哈希；只要撤销精确落在某个真实哈希文件上，那条虚构探针毫无反应。
const DOWNLOADS_SOURCE_DIR = "public/downloads";
const DOWNLOADS_URL_PREFIX = "/downloads";
const STATIC_ASSET_SOURCE_DIR = ".open-next/assets/_next/static";
const STATIC_ASSET_URL_PREFIX = "/_next/static";
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

/* ------------------------------------------------------------------ *
 * 以下这一段是 wrangler 4.100.0 解析 `_headers` 的移植，不是自己的设计。
 *
 * 前三轮的每一个缺陷都是同一个根因：凭理解近似 wrangler 的语义，近似一次就漏一
 * 处。逐条打补丁只会一直漏下去——占位符正则、路径归一化、非法规则、行长上限、
 * 规则条数上限，每一条都能单独造出一个假绿。所以这里不再近似，直接照抄锁定版本
 * 的实现，来源标在每个常量后面（行号是 node_modules/wrangler/wrangler-dist/cli.js）。
 *
 * wrangler 的 parser 不能直接 import：它被打进了 cli.js 这个 bundle，
 * `@cloudflare/workers-shared` 和 miniflare 都取不到这个模块。移植是唯一的路。
 * ------------------------------------------------------------------ */

// constants.ts（cli.js:128970 附近）
const MAX_LINE_LENGTH = 2000;
const MAX_HEADER_RULES = 100;
const HEADER_SEPARATOR = ":";
const UNSET_OPERATOR = "! ";
const SPLAT_PATTERN = /\*/gu;
const NAMED_PLACEHOLDER_PATTERN = /:([A-Za-z]\w*)/gu;

// parseHeaders.ts（cli.js:129213）
const LINE_IS_PROBABLY_A_PATH = /^([^\s]+:\/\/|^\/)/u;

// validateURL.ts（cli.js:128996）
const URL_REGEX = /^https:\/\/+(?<host>[^/]+)\/?(?<path>.*)/u;
const HOST_WITH_PORT_REGEX = /.*:\d+$/u;

// rules-engine.ts（cli.js:336432）
const ESCAPE_REGEX_CHARACTERS = /[-/\\^$*+?.()|[\]{}]/gu;

function escapeRegex(value) {
  return value.replace(ESCAPE_REGEX_CHARACTERS, "\\$&");
}

/** validateURL.ts 的 `extractPathname`：`/downloads/./*` 归一成 `/downloads/*`。 */
function extractPathname(value) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return new URL(`//${withLeadingSlash}`, "relative://").pathname;
}

/**
 * validateURL.ts 的 `validateUrl(token, false, true)`。返回归一化后的规则路径，
 * wrangler 会丢弃的写法返回 null。
 *
 * 三条判据都不是可选的：绝对 URL 只认 https（`ftp://` 会被丢）、带端口的域名会被
 * 丢、其余必须以 `/` 开头。
 */
function validateRulePath(token) {
  const absolute = URL_REGEX.exec(token);
  if (absolute?.groups?.host) {
    if (HOST_WITH_PORT_REGEX.test(absolute.groups.host)) return null;
    return `https://${absolute.groups.host}${extractPathname(absolute.groups.path ?? "")}`;
  }

  if (!token.startsWith("/")) return null;
  try {
    return extractPathname(token);
  } catch {
    return null;
  }
}

/** parseHeaders.ts 的 `validateNoMultipleWildcards`：违规返回 true。 */
function hasInvalidWildcards(rulePath) {
  const wildcardCount = (rulePath.match(SPLAT_PATTERN) ?? []).length;
  if (wildcardCount > 1) return true;
  return wildcardCount > 0 && /:splat(?!\w)/u.test(rulePath);
}

/** parseHeaders.ts 的 `isValidRule`：一条头都没有的规则整条不生效。 */
function isValidRule(rule) {
  return Object.keys(rule.headers).length > 0 || rule.unsetHeaders.length > 0;
}

/**
 * parseHeaders.ts 的 `parseHeaders`，只保留生效规则（wrangler 的 `invalid` 那半边
 * 这里不需要，被丢弃就等于不生效）。
 *
 * 按块解析而不是全文件查字符串：noindex 写在 `/images/*` 底下、`/downloads/*` 底下
 * 一条都没有时，两个子串都还在文件里，查字符串照样绿，而 PDF 已经能被收录。
 *
 * 最容易漏的一处：一条被丢弃的路由行会把它**底下的响应头一起吃掉**，而不是让那些
 * 头挂到上一个块名下。`/downloads/*` 后面紧跟一行 `ftp://bad.example/downloads/*`
 * 再跟一行 noindex，wrangler 的结果是 downloads 块没有任何头；把那两行并进
 * downloads 块，门禁就会说 PDF 有 noindex。承担这件事的是路由行分支里那句
 * `rule = null`。
 *
 * wrangler 在同一处还维护了一个 `skipUntilNextPath` 标志，这里没有移植：它所有的
 * 分支在 `rule` 为空时都只往 `invalid` 诊断列表里记一笔，不改变生效规则。移植进来
 * 是一段永远改变不了结果的装饰代码，反而让人以为它在守什么。
 */
function parseWranglerHeaderRules(input) {
  const rules = [];
  let rule = null;

  const commitPendingRule = () => {
    if (rule && isValidRule(rule)) rules.push(rule);
  };

  for (const rawLine of input.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    // 超长行被整行忽略。一条 2062 字符、归一化后是 `/downloads/*` 的规则，
    // wrangler 根本不看，门禁若认它就是假绿。
    if (line.length > MAX_LINE_LENGTH) continue;

    if (LINE_IS_PROBABLY_A_PATH.test(line)) {
      // 第 101 条规则以及之后的整段文件都不生效。wrangler 在这里 break，未提交的
      // 那条规则仍会在循环结束后补上，所以这里也照做。
      if (rules.length >= MAX_HEADER_RULES) break;
      commitPendingRule();
      // 必须清掉。不清的话，被丢弃的路由行底下那些头会继续挂在上一个块名下。
      rule = null;

      const rulePath = validateRulePath(line);
      if (rulePath === null || hasInvalidWildcards(rulePath)) continue;
      rule = { path: rulePath, headers: {}, unsetHeaders: [] };
      continue;
    }

    if (!line.includes(HEADER_SEPARATOR)) {
      // 撤销行必须是 `! ` 带空格开头，且整行不含冒号——`!X-Robots-Tag` 和
      // `! X-Robots-Tag:` 在 wrangler 眼里都不是撤销。
      if (rule && line.startsWith(UNSET_OPERATOR)) {
        rule.unsetHeaders.push(line.slice(UNSET_OPERATOR.length).trim());
      }
      continue;
    }

    const [rawName, ...rawValue] = line.split(HEADER_SEPARATOR);
    const name = (rawName ?? "").trim().toLowerCase();
    if (name === "" || name.includes(" ")) continue;
    const value = rawValue.join(HEADER_SEPARATOR).trim();
    if (value === "" || !rule) continue;

    rule.headers[name] = rule.headers[name]
      ? `${rule.headers[name]}, ${value}`
      : value;
  }

  commitPendingRule();
  return rules;
}

/**
 * rules-engine.ts 的 `generateRuleRegExp`。域名占位符是 `[^/.]+`，路径占位符是
 * `[^/]+`，通配符先切后转义，两者都编译成**命名**捕获组。
 *
 * 占位符语法必须照抄：自己按感觉写成 `/:[a-z_]+/gi` 会漏，`\w` 含数字，
 * `:section2` 在 wrangler 眼里是一个完整占位符，会命中 `/downloads/catalog.pdf`。
 *
 * 名字也必须照抄，不能图省事换成匿名分组：`/:x/:x` 会生成两个同名捕获组，
 * `RegExp` 直接抛 `SyntaxError`，`generateRulesMatcher` catch 之后把这条规则整个
 * 丢掉。换成匿名分组它就成了一条正常规则，底下的 noindex 被算作生效，而线上
 * 根本没有——假绿。
 */
function compileRuleSegment(segment, placeholderClass) {
  return segment
    .split("*")
    .map(escapeRegex)
    .join("(?<splat>.*)")
    .replace(
      NAMED_PLACEHOLDER_PATTERN,
      (_match, name) => `(?<${name}>${placeholderClass})`,
    );
}

/**
 * 编译不出来的规则返回 null——和 `generateRulesMatcher` 的 try/catch 一致，整条丢弃。
 *
 * 正则不加 `u` 标志，wrangler 也没加（`RegExp(rule)`）。加了反而更严：它转义出来的
 * `\-` 在 unicode 模式下是非法转义，`/downloads-archive/*` 这种正当规则会直接抛
 * 异常，把门禁变成崩溃而不是判断。
 */
function ruleToMatcher(rulePath) {
  const absolute = /^https:\/\/([^/]+)(\/.*)?$/u.exec(rulePath);
  const hostPart = absolute ? (absolute[1] ?? "") : null;
  const pathPart = absolute ? (absolute[2] ?? "") : rulePath;
  const pathSource = compileRuleSegment(pathPart, "[^/]+");

  try {
    // 先按整条规则编译一次。重名捕获组可能跨域名段和路径段
    // （`https://:x.example/:x`），只编译路径段是看不出来的。
    const hostSource =
      hostPart === null
        ? ""
        : `https:\\/\\/${compileRuleSegment(hostPart, "[^/.]+")}`;
    const wholeRulePattern = new RegExp(`^${hostSource}${pathSource}$`);

    return {
      crossHost: hostPart !== null,
      // 域名规则只拿路径段去匹配（fail closed 的理由见 resolveEffectiveHeaders），
      // 但能不能编译要看整条。
      pathPattern:
        hostPart === null ? wholeRulePattern : new RegExp(`^${pathSource}$`),
    };
  } catch {
    return null;
  }
}

/**
 * 比较响应头时把空格抹平。
 *
 * `public,max-age=86400` 和 `public, max-age=86400` 是同一条头，HTTP 规范两种都
 * 合法。逐字符全等会在业主重排一次格式时变红，而意图完全没坏。
 *
 * 只抹分隔符两侧的空格，不抹 token 内部的。全删会让 `X-Robots-Tag: no index`
 * 判绿——Google 不认 `no index`，PDF 照样被收录，而门禁说没事。
 */
function normalizeHeaderValue(value) {
  return value.replace(/\s*([:,])\s*/gu, "$1").toLowerCase();
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

/**
 * 拆成指令集合。
 *
 * 整行全等会把更强的写法判红：`X-Robots-Tag: noindex, nofollow` 比只写 noindex
 * 更严，门禁却拦下来，还报「does not carry X-Robots-Tag: noindex」——它明明带了。
 * 一个逼着业主不许加强防护的检查，该改的是检查。所以只要求「要的指令都在」，
 * 多出来的不管。
 */
function toDirectiveSet(name, value) {
  const directives = new Set(
    normalizeHeaderValue(value)
      .split(",")
      .map((directive) => directive.trim())
      .filter(Boolean),
  );
  return expandDirectives(name, directives);
}

/** 把 `X-Robots-Tag: noindex` 这种期望写法拆成「头名 + 指令集合」。 */
function parseExpectedHeader(line) {
  const [rawName, ...rest] = line.split(HEADER_SEPARATOR);
  const name = (rawName ?? "").trim().toLowerCase();
  return {
    name,
    directives: toDirectiveSet(name, rest.join(HEADER_SEPARATOR)),
  };
}

/**
 * 算出某个路径最终真正拿到的响应头，照 rules-engine.ts 的 `attachHeaders`：
 * 所有命中的规则按声明顺序依次作用，每条规则先撤销再设置，同名头的指令并起来。
 *
 * 只比对「路由字符串完全相等」的块会同时错两个方向：
 *
 * - 假绿：`/downloads/*` 底下写着 noindex，但下面再写一个更具体的
 *   `/downloads/private.pdf` 加一行 `! X-Robots-Tag`，就能把它撤掉。
 * - 假红：同一条头被拆到两个块里（`Cache-Control: public, max-age=…` 一块、
 *   `Cache-Control: immutable` 另一块），线上会合并成完整的一条。
 *
 * 域名规则的处理是**故意不对称**的，因为两个方向的错代价不一样：
 *
 * - 带域名的规则**不能用来证明**防护到位。它只对那一个域名生效，而这里不知道
 *   线上会用哪个域名（预览域名就是另一个）。当成生效就是假绿。
 * - 带域名的规则**可以用来判定防护被撤掉**，fail closed：宁可多红一次，也不能
 *   放一个能被收录的 PDF 出去。
 *
 * 一句话：域名规则只能减分，不能加分。
 */
function resolveEffectiveHeaders(rules, targetPath) {
  const effective = new Map();

  for (const rule of rules) {
    const matcher = ruleToMatcher(rule.path);
    if (matcher === null) continue;
    const { crossHost, pathPattern } = matcher;
    if (!pathPattern.test(targetPath)) continue;

    for (const unsetName of rule.unsetHeaders) {
      effective.delete(unsetName.toLowerCase());
    }
    if (crossHost) continue;

    for (const [name, value] of Object.entries(rule.headers)) {
      const merged = effective.get(name) ?? new Set();
      for (const directive of toDirectiveSet(name, value))
        merged.add(directive);
      effective.set(name, merged);
    }
  }

  return effective;
}

/**
 * 磁盘文件名要按 URL pathname 的规则转义之后，才是线上真正被请求的路径。
 *
 * 直接拼文件名会漏：`catalog copy.pdf` 在线上是 `/downloads/catalog%20copy.pdf`，
 * 一条写成 `%20` 的撤销规则会命中它，而门禁拿着带空格的原名去比，什么都没匹配上，
 * 于是 PDF 能被收录而门禁全绿。空格、`^`、中文名都是同一类。
 *
 * 转义交给 `new URL()` 自己算，和 rules-engine 读 `new URL(request.url).pathname`
 * 是同一套实现。手写一张「该转义哪些字符」的表就是又一次近似：上一版照 URL 规范
 * 的 path percent-encode set 抄，仍然漏了 `^`——Node 会把它转成 `%5E`。
 *
 * 只有三个字符必须先手工转义，因为它们会改变 URL 的**结构**而不只是编码：`%`
 * 不先转成 `%25`，磁盘上真名叫 `a%20b.pdf` 的文件会和 `a b.pdf` 撞成同一条路径；
 * `#` 和 `?` 会被当成 fragment 和 query，整个后缀从 pathname 里消失。
 */
const STRUCTURAL_PATH_CHARS = /[%#?]/gu;

function toServedPath(urlPrefix, relativePath) {
  const escaped = relativePath.replace(STRUCTURAL_PATH_CHARS, (character) =>
    encodeURIComponent(character),
  );
  return extractPathname(`${urlPrefix}/${escaped}`);
}

/**
 * 列出真实发布出去的文件。
 *
 * 探一条写死的路径只能证明那一条路径，而撤销可以精确落在某个真实文件上
 * （`/downloads/supplier-checklist.pdf` 加一行 `! X-Robots-Tag`），也可以用占位符
 * 绕开（`/:section/private.pdf`）。所以逐个真实文件算它最终拿到的头，规则会不会
 * 命中交给同一套匹配逻辑判断，不靠字符串前缀猜。
 */
function listServedPaths(context, sourceDir, urlPrefix, relative = "") {
  const absolute = path.join(context.rootDir, sourceDir, relative);
  if (!context.existsSync(absolute)) return [];

  return context
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .flatMap((entry) => {
      const next = relative ? `${relative}/${entry.name}` : entry.name;
      // 目录本身不是可证明的东西。不递归的话 `/downloads/nested` 会被当成一个
      // 文件去探，它底下真实的 PDF 一个都没查，而门禁看起来在干活。
      if (entry.isDirectory()) {
        return listServedPaths(context, sourceDir, urlPrefix, next);
      }
      // 只有普通文件算数。符号链接、FIFO 这些不是可证明的资源，把它们算进来
      // 等于「目录里没有真实文件」也能凑够数，空证明照样全绿。
      if (!entry.isFile()) return [];
      return [toServedPath(urlPrefix, next)];
    })
    .sort();
}

/**
 * 同一条路由写两个块，不是「合并」，是「后一个整块盖掉前一个」。
 *
 * 锁定的 wrangler 4.100.0 在构造静态资源 header metadata 时写的是
 * `rules[rule.path] = configuredRule`（cli.js:335300），后写的整块覆盖先写的，
 * 先写的那些头就此消失。把它们合起来是门禁在替线上做主，结果是假绿。
 *
 * 这里不替它猜哪个是本意，直接判红。比的是 wrangler 归一化之后的键，
 * `/downloads/*` 和 `/downloads/./*` 在它那里是同一个键。
 */
function collectDuplicateRouteFailures(rules, relativePath) {
  const seen = new Set();
  const duplicated = new Set();

  for (const rule of rules) {
    if (seen.has(rule.path)) duplicated.add(rule.path);
    seen.add(rule.path);
  }

  return [...duplicated].map(
    (rulePath) =>
      `"${rulePath}" is declared twice in ${relativePath}; wrangler keeps only the last block and silently drops the earlier headers`,
  );
}

/**
 * 「要的指令都在」对 Cache-Control 不够，它还得没被别的指令推翻。
 *
 * 多条规则命中同一条头时 wrangler 用 `Headers.append` 拼接，指令是并起来而不是
 * 覆盖。通配块给了一年 immutable，再给某个真实 bundle 追加一行
 * `Cache-Control: no-store`，三个期望 token 一个不少，而那个文件线上一秒都不会被
 * 缓存——门禁却说缓存到位。
 *
 * X-Robots-Tag 不需要这一层：多一条 nofollow 只会更严，Google 也取最严的那条。
 * Cache-Control 相反，最严的那条会把期望整个作废。
 */
const CACHE_CONTROL_CONTRADICTIONS = new Set([
  "no-store",
  "no-cache",
  "private",
]);
const CACHE_CONTROL_AGE_DIRECTIVES = ["max-age", "s-maxage"];

function findContradictingDirectives(name, expected, actual) {
  if (name !== "cache-control") return [];

  const contradictions = [...actual].filter((directive) =>
    CACHE_CONTROL_CONTRADICTIONS.has(directive),
  );

  // 期望里写了 max-age=31536000，实际却同时挂着另一个时长（或者 s-maxage=0），
  // 线上按哪个算是不确定的，同样不能算证明。
  for (const ageDirective of CACHE_CONTROL_AGE_DIRECTIVES) {
    const prefix = `${ageDirective}=`;
    for (const directive of actual) {
      if (directive.startsWith(prefix) && !expected.has(directive)) {
        contradictions.push(directive);
      }
    }
  }

  return contradictions;
}

function collectServedPathFailures(
  rules,
  relativePath,
  targetPath,
  expectedHeader,
) {
  const wanted = parseExpectedHeader(expectedHeader);
  const actual = resolveEffectiveHeaders(rules, targetPath).get(wanted.name);

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

  const contradictions = findContradictingDirectives(
    wanted.name,
    wanted.directives,
    actual,
  );
  if (contradictions.length > 0) {
    return [
      `${targetPath} in ${relativePath} carries "${expectedHeader}" but ${contradictions.join(", ")} overrides it`,
    ];
  }

  return [];
}

function collectHeaderFileFailures(
  context,
  relativePath,
  { downloadPaths, staticAssetPaths },
) {
  if (!repoFileExists(context, relativePath)) {
    return [`missing Cloudflare build output header file: ${relativePath}`];
  }

  const rules = parseWranglerHeaderRules(readRepoFile(context, relativePath));

  // 查的是「一个真实路径最终被怎样服务」，不是「文件里有没有某一行」。
  //
  // 构建产物的缓存时长确实钉死在一年 immutable：那些文件名带内容哈希，改内容就
  // 换文件名，业主没有理由去调它。`/downloads/*` 和 `/images/*` 的缓存秒数不查
  // ——那两个是业主可调参数，钉死数字会让他一改就红而意图完全没坏。
  return [
    ...collectDuplicateRouteFailures(rules, relativePath),
    ...staticAssetPaths.flatMap((assetPath) =>
      collectServedPathFailures(
        rules,
        relativePath,
        assetPath,
        `Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      ),
    ),
    ...downloadPaths.flatMap((downloadPath) =>
      collectServedPathFailures(
        rules,
        relativePath,
        downloadPath,
        EXPECTED_DOWNLOADS_NOINDEX,
      ),
    ),
  ];
}

function createCloudflareStaticAssetHeaderContext({
  rootDir = process.cwd(),
  existsSync = fs.existsSync,
  readFileSync = fs.readFileSync,
  readdirSync = fs.readdirSync,
} = {}) {
  return {
    rootDir,
    existsSync,
    readFileSync,
    readdirSync,
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

  // 目录空了或者被改了名，逐文件证明就一条都不剩，而门禁会安安静静地全绿。
  // 这个仓库靠 PDF 接询盘，「没有可证明的东西」在这里就是失败。
  const downloadPaths = listServedPaths(
    context,
    DOWNLOADS_SOURCE_DIR,
    DOWNLOADS_URL_PREFIX,
  );
  if (downloadPaths.length === 0) {
    failures.push(
      `${DOWNLOADS_SOURCE_DIR} holds no files, so nothing proves "${EXPECTED_DOWNLOADS_NOINDEX}" reaches a real download`,
    );
  }

  const staticAssetPaths = listServedPaths(
    context,
    STATIC_ASSET_SOURCE_DIR,
    STATIC_ASSET_URL_PREFIX,
  );
  if (staticAssetPaths.length === 0) {
    failures.push(
      `${STATIC_ASSET_SOURCE_DIR} holds no files, so nothing proves "${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" reaches a real bundle`,
    );
  }

  const servedPaths = { downloadPaths, staticAssetPaths };
  failures.push(
    ...collectHeaderFileFailures(context, SOURCE_HEADERS_PATH, servedPaths),
  );
  failures.push(
    ...collectHeaderFileFailures(
      context,
      OPENNEXT_ASSET_HEADERS_PATH,
      servedPaths,
    ),
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
