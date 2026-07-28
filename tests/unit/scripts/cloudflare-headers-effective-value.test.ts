import { describe, expect, it } from "vitest";
import {
  collectCloudflareStaticAssetHeaderFailures,
  EXPECTED_DOWNLOADS_HEADER_ROUTE,
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
  EXPECTED_STATIC_ASSET_HEADER_ROUTE,
} from "../../../scripts/quality/checks/cloudflare-static-asset-headers.js";

import {
  BUNDLE_PATH,
  createValidFiles,
  createVirtualRepo,
  STATIC_DIR,
} from "./cloudflare-headers-fixtures";

// 这份守的是「一个路径最终拿到的那条响应头到底是什么」：多条规则怎么拼、撤销行怎么
// 记、引号里的逗号不算分隔符、占位符替换进值里、域名场景怎么隔离。
// 规则本身怎么被解析和匹配由 cloudflare-headers-wrangler-semantics 守；门禁要证明
// 什么由 cloudflare-static-asset-headers 守。
describe("effective header value semantics", () => {
  it("keeps an unset name exactly as wrangler leaves it", () => {
    // wrangler 只吃掉第一个 `"! "`，多出来的空格留在头名里，运行时
    // `headers.delete(" X-Cache")` 抛异常，整个响应 500。门禁替它 trim 掉就探不出来。
    const paddedUnset = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "  !  X-Cache-Status",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": paddedUnset,
        ".open-next/assets/_headers": paddedUnset,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        '"!  X-Cache-Status" under "/downloads/*" in public/_headers is not a header the runtime accepts',
      ),
    );
  });

  it("fails when a domain-scoped rule appends a shorter max-age", () => {
    // 域名规则同理。它只在 tucsenberg.com 上生效，但在那个场景里它确实把缓存
    // 打短了，一年缓存那句保证在那里就是假的。
    const domainShortens = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      `https://tucsenberg.com${BUNDLE_PATH}`,
      "  Cache-Control: max-age=0",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": domainShortens,
        ".open-next/assets/_headers": domainShortens,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but max-age=0 overrides it`,
      ),
    );
  });

  it("does not count directives that only appear inside quotes", () => {
    // HTTP 的字段值允许 quoted-string，里面的逗号是内容不是分隔符。直接按逗号拆，
    // 这一条只有一个扩展指令的头会被拆出正好凑齐期望的 token，每个真实 bundle
    // 都假绿，而线上根本没有一年缓存。
    const quoted = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      '  Cache-Control: foo="x,public,max-age=31536000,immutable,y"',
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": quoted,
        ".open-next/assets/_headers": quoted,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers does not carry "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}"`,
      ),
    );
  });

  it("does not count a quoted directive that hides behind an escaped quote", () => {
    // 引号里的反斜杠是转义，`\"` 不结束 quoted-string。不认这条转义的话，后面那些
    // token 会被当成独立指令，而它们全在引号内部，那个文件一条缓存指令都没有。
    const escaped = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      '  Cache-Control: foo="a\\",public,max-age=31536000,immutable,b"',
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": escaped,
        ".open-next/assets/_headers": escaped,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers does not carry "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}"`,
      ),
    );
  });

  it("refuses to judge a header value whose quotes never close", () => {
    // wrangler 用 append 把多条命中规则的同名头拼成一条，客户端只解析一次。前一条
    // 留一个不闭合的引号、后一条把它关掉，拼起来 `no-store` 落在引号外是真指令。
    // 拆不出确定结果就判红，不猜。
    const unbalanced = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      "/_next/static/chunks/*",
      '  Cache-Control: foo="x',
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": unbalanced,
        ".open-next/assets/_headers": unbalanced,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers is served "cache-control:`,
      ),
    );
  });

  it("substitutes a captured placeholder into the header value", () => {
    // wrangler 会把捕获到的值替换进响应头的值里。构建产物里只要有一个文件叫
    // `no-store`，这条规则给它发的就是 `Cache-Control: no-store`，一年缓存当场
    // 作废。只看字面量 `:directive` 的话，它不在任何冲突指令名单里，检查全绿。
    const substituted = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      "/_next/static/:directive",
      "  Cache-Control: :directive",
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${STATIC_DIR}/no-store`]: "console.log(1)",
        "public/_headers": substituted,
        ".open-next/assets/_headers": substituted,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `/_next/static/no-store in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but no-store overrides it`,
      ),
    );
  });

  it("does not let one host's unset erase another host's damage", () => {
    // 把所有域名的规则堆在一份状态里算，它们会互相抵消：a.example 加上的
    // `no-store` 被 b.example 的撤销抹掉，再被后面一条通用规则补回期望值，最后
    // 一片干净。但这两个域名的规则永远不会同时跑在一个响应上——a.example 上那份
    // bundle 实际带着 `no-store`，一年缓存那句保证在那里是假的。
    const twoHosts = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      "https://a.example/_next/static/chunks/*",
      "  Cache-Control: no-store",
      "",
      "https://b.example/_next/static/chunks/*",
      "  ! Cache-Control",
      "",
      "/_next/static/chunks/*",
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": twoHosts,
        ".open-next/assets/_headers": twoHosts,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${BUNDLE_PATH} in public/_headers carries "Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}" but no-store overrides it on https://a.example`,
      ),
    );
  });
});
