import { describe, expect, it } from "vitest";
import {
  collectCloudflareStaticAssetHeaderFailures,
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
} from "../../../scripts/quality/checks/cloudflare-static-asset-headers.js";

import {
  ASSETS_DIR,
  BUILT_DOWNLOADS_DIR,
  BUNDLE_NAME,
  createValidFiles,
  createVirtualRepo,
  DOWNLOADS_DIR,
  STATIC_DIR,
  EXPECTED_DOWNLOADS_HEADER_ROUTE,
  EXPECTED_STATIC_ASSET_HEADER_ROUTE,
} from "./cloudflare-headers-fixtures";

// 这份守的是「哪些文件会被发布出去」：目录怎么递归枚举、点号文件和符号链接算不算、
// 磁盘文件名怎么变成线上被请求的那条 URL、配置里的资产目录怎么读、哪些别名和旁路
// 文件让这套模型算不出来。
// 目录名本身算不算得出来由 cloudflare-headers-directory-resolution 守。
describe("Cloudflare published asset surface", () => {
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
      createVirtualRepo(files, {
        symlinks: new Set([`${BUILT_DOWNLOADS_DIR}/linked.pdf`]),
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/linked.pdf in public/_headers is served without",
      ),
    );
  });

  it("proves the encoded url a file is actually served from", () => {
    // Workers Assets 只在逐段 encodeURIComponent 之后那条 URL 上返回 200，别的形式
    // 一律 307 跳过去。`,` 这类字符 `new URL().pathname` 不转义，算出来的就不是那条
    // 真正会发文件的 URL，落在真 URL 上的撤销门禁完全看不见。
    const encodedDetach = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/spec%2Crev2.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${BUILT_DOWNLOADS_DIR}/spec,rev2.pdf`]: "%PDF-1.7",
        "public/_headers": encodedDetach,
        [`${ASSETS_DIR}/_headers`]: encodedDetach,
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/spec%2Crev2.pdf in public/_headers is served without",
      ),
    );
  });

  it("fails when a download inside a symlinked directory loses its noindex", () => {
    // wrangler 的 `readdir(recursive)` 会走进符号链接目录，`stat` 再跟随链接，所以
    // 整棵子树都会上线。按 Dirent 判「是不是目录」会把它整棵跳过。
    const linkedDirDetach = [
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/linked/inside.pdf",
      "  ! X-Robots-Tag",
      "",
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(
        {
          ...createValidFiles(),
          [`${BUILT_DOWNLOADS_DIR}/linked/inside.pdf`]: "%PDF-1.7",
          "public/_headers": linkedDirDetach,
          [`${ASSETS_DIR}/_headers`]: linkedDirDetach,
        },
        { symlinks: new Set([`${BUILT_DOWNLOADS_DIR}/linked`]) },
      ),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/linked/inside.pdf in public/_headers is served without",
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
      expect.stringContaining(`${BUILT_DOWNLOADS_DIR} holds no built files`),
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
      expect.stringContaining("dist/downloads holds no built files"),
    );
  });

  it("fails when a published download is an html file", () => {
    // Workers Assets 默认从去掉扩展名的那条 URL 发 `.html`，响应头按请求里的原始
    // 路径匹配。按磁盘文件名枚举出来的是另一条路径，落在别名上的撤销看不见。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${BUILT_DOWNLOADS_DIR}/alias.pdf.html`]: "<html></html>",
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/alias.pdf.html in .open-next/assets/downloads is served from its extensionless alias instead",
      ),
    );
  });

  it("fails when the assets root holds a _redirects file", () => {
    // `200` 是重写不是跳转：另一条 URL 直接把 PDF 发出去，而 `/downloads/*` 底下
    // 的 noindex 根本不参与匹配。目标可以带占位符、可以百分号编码，字符串扫描
    // 拦不住，所以见到这个文件就判红。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${ASSETS_DIR}/_redirects`]: "/:x-alias /:x/catalog.pdf 200\n",
      }),
    );

    expect(failures).toContainEqual(
      `${ASSETS_DIR}/_redirects changes which files are published and on which URLs, and this check cannot model it`,
    );
  });

  it("fails when the source public root holds a _redirects file", () => {
    // 构建会把 `public/` 的东西复制进资产目录，所以源目录里新加的这个文件下次构建
    // 就会生效。只查资产目录的话，改动进了仓库、门禁还是绿的。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "public/_redirects": "/catalog /downloads/catalog.pdf 200\n",
      }),
    );

    expect(failures).toContainEqual(
      "public/_redirects changes which files are published and on which URLs, and this check cannot model it",
    );
  });

  it("fails when the assets root holds an .assetsignore file", () => {
    // 它决定哪些文件根本不上传。整段忽略掉 downloads 之后，磁盘上 PDF 一个不少、
    // 门禁全绿，线上却全部 404。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${ASSETS_DIR}/.assetsignore`]: "/downloads/**\n",
      }),
    );

    expect(failures).toContainEqual(
      `${ASSETS_DIR}/.assetsignore changes which files are published and on which URLs, and this check cannot model it`,
    );
  });

  it("proves every directory a named environment publishes", () => {
    // 线上是 `--env production` 发的，而命名环境可以覆盖 assets.directory。
    // 只读顶层的话，换个目录门禁照样全绿，证明的是一个不会上线的目录。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "wrangler.jsonc": [
          "{",
          '  "assets": { "directory": ".open-next/assets" },',
          '  "env": {',
          '    "production": { "assets": { "directory": "dist" } }',
          "  }",
          "}",
          "",
        ].join("\n"),
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining("dist/downloads holds no built files"),
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
      "wrangler.jsonc has no assets.directory, so this check cannot tell which files get published",
    ]);
  });

  it("treats an empty assets directory the same as none at all", () => {
    // 空字符串不是一个目录名。收下它的话，后面每一条路径都从仓库根拼起，门禁跑去
    // 证明 `/downloads` 这种线上不存在的 URL，而真正会发布的那个目录一个文件都没查。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "wrangler.jsonc": '{ "assets": { "directory": "" } }\n',
      }),
    );

    expect(failures).toEqual([
      "wrangler.jsonc has no assets.directory, so this check cannot tell which files get published",
    ]);
  });

  it("says a source-side problem once, not once per published directory", () => {
    // 每个会被发布的目录各证明一轮，而源目录那一侧的失败每轮都会说一遍：它的措辞里
    // 根本没有资产目录，两轮说的是同一句话。原样堆出来的话业主看到的是重复红字，
    // 真正不一样的那几条被淹掉。两个目录必须**不同**，同一个目录在更早一层就并掉了。
    const files = createValidFiles();
    delete files[`${DOWNLOADS_DIR}/catalog.pdf`];
    delete files[`${DOWNLOADS_DIR}/spec-sheet.pdf`];
    files["wrangler.jsonc"] = [
      "{",
      `  "assets": { "directory": "${ASSETS_DIR}" },`,
      '  "env": {',
      `    "production": { "assets": { "directory": "${ASSETS_DIR}" } },`,
      '    "preview": { "assets": { "directory": "dist" } }',
      "  }",
      "}",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(
      failures.filter((failure) =>
        failure.startsWith(`${DOWNLOADS_DIR} holds no files`),
      ),
    ).toHaveLength(1);
  });

  it("fails when a source download is an html file", () => {
    // 别名判定在源目录、资产下载目录、静态资源目录各调一次。只测资产目录那一次
    // 的话，另外两次删掉照样全绿：源目录里新加一份 HTML 下载，线上是从去掉扩展名
    // 的别名发出去的，落在别名上的撤销门禁看不见。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${DOWNLOADS_DIR}/guide.html`]: "<html></html>",
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/downloads/guide.html in public/downloads is served from its extensionless alias instead",
      ),
    );
  });

  it("fails when a built static asset is an html file", () => {
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        [`${STATIC_DIR}/chunks/inlined.html`]: "<html></html>",
      }),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        `/_next/static/chunks/inlined.html in ${STATIC_DIR} is served from its extensionless alias instead`,
      ),
    );
  });

  it("stops when wrangler config cannot be parsed", () => {
    // JSONC 解析器能从坏文本里「恢复」出半截配置。拿那半截当真，门禁就在证明一个
    // 不知道是不是真会发布的目录，而真正的问题——配置文件本身是坏的——一声不吭。
    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo({
        ...createValidFiles(),
        "wrangler.jsonc": '{ "assets": { "directory": ".open-next/assets" }\n',
      }),
    );

    expect(failures).toEqual(["wrangler.jsonc could not be parsed"]);
  });

  it("stops when wrangler config is missing", () => {
    // 配置不在就没人知道发布哪个目录。这里必须是一条报错，不是抛异常，也不是
    // 拿写死的目录顶上。
    const files = createValidFiles();
    delete files["wrangler.jsonc"];

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toEqual(["missing wrangler.jsonc"]);
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
      expect.stringContaining(`${STATIC_DIR} holds no built files`),
    );
  });

  it("fails when a pdf is published from outside the downloads directory", () => {
    // 只按 `downloads/` 这个目录名判，给出的保证是「那个目录里的文件带着 noindex」，
    // 不是「我们的 PDF 带着 noindex」。把新报价单放进 `public/` 而不是
    // `public/downloads/`，线上 `/quotation.pdf` 上没有任何 X-Robots-Tag 规则，
    // Google 照收，而这一整套检查一路绿灯。放错一层目录就够了，不需要谁改坏什么。
    //
    // 只放在源目录里，还没构建。源目录那一侧不扫的话，这份 PDF 要等下一次构建才有
    // 人管，而它已经被 commit 进仓库了。
    const files = createValidFiles();
    files["public/quotation.pdf"] = "%PDF-1.7";

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining("/quotation.pdf in public/_headers"),
    );
  });

  it("fails when a pdf rides along inside the static asset output", () => {
    // `import catalog from "./product-catalog.pdf"` 是 Next.js 的标准写法，构建把
    // 它搬到 `/_next/static/media/`。那个目录门禁走进去了，但只问缓存不问 noindex，
    // 于是一份真实的询盘物料从一条谁都想不到的 URL 上裸奔。
    const files = createValidFiles();
    files[`${STATIC_DIR}/media/product-catalog.9f3a1c.pdf`] = "%PDF-1.7";

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(
        "/_next/static/media/product-catalog.9f3a1c.pdf in public/_headers",
      ),
    );
  });

  it("judges an upper-case extension the same as a lower-case one", () => {
    // Windows 上导出的文件常常叫 `QUOTATION.PDF`。扩展名不归一化的话，同一份报价单
    // 换个大小写就绕过整道检查，而线上它照样是一份能被收录的 PDF。
    const files = createValidFiles();
    files["public/QUOTATION.PDF"] = "%PDF-1.7";

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining("/QUOTATION.PDF in public/_headers"),
    );
  });

  it("stays quiet when a stray pdf is already covered by a rule", () => {
    // 判据是「这个文件最终拿到的头」，不是「它在不在 downloads 目录里」。业主换个
    // 写法把整站盖住，是完全正当的配置，不能因为目录名不对就拦住发布。
    const covered = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      "/*",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");
    const files = createValidFiles();
    files["public/quotation.pdf"] = "%PDF-1.7";
    files[`${ASSETS_DIR}/quotation.pdf`] = "%PDF-1.7";
    files["public/_headers"] = covered;
    files[`${ASSETS_DIR}/_headers`] = covered;

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toEqual([]);
  });

  it("does not demand noindex on a file type that is meant to be fetched", () => {
    // `.well-known/security.txt` 就是要给人抓的。把它一起拦下来是误红，而误红会让
    // 业主学会绕过这道门禁——那比漏掉一份 PDF 更贵。
    const files = createValidFiles();
    files["public/.well-known/security.txt"] = "Contact: mailto:a@b.c";
    files[`${ASSETS_DIR}/.well-known/security.txt`] = "Contact: mailto:a@b.c";

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toEqual([]);
  });
});
