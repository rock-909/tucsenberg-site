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
const DOWNLOADS_DIR = "public/downloads";
const CATALOG_PATH = "/downloads/catalog.pdf";

function createVirtualRepo(files: Record<string, string>) {
  const normalize = (absolutePath: string) =>
    path.relative(ROOT_DIR, absolutePath).split(path.sep).join("/");

  return {
    rootDir: ROOT_DIR,
    // 目录也要认。门禁先问 public/downloads 在不在，再列它——只认文件的话
    // 目录永远"不存在"，逐文件证明一条都跑不起来。
    existsSync: (absolutePath: string) => {
      const key = normalize(absolutePath);
      return (
        files[key] !== undefined ||
        Object.keys(files).some((name) => name.startsWith(`${key}/`))
      );
    },
    readFileSync: (absolutePath: string) => {
      const content = files[normalize(absolutePath)];
      if (content === undefined) {
        throw new Error(`Missing virtual file: ${normalize(absolutePath)}`);
      }
      return content;
    },
    // 返回 Dirent 形状，和真实 readdirSync(dir, { withFileTypes: true }) 一致。
    // 替身只返回字符串的话，「目录不算文件」这条根本没法被测出来。
    readdirSync: (absolutePath: string) => {
      const prefix = `${normalize(absolutePath)}/`;
      const names = new Set(
        Object.keys(files)
          .filter((name) => name.startsWith(prefix))
          .map((name) => name.slice(prefix.length).split("/")[0] as string),
      );
      return [...names].map((name) => ({
        name,
        isDirectory: () =>
          Object.keys(files).some((file) =>
            file.startsWith(`${prefix}${name}/`),
          ),
      }));
    },
  };
}

function createValidFiles(): Record<string, string> {
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
    // 两个文件而不是一个：证明的是"每个真实发布的 PDF"，不是"某一条写死的路径"。
    [`${DOWNLOADS_DIR}/catalog.pdf`]: "%PDF-1.7",
    [`${DOWNLOADS_DIR}/spec-sheet.pdf`]: "%PDF-1.7",
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
      CATALOG_PATH,
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
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("fails when a placeholder route detaches the noindex off a real pdf", () => {
    // 占位符路由不以 /downloads 开头，按前缀找撤销的写法完全看不见它——而
    // `/:section/catalog.pdf` 会命中 `/downloads/catalog.pdf`，那个 PDF 的
    // noindex 就这么没了。命中与否必须走路径匹配，不能靠字符串前缀猜。
    const placeholder = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/:section/catalog.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": placeholder,
        ".open-next/assets/_headers": placeholder,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("stays quiet when a detach targets a route no real download sits under", () => {
    // `/downloads-archive/*` 以 "/downloads" 开头，但它下面一个真实文件都没有。
    // 按字符串前缀找撤销会在这里误红，拦住一次完全正当的发布。
    const archive = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads-archive/*",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": archive,
        ".open-next/assets/_headers": archive,
      }),
    );

    expect(failures).toEqual([]);
  });

  it("still fails when a domain-scoped rule detaches the noindex off a real pdf", () => {
    // 域名规则只能减分不能加分，撤销这一侧 fail closed：这里不知道线上跑在哪个
    // 域名上，宁可多红一次，也不能放一个能被收录的 PDF 出去。
    const domainDetach = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "https://tucsenberg.com/downloads/*",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": domainDetach,
        ".open-next/assets/_headers": domainDetach,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("fails when a numeric placeholder detaches the noindex off a real pdf", () => {
    // wrangler 的占位符是 `:[A-Za-z]\w*`，`\w` 含数字。按感觉写成 `[a-z_]+` 的话
    // `:section2` 只被吃掉 `:section`，剩个字面量 `2`，于是这条撤销规则线上生效、
    // 门禁完全看不见。
    const numbered = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/:section2/catalog.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": numbered,
        ".open-next/assets/_headers": numbered,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
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

  it("fails when the same route is declared twice through an equivalent path", () => {
    // wrangler 存规则前会用 `new URL()` 规范化，`/downloads/./*` 和 `/downloads/*`
    // 是同一个键，后写的整块盖掉先写的。只比原始字符串的话这条检测一绕就过。
    const equivalent = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/./*",
      "  Cache-Control: public,max-age=86400",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": equivalent,
        ".open-next/assets/_headers": equivalent,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `"${EXPECTED_DOWNLOADS_HEADER_ROUTE}" is declared twice in public/_headers`,
      ),
    );
  });

  it("fails when the same route is declared twice", () => {
    // wrangler 4.100.0 用 `rules[rule.path] = configuredRule` 存规则，后一个整块
    // 盖掉前一个。把两块合并是门禁替线上做主：它说缓存一年 immutable 齐了，
    // 实际只剩后半条。
    const duplicated = [
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
        "public/_headers": duplicated,
        ".open-next/assets/_headers": duplicated,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `"${EXPECTED_STATIC_ASSET_HEADER_ROUTE}" is declared twice in public/_headers`,
      ),
    );
  });

  it("fails when the downloads directory holds nothing to prove", () => {
    // 目录被改名或清空，逐文件证明就一条都不剩，门禁会安安静静地全绿。
    // 「没有可证明的东西」在这里必须是失败。
    const files = createValidFiles();
    delete files[`${DOWNLOADS_DIR}/catalog.pdf`];
    delete files[`${DOWNLOADS_DIR}/spec-sheet.pdf`];
    // 留一个只有空子目录的情况：目录不能被算成「有东西可证明」。
    files[`${DOWNLOADS_DIR}/nested/.keep`] = "";

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(`${DOWNLOADS_DIR} holds no files`),
    );
  });
});
