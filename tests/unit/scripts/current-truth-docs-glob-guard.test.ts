import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// Import the guard directly from the checks module (the CLI reaches it through
// collectCurrentTruthDocFindings; this test targets the guard in isolation).
import { collectRuleFrontmatterGlobFindings } from "../../../scripts/quality/checks/current-truth-docs.js";

function createTempRepo(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rule-glob-guard-"));

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(tempDir, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- temp fixture path is created inside the test-owned directory
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- temp fixture path is created inside the test-owned directory
    fs.writeFileSync(fullPath, content);
  }

  return tempDir;
}

const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-rule-glob-guard-test-trash",
);

function moveTempRepoToTrash(dir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only checks the test-owned temporary fixture directory
  if (!fs.existsSync(dir)) return;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable os.tmpdir trash folder
  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  const targetDir = path.join(
    TEMP_TRASH_ROOT,
    `${path.basename(dir)}-${Date.now()}`,
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture cleanup uses recoverable rename instead of permanent deletion
  fs.renameSync(dir, targetDir);
}

function ruleFile(globs: string[]): string {
  const pathLines = globs.map((glob) => `  - "${glob}"`).join("\n");
  return `---\npaths:\n${pathLines}\n---\n\n# Rule\n`;
}

describe("rule frontmatter glob guard", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      moveTempRepoToTrash(dir);
    }
  });

  it("fails when a frontmatter paths glob matches no real file", () => {
    const repoDir = createTempRepo({
      ".claude/rules/dead.md": ruleFile(["src/does-not-exist/**"]),
      "src/real.ts": "export const real = true;\n",
    });
    tempDirs.push(repoDir);

    expect(collectRuleFrontmatterGlobFindings(repoDir)).toContainEqual({
      file: ".claude/rules/dead.md",
      error:
        'frontmatter paths glob matches no real file "src/does-not-exist/**"',
    });
  });

  it("passes when every frontmatter paths glob matches a real file", () => {
    const repoDir = createTempRepo({
      ".claude/rules/live.md": ruleFile(["src/**/*.ts", "src/real.ts"]),
      "src/real.ts": "export const real = true;\n",
    });
    tempDirs.push(repoDir);

    expect(collectRuleFrontmatterGlobFindings(repoDir)).toEqual([]);
  });

  it("treats a literal Next.js route-group path as alive despite glob brackets", () => {
    // `[locale]` are glob character classes, so pure glob matching would miss the
    // real directory; the guard falls back to fs.existsSync for literal paths.
    const repoDir = createTempRepo({
      ".claude/rules/route.md": ruleFile(["src/app/[locale]/layout.tsx"]),
      "src/app/[locale]/layout.tsx": "export default function Layout() {}\n",
    });
    tempDirs.push(repoDir);

    expect(collectRuleFrontmatterGlobFindings(repoDir)).toEqual([]);
  });
});
