import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `vitest.config.mts` 用一份手写的 include 清单决定跑哪些测试。清单写窄一格，
 * `pnpm test` 就少跑一批，然后照样 exit 0——实测把 include 改成单个文件后，
 * 整套单测缩成 2 个断言，仍然报绿，lint 也不会说话。
 *
 * 这里守的不是清单长什么样（那是冻结措辞），而是它声称的那件事：磁盘上的每个
 * 测试文件都真的被收进去了。include 怎么写都行，收不全就红。
 */

const ROOTS = ["src", "tests"] as const;
const E2E_PREFIX = `tests${sep}e2e${sep}`;
const TEST_FILE_PATTERN = /\.(test|spec)\.(js|jsx|ts|tsx)$/u;
// 起一个 vitest 子进程问它自己收了哪些文件；本地 0.7s，CI 上留足余量。
const LIST_TIMEOUT_MS = 120 * 1000;

function collectFromDisk(dir: string): string[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- 只遍历仓库内的 src/ 与 tests/
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectFromDisk(entryPath);
    return TEST_FILE_PATTERN.test(entry.name) ? [entryPath] : [];
  });
}

function listCollectedByVitest(): string[] {
  const stdout = execFileSync(
    "pnpm",
    ["exec", "vitest", "list", "--filesOnly"],
    { encoding: "utf8", timeout: LIST_TIMEOUT_MS },
  );

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => TEST_FILE_PATTERN.test(line))
    .map((line) => relative(process.cwd(), line));
}

describe("Vitest 收集面", () => {
  it(
    "把磁盘上每个测试文件都收进来（e2e 除外，那是 Playwright 的）",
    () => {
      const onDisk = ROOTS.flatMap(collectFromDisk)
        .filter((path) => !path.startsWith(E2E_PREFIX))
        .sort();
      const collected = listCollectedByVitest().sort();

      // 两边都空的话下面的相等断言真空通过。
      expect(onDisk.length).toBeGreaterThan(0);
      expect(collected).toEqual(onDisk);
    },
    LIST_TIMEOUT_MS,
  );
});
