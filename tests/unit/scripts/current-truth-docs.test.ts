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

  files["docs/项目基础/发布验证.md"] = [
    files["docs/项目基础/发布验证.md"],
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
          file: "docs/design/设计真相.md",
          required: expect.arrayContaining([
            "Tucsenberg current site design truth",
          ]),
        }),
        expect.objectContaining({
          file: "docs/design/设计系统说明.md",
          forbidden: expect.arrayContaining(["external/"]),
        }),
        expect.objectContaining({
          file: "docs/design/页面模式.md",
          required: expect.arrayContaining(["Historical gap snapshot"]),
        }),
      ]),
    );
  });

  it("keeps docs existence review closed instead of leaving review-needed buckets", () => {
    expect(CHECKS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "docs/项目基础/文档清单.md",
          required: expect.arrayContaining(["Docs existence closeout"]),
          forbidden: expect.arrayContaining([
            "review-needed",
            "Follow-up buckets",
          ]),
        }),
        expect.objectContaining({
          file: "docs/技术难题/性能实验优化方法论.md",
          required: expect.arrayContaining([
            "这是方法笔记，不是当前 Tucsenberg launch proof。",
          ]),
        }),
      ]),
    );
  });

  it("guards stable docs from naming legacy specs as current product truth", () => {
    expect(CHECKS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "docs/项目基础/配置.md",
          required: expect.arrayContaining([
            "src/constants/tucsenberg-product-pages.ts",
          ]),
        }),
        expect.objectContaining({
          file: "docs/项目基础/替换边界.md",
          forbidden: expect.arrayContaining([
            "edit `src/config/single-site-product-catalog.ts`, `src/constants/product-standards.ts`, and `src/constants/product-specs/**` first",
          ]),
        }),
      ]),
    );
  });

  it("flags missing required path markers and forbidden stale path markers", () => {
    const files = createValidFiles();
    files["docs/项目基础/维护规则.md"] = [
      "src/config/single-site-page-expression.ts",
      "src/sites/message-overrides.ts",
    ].join("\n");

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(collectCurrentTruthDocFindings(repoDir)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "docs/项目基础/维护规则.md",
          error:
            'missing current-truth pattern "src/config/single-site-seo.ts"',
        }),
        expect.objectContaining({
          file: "docs/项目基础/维护规则.md",
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
    files["docs/项目基础/发布验证.md"] = [
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
        file: "docs/项目基础/发布验证.md",
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
