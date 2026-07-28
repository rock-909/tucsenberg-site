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

// 这份守的是「哪些文件会被发布出去、它们线上被请求的 URL 是哪一条」：目录怎么枚举、
// 配置里的资产目录怎么读、哪些别名和配置文件让这套模型算不出来。
// 响应头本身要证明什么由 cloudflare-static-asset-headers 守，移植过来的 wrangler
// 解析与匹配语义由 cloudflare-headers-wrangler-semantics 守。
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
      createVirtualRepo(files, new Set([`${BUILT_DOWNLOADS_DIR}/linked.pdf`])),
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
        new Set([`${BUILT_DOWNLOADS_DIR}/linked`]),
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
      "wrangler.jsonc has no assets.directory, so there is no way to tell which files get published",
    ]);
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

  // 磁盘上叫别的名字、而文件系统又替我们折叠了的两种真实写法。第二种是关键：
  // `ſ`（U+017F）在 macOS 的 APFS 上等于 `s`，但 `"ſ".toLowerCase()` 还是 `"ſ"`，
  // 所以拿 JS 的大小写规则当判据的话，这一种会原样漏过去。
  // 三个受保护目录各判各的，两种折叠各测一遍。第二种是关键：`ſ`（U+017F）在 macOS
  // 的 APFS 上等于 `s`，但 `"ſ".toLowerCase()` 还是 `"ſ"`，拿 JS 的大小写规则当判据
  // 的话它原样漏过去。
  const foldedDirs = [
    { real: DOWNLOADS_DIR, onDisk: "public/Downloads" },
    { real: BUILT_DOWNLOADS_DIR, onDisk: `${ASSETS_DIR}/Downloads` },
    { real: STATIC_DIR, onDisk: `${ASSETS_DIR}/_next/Static` },
  ];
  const folds = [
    { name: "case", fold: (value: string) => value.toLowerCase() },
    { name: "long s", fold: (value: string) => value.replace(/ſ/gu, "s") },
  ];

  it.each(
    foldedDirs.flatMap(({ real, onDisk }) =>
      folds.map(({ name, fold }) => ({
        real,
        // 长 s 那一版把折叠后等于 `s` 的那个字母换掉，磁盘真名就带上了 U+017F。
        onDisk: name === "case" ? onDisk : real.replace(/s([^/]*)$/u, "ſ$1"),
        fold,
        name,
      })),
    ),
  )(
    "refuses to guess the url when $real is on disk as $onDisk ($name)",
    ({ real, onDisk, fold }) => {
      // wrangler 建清单拿的是 readdir 给出的真名，线上那条 URL 跟着真名走，
      // `/downloads/*` 那条规则匹配不上（正则不带 `i`），文件全部裸奔，而门禁按
      // 自己编出来的 URL 求头，一片绿。真名猜不出来时不能接着算，只能说算不出来。
      const files = createValidFiles();
      for (const key of Object.keys(files)) {
        if (!key.startsWith(`${real}/`)) continue;
        files[key.replace(real, onDisk)] = files[key] ?? "";
        delete files[key];
      }

      const failures = collectCloudflareStaticAssetHeaderFailures(
        createVirtualRepo(files, new Set(), fold),
      );

      expect(failures).toContainEqual(
        `${real} is not on disk under that exact name, so this check cannot work out which URL its files are served from`,
      );
    },
  );

  it("says nothing about a url it just said it cannot work out", () => {
    // 目录名算不出来之后还按写死的前缀逐文件证明，出来的每一条结论说的都是一条线上
    // 不存在的 URL：这里 `_headers` 写的是真名 `/Downloads/*`，PDF 线上带着 noindex，
    // 而按 `/downloads/...` 算会说它们全是裸的。同一次运行里前一句说「算不出来」、
    // 后几句拿那条算不出来的 URL 下结论，两个方向都不成立。
    const realName = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      "/Downloads/*",
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
    ].join("\n");
    const files = createValidFiles();
    files["public/_headers"] = realName;
    files[`${ASSETS_DIR}/_headers`] = realName;
    for (const dir of [DOWNLOADS_DIR, BUILT_DOWNLOADS_DIR]) {
      for (const name of ["catalog.pdf", "spec-sheet.pdf"]) {
        files[`${dir.replace(/downloads$/u, "Downloads")}/${name}`] =
          files[`${dir}/${name}`] ?? "";
        delete files[`${dir}/${name}`];
      }
    }

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files, new Set(), (value) => value.toLowerCase()),
    );

    expect(failures).toEqual([
      `${DOWNLOADS_DIR} is not on disk under that exact name, so this check cannot work out which URL its files are served from`,
      `${BUILT_DOWNLOADS_DIR} is not on disk under that exact name, so this check cannot work out which URL its files are served from`,
    ]);
  });

  it("keeps proving files when a directory cannot be listed", () => {
    // 列不出来（权限、EMFILE、EIO）不等于名字被折叠了。当成折叠处理的话，那个目录
    // 一条路径都不列，而它底下那份被撤销了 noindex 的 PDF 一个字都不打印——红的是
    // 一个不存在的问题，真问题反倒消音了。
    const detached = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/generated-only.pdf",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(
        {
          ...createValidFiles(),
          [`${BUILT_DOWNLOADS_DIR}/generated-only.pdf`]: "%PDF-1.7",
          "public/_headers": detached,
          [`${ASSETS_DIR}/_headers`]: detached,
        },
        new Set(),
        (value) => value,
        // 资产根列不出来，它底下的 downloads 目录本身还是列得动的。
        new Set([ASSETS_DIR]),
      ),
    );

    expect(failures).toContainEqual(
      `${BUILT_DOWNLOADS_DIR} could not be listed, so this check cannot confirm it is spelled the same on disk as in the URL`,
    );
    expect(failures).toContainEqual(
      expect.stringContaining(
        '/downloads/generated-only.pdf in public/_headers is served without "x-robots-tag"',
      ),
    );
  });

  it("reports instead of crashing when a protected path is a plain file", () => {
    // `public/downloads` 是个普通文件时 readdir 抛 ENOTDIR。不接住的话门禁变成
    // 崩溃而不是判断，业主看到的是一段堆栈，不是「哪里出了问题」。
    const files = createValidFiles();
    delete files[`${DOWNLOADS_DIR}/catalog.pdf`];
    delete files[`${DOWNLOADS_DIR}/spec-sheet.pdf`];
    files[DOWNLOADS_DIR] = "not a directory";

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files),
    );

    expect(failures).toContainEqual(
      expect.stringContaining(`${DOWNLOADS_DIR} holds no files`),
    );
  });

  it("still names the bare pdf when another directory cannot be resolved", () => {
    // 一个目录算不出来，不能把别的目录的证明一起静音——那份被撤销了 noindex 的 PDF
    // 仍然要被点名。这是这个门禁存在的唯一理由。
    const detached = [
      EXPECTED_STATIC_ASSET_HEADER_ROUTE,
      `  Cache-Control: ${EXPECTED_STATIC_ASSET_CACHE_CONTROL}`,
      "",
      EXPECTED_DOWNLOADS_HEADER_ROUTE,
      `  ${EXPECTED_DOWNLOADS_NOINDEX}`,
      "",
      "/downloads/catalog.pdf",
      "  ! X-Robots-Tag",
      "",
    ].join("\n");
    const files = createValidFiles();
    files["public/_headers"] = detached;
    files[`${ASSETS_DIR}/_headers`] = detached;
    // 源目录折叠成 `Downloads`，构建产物那一份原样留着。
    for (const name of ["catalog.pdf", "spec-sheet.pdf"]) {
      files[`public/Downloads/${name}`] =
        files[`${DOWNLOADS_DIR}/${name}`] ?? "";
      delete files[`${DOWNLOADS_DIR}/${name}`];
    }

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files, new Set(), (value) => value.toLowerCase()),
    );

    expect(failures).toContainEqual(
      `${DOWNLOADS_DIR} is not on disk under that exact name, so this check cannot work out which URL its files are served from`,
    );
    expect(failures).toContainEqual(
      expect.stringContaining(
        `/downloads/catalog.pdf in ${ASSETS_DIR}/_headers is served without "x-robots-tag"`,
      ),
    );
  });

  it("does not judge a directory name that never reaches a url", () => {
    // 资产根目录自己的名字被 wrangler 完全剥掉（清单路径是相对它算的），叫什么都
    // 不改变任何一条 URL。拿它判红就是打印一句能当场证伪的话。
    const files = createValidFiles();
    files["wrangler.jsonc"] = [
      "{",
      '  "assets": { "directory": ".open-next/Assets" }',
      "}",
      "",
    ].join("\n");

    const failures = collectCloudflareStaticAssetHeaderFailures(
      createVirtualRepo(files, new Set(), (name) => name.toLowerCase()),
    );

    expect(failures).toEqual([]);
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
});
