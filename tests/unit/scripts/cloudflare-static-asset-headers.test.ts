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
      `/_next/static/chunks/main.js in .open-next/assets/_headers does not carry "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}"`,
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
      expect.stringContaining(
        "/downloads/product-spec.pdf in public/_headers is served without",
      ),
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
        "/downloads/product-spec.pdf in .open-next/assets/_headers is served without",
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
        "/downloads/product-spec.pdf in public/_headers is served without",
      ),
    );
    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/product-spec.pdf in .open-next/assets/_headers is served without",
      ),
    );
  });

  it("fails when noindex only sits under an absolute-URL route line", () => {
    // 带域名的规则只对那一个域名生效，而这里不知道线上会用哪个域名（预览域名
    // 就是另一个）。拿它当证明就是假绿：PDF 在实际域名上照样能被收录。
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
        "/downloads/product-spec.pdf in public/_headers is served without",
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

  it("fails when the noindex value itself is misspelled with a space", () => {
    // 抹平空格只该抹分隔符两侧的。`no index` 不是 `noindex`，Google 不认，
    // PDF 照样被收录——这条必须红。
    const misspelled = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "  X-Robots-Tag: no index",
      "  Cache-Control: public,max-age=86400",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": misspelled,
        ".open-next/assets/_headers": misspelled,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `/downloads/product-spec.pdf in public/_headers does not carry "${EXPECTED_DOWNLOADS_NOINDEX}"`,
      ),
    );
  });

  it("passes when the noindex rule is strengthened with more directives", () => {
    // `noindex, nofollow` 比只写 noindex 更严。门禁不能拦着业主加强防护——
    // 一个逼人不许改好的检查，该改的是检查。
    const stronger = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "  X-Robots-Tag: noindex, nofollow",
      "  Cache-Control: public,max-age=86400",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": stronger,
        ".open-next/assets/_headers": stronger,
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

  it("fails when a more specific downloads route detaches the noindex", () => {
    // Cloudflare 允许 `! Header-Name` 把上层规则设的头撤掉。通配块写着 noindex、
    // 更具体的那个 PDF 把它撤掉，被放出去的正是那一个文件，而通配块看起来完全正常。
    const detached = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/private.pdf",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": detached,
        ".open-next/assets/_headers": detached,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        '"/downloads/private.pdf" in public/_headers detaches',
      ),
    );
  });

  it("passes when the noindex rule is written as the equivalent none", () => {
    // Google 定义 `none` 等于 `noindex, nofollow`，比只写 noindex 更严。
    // 把它判红等于逼着业主改弱防护。
    const none = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "  X-Robots-Tag: none",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": none,
        ".open-next/assets/_headers": none,
      }),
    );

    expect(failures).toEqual([]);
  });

  it("passes when one header's directives are split across two blocks", () => {
    // Cloudflare 对同名响应头按逗号合并，所以这两个块合起来就是完整的那一条。
    // 逐行比对会说它不完整，那是门禁看不懂，不是配置错了。
    const split = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      "  Cache-Control: public, max-age=31536000",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      "  Cache-Control: immutable",
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
