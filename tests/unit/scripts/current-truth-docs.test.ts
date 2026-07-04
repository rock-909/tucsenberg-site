import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHECKS,
  collectCurrentTruthDocFindings,
  findOutOfOrderCommand,
  getReleaseProofDocsCommandBlock,
} from "../../../scripts/starter-checks.js";

function createTempRepo(files: Record<string, string>): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "current-truth-docs-"));

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
  "showcase-current-truth-docs-test-trash",
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

function createValidFiles(): Record<string, string> {
  const files: Record<string, string> = {};

  for (const check of CHECKS) {
    files[check.file] = [
      files[check.file],
      ...(check.required ?? []),
      "safe baseline text",
    ]
      .filter(Boolean)
      .join("\n");
  }

  files["docs/proof/release.md"] = [
    files["docs/proof/release.md"],
    "## Current sequence",
    "```bash",
    getReleaseProofDocsCommandBlock(),
    "```",
  ].join("\n");

  return files;
}

describe("current-truth docs guard", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      moveTempRepoToTrash(dir);
    }
  });

  it("passes when required machine markers and release command block are present", () => {
    const repoDir = createTempRepo(createValidFiles());
    tempDirs.push(repoDir);

    expect(collectCurrentTruthDocFindings(repoDir)).toEqual([]);
  });

  it("keeps design docs bounded to Tucsenberg and historical workflow truth", () => {
    expect(CHECKS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "docs/design/truth.md",
          required: expect.arrayContaining([
            "Tucsenberg current site design truth",
          ]),
        }),
        expect.objectContaining({
          file: "docs/design/impeccable/README.md",
          forbidden: expect.arrayContaining(["external/"]),
        }),
        expect.objectContaining({
          file: "docs/design/impeccable/system/PAGE-PATTERNS.md",
          required: expect.arrayContaining(["Historical gap snapshot"]),
        }),
      ]),
    );
  });

  it("flags missing required path markers and forbidden stale path markers", () => {
    const files = createValidFiles();
    files["docs/ref/maintainers.md"] = [
      "src/config/single-site-page-expression.ts",
      "src/sites/message-overrides.ts",
    ].join("\n");

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(collectCurrentTruthDocFindings(repoDir)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "docs/ref/maintainers.md",
          error:
            'missing current-truth pattern "src/config/single-site-seo.ts"',
        }),
        expect.objectContaining({
          file: "docs/ref/maintainers.md",
          error:
            'forbidden current-truth pattern "src/sites/message-overrides.ts"',
        }),
      ]),
    );
  });

  it("checks documented pnpm commands against package scripts", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        "brand:check": "echo ok",
      },
    });
    files["AGENTS.md"] = [
      "pnpm install",
      "pnpm exec playwright test",
      "pnpm brand:check",
      "pnpm missing:script",
    ].join("\n");

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        error: 'unknown package script command "pnpm install"',
      }),
    );
    expect(findings).not.toContainEqual(
      expect.objectContaining({
        error: 'unknown package script command "pnpm exec"',
      }),
    );
    expect(findings).not.toContainEqual(
      expect.objectContaining({
        error: 'unknown package script command "pnpm brand:check"',
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "AGENTS.md",
        error: 'unknown package script command "pnpm missing:script"',
      }),
    );
  });

  it("flags release runbook command block drift from the manifest", () => {
    const files = createValidFiles();
    files["docs/proof/release.md"] = [
      "scripts/quality/release-proof-manifest.js",
      "## Current sequence",
      "```bash",
      "node scripts/starter-checks.js truth-docs",
      "```",
    ].join("\n");

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(collectCurrentTruthDocFindings(repoDir)).toContainEqual(
      expect.objectContaining({
        file: "docs/proof/release.md",
        error: "release-proof runbook command block drift from manifest",
      }),
    );
  });

  it("detects command sequence drift directly", () => {
    expect(findOutOfOrderCommand(["first", "second"], "second\nfirst")).toBe(
      "second",
    );
    expect(findOutOfOrderCommand(["first", "second"], "first\nsecond")).toBe(
      null,
    );
  });
});
