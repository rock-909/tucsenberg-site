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
  CATALOG_PATH,
  createValidFiles,
  createVirtualRepo,
  DOWNLOADS_DIR,
} from "./cloudflare-headers-fixtures";

// 这份守的是从 wrangler 4.100.0 移植过来的解析与匹配语义：哪些规则会被它丢掉、
// 一条规则怎么编译成正则、重复路由怎么算、磁盘文件名怎么变成线上被请求的路径。
// 每一条都对应一个曾经真实存在的假绿或误红。
// 门禁要证明什么由 cloudflare-static-asset-headers 那份守。
describe("wrangler _headers semantics the gate ports", () => {
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

  it("ignores a rule whose duplicate placeholder names cannot compile", () => {
    // wrangler 把占位符编译成命名捕获组，`/:x/:x` 会生成两个同名分组，`RegExp`
    // 直接抛异常，`generateRulesMatcher` catch 之后把这条规则整个丢掉。换成匿名
    // 分组它就成了一条正常规则，底下的 noindex 被算作生效，而线上根本没有。
    const duplicateNames = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      "/:x/:x",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": duplicateNames,
        ".open-next/assets/_headers": duplicateNames,
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

  it("ignores rules wrangler itself throws away", () => {
    // wrangler 一条规则最多一个 `*`，也不许 `*` 和 `:splat` 混用，非法的整条跳过。
    // 门禁把这类规则算作生效，就是假绿：线上那个 noindex 根本没被采纳。
    const invalid = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      "/download*/*",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/:splat*",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": invalid,
        ".open-next/assets/_headers": invalid,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("drops the header lines under a route line wrangler rejects", () => {
    // 被丢弃的路由行会把它底下的响应头一起吃掉，而不是让那些头挂到上一个块名下。
    // 把这两行并进 downloads 块，门禁就会说 PDF 有 noindex，而线上 downloads 块
    // 一条头都没有。
    const swallowed = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      "ftp://bad.example/downloads/*",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": swallowed,
        ".open-next/assets/_headers": swallowed,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("ignores a route line longer than wrangler's limit", () => {
    // wrangler 整行忽略超过 2000 字符的行。一条归一化后是 `/downloads/*`、但靠
    // `/./` 填到 2000 以上的规则，线上根本不生效，门禁若认它就是假绿。
    const padding = "/.".repeat(1010);
    const overlong = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      `/downloads${padding}/*`,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    expect(`/downloads${padding}/*`.length).toBeGreaterThan(2000);

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": overlong,
        ".open-next/assets/_headers": overlong,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("ignores rules past wrangler's hundred-rule limit", () => {
    // 第 101 条规则以及之后的整段文件都不生效。把 noindex 写在那之后，线上没有，
    // 门禁若认它就是假绿。
    const filler = Array.from({ length: 100 }, (_, index) =>
      [`/filler-${index}/*`, "  X-Filler: 1", ""].join("\n"),
    ).join("\n");
    const overflowing = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      filler,
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": overflowing,
        ".open-next/assets/_headers": overflowing,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `${CATALOG_PATH} in public/_headers is served without`,
      ),
    );
  });

  it("ignores a detach written on a non-https absolute URL", () => {
    // wrangler 的绝对 URL 只认 https，`http://` 那条整块跳过。算它撤掉了头
    // 就是误红，会拦住一次完全正当的发布。
    const httpDetach = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "http://tucsenberg.com/downloads/*",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": httpDetach,
        ".open-next/assets/_headers": httpDetach,
      }),
    );

    expect(failures).toEqual([]);
  });

  it("ignores a detach written on a host that carries a port", () => {
    // wrangler 明确拒绝带端口的绝对 URL（`validateUrl` 的 disallowPorts）。
    // 算它撤掉了头同样是误红。
    const portDetach = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "https://tucsenberg.com:8080/downloads/*",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": portDetach,
        ".open-next/assets/_headers": portDetach,
      }),
    );

    expect(failures).toEqual([]);
  });

  it("allows the same path under two different https hosts", () => {
    // `https://a.example/x` 和 `https://b.example/x` 在 wrangler 里是两个键，
    // 可以并存。把域名抹掉再比就会把合法配置判成重复，无条件拦住发布。
    const twoHosts = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "https://a.example/downloads/catalog.pdf",
      "  X-Custom: a",
      "",
      "https://b.example/downloads/catalog.pdf",
      "  X-Custom: b",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_headers": twoHosts,
        ".open-next/assets/_headers": twoHosts,
      }),
    );

    expect(failures).toEqual([]);
  });

  it("fails when an encoded-path rule detaches the noindex off a spaced filename", () => {
    // 磁盘上叫 `catalog copy.pdf`，线上被请求的路径是 `/downloads/catalog%20copy.pdf`。
    // 拿带空格的原名去比就什么都匹配不上，这条撤销线上生效而门禁全绿。
    const encodedDetach = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/catalog%20copy.pdf",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${DOWNLOADS_DIR}/catalog copy.pdf`]: "%PDF-1.7",
        "public/_headers": encodedDetach,
        ".open-next/assets/_headers": encodedDetach,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/catalog%20copy.pdf in public/_headers is served without",
      ),
    );
  });

  it("fails when an encoded-path rule detaches the noindex off a caret filename", () => {
    // `^` 不在 URL 规范列出的 path percent-encode set 里，但 Node 照样把它转成
    // `%5E`。手维护一张字符表就会漏掉这种，所以转义要交给 `new URL()` 自己算。
    const caretDetach = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/catalog%5Ecopy.pdf",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${DOWNLOADS_DIR}/catalog^copy.pdf`]: "%PDF-1.7",
        "public/_headers": caretDetach,
        ".open-next/assets/_headers": caretDetach,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/catalog%5Ecopy.pdf in public/_headers is served without",
      ),
    );
  });

  it("keeps a literal percent in a filename distinct from an encoded space", () => {
    // 磁盘上真名叫 `a%20b.pdf` 的文件，线上被请求的路径是 `/downloads/a%2520b.pdf`。
    // 不先把 `%` 转成 `%25`，它会和 `a b.pdf` 撞成同一条路径，一条撤销顶两个文件用。
    const percentDetach = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/a%2520b.pdf",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${DOWNLOADS_DIR}/a%20b.pdf`]: "%PDF-1.7",
        "public/_headers": percentDetach,
        ".open-next/assets/_headers": percentDetach,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/a%2520b.pdf in public/_headers is served without",
      ),
    );
  });

  it("fails when a domain-scoped rule appends a shorter max-age", () => {
    // 域名规则同理。它只在那个域名上生效，所以不能当正面证明；但它在那个域名上
    // 确实把缓存打短了，不能因为「只能减分」就当没看见。
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
});
