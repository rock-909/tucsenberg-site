import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const RETIRED_IMPECCABLE_SKILL_ROOTS = [
  ".claude/skills/impeccable",
  ".codex/skills/impeccable",
] as const;

function listTrackedFiles(rootRelativePath: string): string[] {
  return execFileSync("git", ["ls-files", rootRelativePath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  })
    .split(/\r?\n/u)
    .filter(Boolean)
    .sort();
}

describe("Impeccable project-local skill contract", () => {
  it("does not ship retired project-local Impeccable skill bundles", () => {
    for (const root of RETIRED_IMPECCABLE_SKILL_ROOTS) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test iterates over a fixed allowlist of retired repo-local skill roots
      expect(fs.existsSync(path.join(REPO_ROOT, root)), root).toBe(false);
      expect(listTrackedFiles(root), root).toEqual([]);
    }
  });
});
