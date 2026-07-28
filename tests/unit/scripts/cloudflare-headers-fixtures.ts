import path from "node:path";

import {
  EXPECTED_DOWNLOADS_NOINDEX,
  EXPECTED_STATIC_ASSET_CACHE_CONTROL,
} from "../../../scripts/quality/checks/cloudflare-static-asset-headers.js";

// 一份合法夹具会写的两条路由。门禁**不要求**它们存在：换成别的写法，只要每个真实
// 文件最终都拿到期望的头，它一样绿。所以这两个常量属于夹具，不属于门禁——放在门禁
// 里导出会让人以为那是它强制的路由。
export const EXPECTED_STATIC_ASSET_HEADER_ROUTE = "/_next/static/*";
export const EXPECTED_DOWNLOADS_HEADER_ROUTE = "/downloads/*";

export const ROOT_DIR = "/repo";
export const ASSETS_DIR = ".open-next/assets";
export const DOWNLOADS_DIR = "public/downloads";
// 真正被发布出去的是资产目录，源目录只是下次构建的输入。两个都要有夹具，否则
// 「只存在于构建产物里的 PDF」这个场景根本测不出来。
export const BUILT_DOWNLOADS_DIR = `${ASSETS_DIR}/downloads`;
export const STATIC_DIR = `${ASSETS_DIR}/_next/static`;
export const CATALOG_PATH = "/downloads/catalog.pdf";
// 构建产物的文件名全带内容哈希，没有 main.js 这种固定名字。写死一条不存在的探针
// 路径等于什么都没证明：撤销落在真实哈希文件上时它毫无反应。
export const BUNDLE_NAME = "2huo56-xai-ru.js";
export const BUNDLE_PATH = `/_next/static/chunks/${BUNDLE_NAME}`;

/**
 * 虚拟仓库。两份测试共用：一份守门禁要证明什么，一份守移植过来的 wrangler 语义。
 */
/**
 * 文件系统怎么把「查的名字」折叠成「磁盘上的名字」。默认不折叠（Linux）。
 *
 * macOS 默认的 APFS 会折叠，而且折叠表比 JS 的大小写表大：本机实测 `ſ`（U+017F）
 * 在磁盘上等于 `s`，但 `"ſ".toLowerCase()` 还是 `"ſ"`。所以这里给的是一个函数而不是
 * 一个开关——门禁不该依赖 JS 的大小写规则，测试要能证明这一点。
 * 折叠只作用在按名字查（existsSync / readFileSync / statSync）上；readdirSync 永远
 * 报磁盘上的真名，跟真实 fs 一致。
 */
export function createVirtualRepo(
  files: Record<string, string>,
  symlinks: Set<string> = new Set(),
  fold: (name: string) => string = (name) => name,
  unlistable: Set<string> = new Set(),
) {
  // 目录也要能被折叠命中，所以每个 key 的每一层祖先都进表。
  const folded = new Map<string, string>();
  for (const key of Object.keys(files)) {
    const segments = key.split("/");
    for (let depth = 1; depth <= segments.length; depth += 1) {
      const ancestor = segments.slice(0, depth).join("/");
      if (!folded.has(fold(ancestor))) folded.set(fold(ancestor), ancestor);
    }
  }
  const normalize = (absolutePath: string) => {
    const key = path.relative(ROOT_DIR, absolutePath).split(path.sep).join("/");
    if (files[key] !== undefined) return key;
    return folded.get(fold(key)) ?? key;
  };
  // 根目录归一化后是空串，拼前缀时不能再补 `/`——补了就成了 `/`，一个 key 都匹配
  // 不上，`readdirSync(rootDir)` 会返回空数组。真实 fs 在根目录上列得出东西。
  const childPrefix = (absolutePath: string) => {
    const key = normalize(absolutePath);
    return key === "" ? "" : `${key}/`;
  };

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
      const key = normalize(absolutePath);
      // 真实 fs 列不出来时是抛异常，不是返回空数组。权限不足、EMFILE、EIO 都算；
      // 路径本身是个普通文件时抛的是 ENOTDIR。替身只会返回空数组的话，「列不出来」
      // 和「里面没东西」在测试里根本分不开。
      if (unlistable.has(key)) {
        const error = new Error(`EACCES: permission denied, scandir '${key}'`);
        throw error;
      }
      if (files[key] !== undefined) {
        throw new Error(`ENOTDIR: not a directory, scandir '${key}'`);
      }
      const prefix = childPrefix(absolutePath);
      const names = new Set(
        Object.keys(files)
          .filter((name) => name.startsWith(prefix))
          .map((name) => name.slice(prefix.length).split("/")[0] as string),
      );
      return [...names].map((name) => {
        const linked = symlinks.has(`${prefix}${name}`);
        const isDirectory = Object.keys(files).some((file) =>
          file.startsWith(`${prefix}${name}/`),
        );
        return {
          name,
          // Dirent 看到的是链接本身，所以符号链接既不是目录也不是普通文件。
          // 跟随之后是什么，由 statSync 回答——wrangler 也是这么分工的。
          isDirectory: () => isDirectory && !linked,
          isFile: () => !isDirectory && !linked,
        };
      });
    },
    // statSync 跟随符号链接：指向真实文件的链接在这里就是普通文件，指向目录的
    // 链接就是目录。门禁靠它决定要不要递归，所以两个判据都要有。
    statSync: (absolutePath: string) => {
      const key = normalize(absolutePath);
      const isDirectory = Object.keys(files).some((file) =>
        file.startsWith(`${key}/`),
      );
      if (!isDirectory && files[key] === undefined) {
        throw new Error(`Missing virtual path: ${key}`);
      }
      return { isFile: () => !isDirectory, isDirectory: () => isDirectory };
    },
  };
}

export function createValidFiles(): Record<string, string> {
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
    // 构建把它们复制进资产目录，那份才是真正被发布的。
    [`${BUILT_DOWNLOADS_DIR}/catalog.pdf`]: "%PDF-1.7",
    [`${BUILT_DOWNLOADS_DIR}/spec-sheet.pdf`]: "%PDF-1.7",
    // 静态资源同理，逐个真实 bundle 求最终响应头。
    [`${STATIC_DIR}/chunks/${BUNDLE_NAME}`]: "console.log(1)",
    [`${STATIC_DIR}/media/logo.svg`]: "<svg />",
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
