import { describe, expect, it, vi } from "vitest";
import {
  collectCloudflareStaticAssetHeaderFailures,
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
  runCloudflareStaticAssetHeaderCli,
} from "../../../scripts/quality/checks/cloudflare-static-asset-headers.js";

import {
  ASSETS_DIR,
  BUILT_DOWNLOADS_DIR,
  BUNDLE_PATH,
  CATALOG_PATH,
  createValidFiles,
  createVirtualRepo,
  DOWNLOADS_DIR,
  EXPECTED_DOWNLOADS_HEADER_ROUTE,
  EXPECTED_STATIC_ASSET_HEADER_ROUTE,
} from "./cloudflare-headers-fixtures";

// 这份守的是门禁要证明什么：每个真实 PDF 拿到 noindex，每个真实 bundle 拿到一年
// immutable 缓存，以及哪些等价写法不该被判红。
// 哪些文件会被发布、线上被请求的 URL 是哪一条，由 cloudflare-headers-published-surface
// 守；移植过来的 wrangler 解析与匹配语义由 cloudflare-headers-wrangler-semantics 守。
describe("Cloudflare static asset headers proof", () => {
  it("keeps the cache and crawl policy it exists to enforce", () => {
    // 其余每一条断言的期望值都是从这两个常量拼出来的，所以它们只证明「实现和自己的
    // 常量一致」。把常量削掉 `immutable`，真实 `_headers` 是超集、门禁照样全绿，
    // 没有一条会红——策略本身必须单独钉住。
    expect(EXPECTED_STATIC_ASSET_CACHE_CONTROL).toContain("max-age=31536000");
    expect(EXPECTED_STATIC_ASSET_CACHE_CONTROL).toContain("immutable");
    expect(EXPECTED_DOWNLOADS_NOINDEX.toLowerCase()).toContain("noindex");
  });

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

  it("fails when noindex only applies to one named crawler", () => {
    // Google 的写法是 `<爬虫名>: <指令>[, <指令>…]`，爬虫名后面那一整串都只属于
    // 那个爬虫。只按逗号拆的话，`bingbot: nosnippet, noindex` 里的 noindex 会被当成
    // 全局指令，而 Googlebot 收到的那一行对它一条都不生效，PDF 照样被收录。
    const scoped = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "  X-Robots-Tag: bingbot: nosnippet, noindex",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": scoped,
        ".open-next/assets/_headers": scoped,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers does not carry "${EXPECTED_DOWNLOADS_NOINDEX}"`,
      ),
    );
  });

  it("fails when a cache-killing directive carries a parameter", () => {
    // 客户端按 name=value 取名字，`no-store=1` 的名字就是 no-store，浏览器照样不
    // 缓存。只比整词的话加个 `=1` 就绕过去了。
    const parameterised = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      BUNDLE_PATH,
      "  Cache-Control: no-store=1",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": parameterised,
        ".open-next/assets/_headers": parameterised,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but no-store=1 overrides it`,
      ),
    );
  });

  it("fails when private or no-cache overrides the one-year cache", () => {
    // no-store 之外的两个同样会让「缓存一年」这句话不成立，名单少一个就漏一个。
    for (const directive of ["no-cache", "private"]) {
      const overridden = [
        EXPECTED_STATIC_ASSET_HEADER_ROUTE,
        `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
        "",
        BUNDLE_PATH,
        `  Cache-Control: ${directive}`,
        "",
        EXPECTED_DOWNLOADS_HEADER_ROUTE,
        `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
        "",
      ].join("\n");

      const failures = collectCloudflareStaticAssetHeaderFailures(
        createVirtualRepo({
          ...createValidFiles(),
          "public/_headers": overridden,
          ".open-next/assets/_headers": overridden,
        }),
      );

      expect(failures).toContainEqual(
        expect.stringContaining(
          `${BUNDLE_PATH} in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but ${directive} overrides it`,
        ),
      );
    }
  });

  it("fails when a shorter s-maxage sits beside the expected max-age", () => {
    const shorterShared = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      BUNDLE_PATH,
      "  Cache-Control: s-maxage = 0",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": shorterShared,
        ".open-next/assets/_headers": shorterShared,
      }),
    );

    // 等号两侧的空格也要抹平，否则换个写法就绕过冲突检测。
    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but s-maxage=0 overrides it`,
      ),
    );
  });

  it("fails when a header name the runtime rejects would break the response", () => {
    // wrangler 的文本解析器只拦带空格的头名。`Bad@Name` 进得去，发资产时
    // `headers.set()` 抛异常，整个响应 500——那份 PDF 根本发不出来。
    const invalid = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "  Bad@Name: value",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": invalid,
        [`${ASSETS_DIR}/_headers`]: invalid,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        '"bad@name" under "/downloads/*" in public/_headers is not a header the runtime accepts',
      ),
    );
  });

  // 判红时唯一那句行动建议必须成立。只有构建产物那一侧的失败才该指向「先跑构建」；
  // git 跟踪的源文件坏了，构建一万次也是同一条红，把业主指过去等于让他白等 20 分钟。
  const buildHintCases = [
    {
      name: "a duplicated route",
      wants: false,
      break: (files: Record<string, string>) => {
        const duplicated = [
          EXPECTED_STATIC_ASSET_HEADER_ROUTE,
          `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
          "",
          EXPECTED_DOWNLOADS_HEADER_ROUTE,
          `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
          "",
          EXPECTED_DOWNLOADS_HEADER_ROUTE,
          "  Cache-Control: public,max-age=86400",
          "",
        ].join("\n");
        files["public/_headers"] = duplicated;
        files[`${ASSETS_DIR}/_headers`] = duplicated;
      },
    },
    {
      name: "a deleted source _headers",
      wants: false,
      break: (files: Record<string, string>) => delete files["public/_headers"],
    },
    {
      name: "an emptied source downloads directory",
      wants: false,
      break: (files: Record<string, string>) => {
        delete files[`${DOWNLOADS_DIR}/catalog.pdf`];
        delete files[`${DOWNLOADS_DIR}/spec-sheet.pdf`];
      },
    },
    {
      name: "a missing built _headers",
      wants: true,
      break: (files: Record<string, string>) =>
        delete files[`${ASSETS_DIR}/_headers`],
    },
    {
      name: "an emptied built downloads directory",
      wants: true,
      break: (files: Record<string, string>) => {
        delete files[`${BUILT_DOWNLOADS_DIR}/catalog.pdf`];
        delete files[`${BUILT_DOWNLOADS_DIR}/spec-sheet.pdf`];
      },
    },
  ];

  it.each(buildHintCases)(
    "$wants: tells the owner to build when the red is $name",
    ({ wants, break: breakFiles }) => {
      const errors: string[] = [];
      const spy = vi
        .spyOn(console, "error")
        .mockImplementation((message: unknown) => {
          errors.push(String(message));
        });

      try {
        const files = createValidFiles();
        breakFiles(files);

        expect(
          runCloudflareStaticAssetHeaderCli(createVirtualRepo(files)),
        ).toBe(false);
        if (wants) {
          expect(errors.join("\n")).toContain("pnpm website:build:cf");
        } else {
          expect(errors.join("\n")).not.toContain("pnpm website:build:cf");
        }
      } finally {
        spy.mockRestore();
      }
    },
  );
});
