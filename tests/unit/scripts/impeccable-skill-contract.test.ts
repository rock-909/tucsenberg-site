import { execFileSync } from "node:child_process";
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
    // Local (gitignored) skill installs are the owner's tooling choice; the
    // repo contract is only that these bundles are never tracked/shipped.
    for (const root of RETIRED_IMPECCABLE_SKILL_ROOTS) {
      expect(listTrackedFiles(root), root).toEqual([]);
    }
  });
});
