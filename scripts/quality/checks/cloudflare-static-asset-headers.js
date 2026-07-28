const fs = require("node:fs");
const path = require("node:path");

const EXPECTED_STATIC_ASSET_HEADER_ROUTE = "/_next/static/*";
const EXPECTED_STATIC_ASSET_CACHE_CONTROL = "public,max-age=31536000,immutable";
const EXPECTED_DOWNLOADS_HEADER_ROUTE = "/downloads/*";
const EXPECTED_DOWNLOADS_NOINDEX = "X-Robots-Tag: noindex";
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

    if (line.startsWith("/")) {
      current = { route: line, headerLines: [] };
      blocks.push(current);
    } else if (current) {
      current.headerLines.push(line);
    }
  }

  return blocks;
}

function collectRouteBlockFailures(
  blocks,
  relativePath,
  route,
  expectedHeader,
) {
  const block = blocks.find((candidate) => candidate.route === route);

  if (!block) {
    return [`missing "${route}" in ${relativePath}`];
  }

  if (!block.headerLines.includes(expectedHeader)) {
    return [`"${route}" in ${relativePath} does not carry "${expectedHeader}"`];
  }

  return [];
}

function collectHeaderFileFailures(context, relativePath) {
  if (!repoFileExists(context, relativePath)) {
    return [`missing Cloudflare build output header file: ${relativePath}`];
  }

  const blocks = parseHeaderBlocks(readRepoFile(context, relativePath));

  // 只查路由与它自己那条意图断言，不查缓存秒数——缓存时长是业主可调参数，
  // 钉死数字会让业主一改就红而意图完全没坏。
  return [
    ...collectRouteBlockFailures(
      blocks,
      relativePath,
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
    ),
    ...collectRouteBlockFailures(
      blocks,
      relativePath,
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      EXPECTED_DOWNLOADS_NOINDEX,
    ),
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
