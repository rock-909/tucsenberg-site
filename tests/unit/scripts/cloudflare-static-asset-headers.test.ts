import path from "node:path";

import { describe, expect, it } from "vitest";
import {
  collectCloudflareStaticAssetHeaderFailures,
  EXPECTED_DOWNLOADS_HEADER_ROUTE,
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
  EXPECTED_STATIC_ASSET_HEADER_ROUTE,
} from "../../../scripts/quality/checks/cloudflare-static-asset-headers.js";

const ROOT_DIR = "/repo";

function createVirtualRepo(files: Record<string, string>) {
  const normalize = (absolutePath: string) =>
    path.relative(ROOT_DIR, absolutePath).split(path.sep).join("/");

  return {
    rootDir: ROOT_DIR,
    existsSync: (absolutePath: string) =>
      files[normalize(absolutePath)] !== undefined,
    readFileSync: (absolutePath: string) => {
      const content = files[normalize(absolutePath)];
      if (content === undefined) {
        throw new Error(`Missing virtual file: ${normalize(absolutePath)}`);
      }
      return content;
    },
  };
}

function createValidFiles() {
  const headers = [
    EXPECTED_STATIC_ASSET_HEADER_ROUTE,
    `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
    "",
    EXPECTED_DOWNLOADS_HEADER_ROUTE,
    `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
    "  Cache-Control: public,max-age=86400",
    "",
  ].join("\n");

  return {
    "public/_headers": headers,
    ".open-next/assets/_headers": headers,
    "wrangler.jsonc": [
      "{",
      '  "assets": {',
      '    "directory": ".open-next/assets"',
      "  }",
      "}",
      "",
    ].join("\n"),
  };
}

describe("Cloudflare static asset headers proof", () => {
  it("accepts matching source and OpenNext asset headers", () => {
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(createValidFiles()),
    );

    expect(failures).toEqual([]);
  });

  it("requires the OpenNext asset output to contain _headers", () => {
    const files = createValidFiles();
    delete files[".open-next/assets/_headers"];

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContain(
      "missing Cloudflare build output header file: .open-next/assets/_headers",
    );
  });

  it("requires the asset output cache rule to match the source rule", () => {
    const files = {
      ...createValidFiles(),
      ".open-next/assets/_headers": [
        EXPECTED_STATIC_ASSET_HEADER_ROUTE,
        "  Cache-Control: public,max-age=60",
        "",
      ].join("\n"),
    };

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContain(
      `"${EXPECTED_STATIC_ASSET_HEADER_ROUTE}" in .open-next/assets/_headers does not carry "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}"`,
    );
  });

  it("fails when the downloads block is missing from the source header file", () => {
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers":
          "/_next/static/*\n  Cache-Control: public,max-age=31536000,immutable\n",
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining('missing "/downloads/*" in public/_headers'),
    );
  });

  it("fails when the built artifact lost the pdf noindex rule", () => {
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        ".open-next/assets/_headers":
          "/_next/static/*\n  Cache-Control: public,max-age=31536000,immutable\n\n/downloads/*\n  Cache-Control: public,max-age=86400\n",
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        '"/downloads/*" in .open-next/assets/_headers does not carry "X-Robots-Tag: noindex"',
      ),
    );
  });

  it("fails when noindex sits in another route block instead of downloads", () => {
    // 全文件查字符串会在这里假绿：两个子串都还在文件里，但 PDF 已经能被收录。
    const misplaced = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "  Cache-Control: public,max-age=86400",
      "",
      "/images/*",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": misplaced,
        ".open-next/assets/_headers": misplaced,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `"${EXPECTED_DOWNLOADS_HEADER_ROUTE}" in public/_headers does not carry "${EXPECTED_DOWNLOADS_NOINDEX}"`,
      ),
    );
    expect(failures).toContainEqual(
      expect.stringContaining(
        `"${EXPECTED_DOWNLOADS_HEADER_ROUTE}" in .open-next/assets/_headers does not carry "${EXPECTED_DOWNLOADS_NOINDEX}"`,
      ),
    );
  });

  it("fails when noindex only sits under an absolute-URL route line", () => {
    // Cloudflare 允许路由行写成带域名的绝对 URL。不把它当路由行，noindex 就会被
    // 算到上一个块名下——检查绿，而这条头到底生不生效取决于域名匹配。
    const domainScoped = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "  Cache-Control: public,max-age=86400",
      "",
      "https://tucsenberg.com/downloads/*",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": domainScoped,
        ".open-next/assets/_headers": domainScoped,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `"${EXPECTED_DOWNLOADS_HEADER_ROUTE}" in public/_headers does not carry "${EXPECTED_DOWNLOADS_NOINDEX}"`,
      ),
    );
  });

  it("passes when the same headers use HTTP-standard spacing", () => {
    // `public, max-age=86400` 和 `public,max-age=86400` 是同一条头。业主重排一次
    // 格式就变红，是门禁在说谎，不是意图坏了。
    const spaced = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      "  Cache-Control: public, max-age=31536000, immutable",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "  Cache-Control: public, max-age=86400",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": spaced,
        ".open-next/assets/_headers": spaced,
      }),
    );

    expect(failures).toEqual([]);
  });

  it("passes when a route is split across two blocks", () => {
    // 同一路由写两个块是合法的，Cloudflare 会合并。只看第一个块就会误红。
    const split = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "  Cache-Control: public,max-age=86400",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": split,
        ".open-next/assets/_headers": split,
      }),
    );

    expect(failures).toEqual([]);
  });
});
