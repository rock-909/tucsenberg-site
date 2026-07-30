import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

// 只保护当前意图：React Doctor 必须在错误级结果上阻断。
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
