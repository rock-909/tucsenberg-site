import { describe, expect, it } from "vitest";
import {
  collectCloudflareStaticAssetHeaderFailures,
  EXPECTED_DOWNLOADS_HEADER_ROUTE,
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
  EXPECTED_STATIC_ASSET_HEADER_ROUTE,
} from "../../../scripts/quality/checks/cloudflare-static-asset-headers.js";

import {
  ASSETS_DIR,
  BUILT_DOWNLOADS_DIR,
  BUNDLE_NAME,
  BUNDLE_PATH,
  CATALOG_PATH,
  createValidFiles,
  createVirtualRepo,
  DOWNLOADS_DIR,
  STATIC_DIR,
} from "./cloudflare-headers-fixtures";

// 这份守的是门禁要证明什么：每个真实 PDF 拿到 noindex，每个真实 bundle 拿到一年
// immutable 缓存，以及哪些等价写法不该被判红。
// 移植过来的 wrangler 解析与匹配语义由 cloudflare-headers-wrangler-semantics 守。
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
      `${BUNDLE_PATH} in .open-next/assets/_headers does not carry "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}"`,
    );
  });

  it("fails when a real bundle has its cache rule detached", () => {
    // 撤销可以精确落在某个真实哈希文件上。以前探的是写死的
    // `/_next/static/chunks/main.js`，那个文件在构建产物里根本不存在，于是这条
    // 撤销线上生效、bundle 失去一年缓存，而门禁全绿。
    const detached = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      BUNDLE_PATH,
      "  ! Cache-Control",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
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
        `${BUNDLE_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("fails when a bundle rule appends a directive that kills the cache", () => {
    // wrangler 用 append 拼接同名头，指令是并起来的。通配块给了一年 immutable、
    // 精确规则再追加 no-store，三个期望 token 一个不少，而那个文件线上一秒都不会
    // 被缓存。只看「要的指令都在」就会在这里假绿。
    const killed = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      BUNDLE_PATH,
      "  Cache-Control: no-store",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": killed,
        ".open-next/assets/_headers": killed,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but no-store overrides it`,
      ),
    );
  });

  it("fails when a bundle rule appends a second, shorter max-age", () => {
    // 同时挂着两个时长，线上按哪个算是不确定的，同样不能算「缓存一年」的证明。
    const shortened = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      BUNDLE_PATH,
      "  Cache-Control: max-age=0",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": shortened,
        ".open-next/assets/_headers": shortened,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but max-age=0 overrides it`,
      ),
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
        `${CATALOG_PATH} in public/_headers is served without`,
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
        `${CATALOG_PATH} in .open-next/assets/_headers is served without`,
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
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in .open-next/assets/_headers is served without`,
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
        `${CATALOG_PATH} in public/_headers is served without`,
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
        `${CATALOG_PATH} in public/_headers does not carry "${EXPECTED_DOWNLOADS_NOINDEX}"`,
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

  it("fails when a nested download loses its noindex", () => {
    // 只列第一层目录项时，`/downloads/nested` 会被当成一个文件去探，底下真实的
    // PDF 一个都没查。按产品或语言分子目录之后，PDF 能被收录而门禁全绿。
    const nested = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/nested/regional.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${DOWNLOADS_DIR}/nested/regional.pdf`]: "%PDF-1.7",
        "public/_headers": nested,
        ".open-next/assets/_headers": nested,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/nested/regional.pdf in public/_headers is served without",
      ),
    );
  });

  it("fails when a dot-prefixed download loses its noindex", () => {
    // 点号开头不等于不发布。Workers Assets 只在资产根目录排掉 `.assetsignore`、
    // `_redirects`、`_headers`，别的照传。跳过它们，一份能被搜索引擎抓到的 PDF
    // 就完全没人证明过。
    const hidden = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/.secret.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${DOWNLOADS_DIR}/.secret.pdf`]: "%PDF-1.7",
        "public/_headers": hidden,
        ".open-next/assets/_headers": hidden,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/.secret.pdf in public/_headers is served without",
      ),
    );
  });

  it("fails when a symlinked download loses its noindex", () => {
    // wrangler 建上传清单用的是 stat，会跟随符号链接，所以指向真实文件的链接照样
    // 被发布。按 Dirent 判「是不是普通文件」会把它整个漏掉，一条精确撤销落在链接
    // 上就没人管。
    const linkedDetach = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/linked.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");
    const files = createValidFiles();
    files[`${BUILT_DOWNLOADS_DIR}/linked.pdf`] = "%PDF-1.7";
    files["public/_headers"] = linkedDetach;
    files[`${ASSETS_DIR}/_headers`] = linkedDetach;

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files, new Set([`${BUILT_DOWNLOADS_DIR}/linked.pdf`])),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/linked.pdf in public/_headers is served without",
      ),
    );
  });

  it("fails when the downloads source directory holds nothing to prove", () => {
    // 目录被改名或清空，逐文件证明就一条都不剩，门禁会安安静静地全绿。
    // 「没有可证明的东西」在这里必须是失败。
    const files = createValidFiles();
    delete files[`${DOWNLOADS_DIR}/catalog.pdf`];
    delete files[`${DOWNLOADS_DIR}/spec-sheet.pdf`];

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(`${DOWNLOADS_DIR} holds no files`),
    );
  });

  it("fails when the published downloads directory holds nothing to prove", () => {
    // 源目录还在、构建产物那一份空了，发布出去的就是一个空目录。只查源目录的话
    // 这里全绿。
    const files = createValidFiles();
    delete files[`${BUILT_DOWNLOADS_DIR}/catalog.pdf`];
    delete files[`${BUILT_DOWNLOADS_DIR}/spec-sheet.pdf`];

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(`${BUILT_DOWNLOADS_DIR} holds no files`),
    );
  });

  it("fails when a download exists only in the published output", () => {
    // 构建时才生成的 PDF 只存在于资产目录里。拿源目录的文件清单当发布清单，
    // 它就完全没被证明过——一条精确撤销落在它头上，门禁毫无反应。
    const generatedDetach = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/generated-only.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${BUILT_DOWNLOADS_DIR}/generated-only.pdf`]: "%PDF-1.7",
        "public/_headers": generatedDetach,
        [`${ASSETS_DIR}/_headers`]: generatedDetach,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/generated-only.pdf in public/_headers is served without",
      ),
    );
  });

  it("reads the published directory out of wrangler config, not out of a comment", () => {
    // 只查字符串的话，一句 `// old: ".open-next/assets"` 的注释就能让门禁通过，
    // 而 wrangler 实际发布的是 dist——门禁去证明一个根本不会上线的目录。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "wrangler.jsonc": [
          "{",
          '  // old: ".open-next/assets"',
          '  "assets": {',
          '    "directory": "dist"',
          "  }",
          "}",
          "",
        ].join("\n"),
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining("dist/downloads holds no files"),
    );
  });

  it("stops when wrangler config declares no assets directory", () => {
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "wrangler.jsonc": '{ "name": "tucsenberg-site" }\n',
      }),
    );

    expect(failures).toEqual([
      "wrangler.jsonc has no assets.directory, so there is no way to tell which files get published",
    ]);
  });

  it("fails when the static asset output holds nothing to prove", () => {
    // 构建产物没跑或者被清空时，静态资源那一侧同样一条证明都不剩。
    const files = createValidFiles();
    delete files[`${STATIC_DIR}/chunks/${BUNDLE_NAME}`];
    delete files[`${STATIC_DIR}/media/logo.svg`];

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(`${STATIC_DIR} holds no files`),
    );
  });
});
