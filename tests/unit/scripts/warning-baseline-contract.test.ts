import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

// 这个文件以前冻结三条 script 的完整命令字符串（连 npx 的 flag 顺序一起），
// 还断言三个已退休的 script 名必须继续不存在——而 .claude/rules/testing.md 自己
// 就写着"断言一个已删的名字保持不存在，守的是过去那次重构，不是活的行为"。
// 2026-07-26 收窄成唯一有意图的那半条：React Doctor 必须是**会拦人的**门。
// 同日 react:doctor:reconcile 一并退役——CI 那步是 continue-on-error，删掉之后它
// 一个调用方都不剩了。
describe("React Doctor gate contract", () => {
  it("keeps React Doctor blocking on errors instead of only reporting", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const doctorScript = packageJson.scripts["react:doctor"] ?? "";

    expect(doctorScript).toContain("react-doctor@latest");
    expect(doctorScript).toContain("--blocking error");
    expect(doctorScript).not.toContain("--blocking none");
  });
});
