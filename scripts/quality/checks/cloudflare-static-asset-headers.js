const fs = require("node:fs");
const path = require("node:path");

const EXPECTED_STATIC_ASSET_HEADER_ROUTE = "/_next/static/*";
const EXPECTED_STATIC_ASSET_CACHE_CONTROL = "public,max-age=31536000,immutable";
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

function collectHeaderFileFailures(context, relativePath) {
  const failures = [];

  if (!repoFileExists(context, relativePath)) {
    failures.push(
      `missing Cloudflare build output header file: ${relativePath}`,
    );
    return failures;
  }

  const headers = readRepoFile(context, relativePath);

  if (!headers.includes(EXPECTED_STATIC_ASSET_HEADER_ROUTE)) {
    failures.push(
      `missing "${EXPECTED_STATIC_ASSET_HEADER_ROUTE}" in ${relativePath}`,
    );
  }

  if (!headers.includes(EXPECTED_STATIC_ASSET_CACHE_CONTROL)) {
    failures.push(
      `missing "${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" in ${relativePath}`,
    );
  }

  return failures;
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
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
  EXPECTED_STATIC_ASSET_HEADER_ROUTE,
  OPENNEXT_ASSET_HEADERS_PATH,
  SOURCE_HEADERS_PATH,
  collectCloudflareStaticAssetHeaderFailures,
  createCloudflareStaticAssetHeaderContext,
  runCloudflareStaticAssetHeaderCli,
};
