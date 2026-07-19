import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHECKS,
  HISTORICAL_BANNER,
  HISTORICAL_DERIVATION_DOCS,
  RETIRED_PUBLIC_TRUTH_PATTERNS,
  collectBacktickedRepoPathFindings,
  collectCurrentTruthDocFindings,
  collectDocumentInventoryFindings,
  collectGuardrailRegistryFindings,
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

function missingCurrentDocPath(pathname: string): {
  file: string;
  error: string;
} {
  return {
    file: "docs/current.md",
    error: `documented repository path does not exist "${pathname}"`,
  };
}

const PRESERVED_ENGLISH_PATH_SOURCES = [
  "src/delete.ts",
  "src/remove.ts",
  "src/must-keep.ts",
  "src/rename-source.ts",
  "src/move-source.ts",
  "src/replace-source.ts",
  "src/should-rename-source.ts",
  "src/cannot-move-source.ts",
  "src/may-replace-source.ts",
  "src/can-not-rename-source.ts",
  "src/must-never-rename-source.ts",
  "src/passive-rename-source.ts",
  "src/passive-move-source.ts",
  "src/passive-replace-source.ts",
  "src/passive-never-source.ts",
  "src/passive-is-not-rename-source.ts",
  "src/passive-is-not-move-source.ts",
  "src/passive-is-not-replace-source.ts",
  "src/passive-source-only.ts",
];

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

  for (const historicalPath of HISTORICAL_DERIVATION_DOCS) {
    if (!(historicalPath in files)) continue;
    files[historicalPath] = `${HISTORICAL_BANNER}\n${files[historicalPath]}`;
    files["docs/项目基础/文档清单.md"] +=
      `\n| \`${historicalPath}\` | \`historical-proof\` | Historical record. |`;
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
          required: expect.arrayContaining([
            ".text-section",
            "surface-card",
            "HeroGuideOverlay",
          ]),
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

  it("treats the 2026-07 audit handoff as historical, not snapshot-pinned truth", () => {
    // 交接文档整篇转为 historical（docs/技术难题/审查2026-07/ 目录豁免）。
    // required 不再钉死时点快照（commit 哈希、"尚未 push" 状态、检查输出数字）——
    // 那正是强制文档说假话的机制。CHECKS 里不应再有它的条目。
    for (const check of CHECKS) {
      expect(check.file).not.toBe("docs/技术难题/审查2026-07/交接文档.md");
    }
  });

  it("exempts bannered + inventoried 2026-07 audit findings from retired-pattern scan", () => {
    const files = createValidFiles();
    const auditFinding = "docs/技术难题/审查2026-07/findings-example.md";
    files[auditFinding] =
      `${HISTORICAL_BANNER}\n# 审查发现\n${RETIRED_PUBLIC_TRUTH_PATTERNS.join("\n")}`;
    files["docs/项目基础/文档清单.md"] +=
      `\n| \`${auditFinding}\` | \`historical-proof\` | Audit finding. |`;
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(collectCurrentTruthDocFindings(repoDir)).toEqual([]);
  });

  it("indexes the maintainability audit as historical evidence, not runtime truth", () => {
    for (const file of [
      "docs/项目基础/文档清单.md",
      "docs/技术难题/验证入口.md",
    ]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths are fixed test-owned documentation fixtures
      const content = fs.readFileSync(path.resolve(file), "utf8");

      expect(content).toContain("docs/技术难题/审查2026-07/README.md");
      expect(content).toContain("历史审查证据，不是当前 runtime truth");
    }
  });

  it("rejects retired public paths from current docs", () => {
    const files = createValidFiles();
    files["README.md"] = RETIRED_PUBLIC_TRUTH_PATTERNS.join("\n");
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    for (const pattern of RETIRED_PUBLIC_TRUTH_PATTERNS) {
      expect(findings).toContainEqual({
        file: "README.md",
        error: `forbidden retired current-truth pattern "${pattern}"`,
      });
    }
  });

  it("allows retired references only in bannered and inventoried historical docs", () => {
    const files = createValidFiles();
    const historicalPath = "docs/superpowers/plans/retired-profile-example.md";
    files[historicalPath] =
      `${HISTORICAL_BANNER}\n# Old plan\n${RETIRED_PUBLIC_TRUTH_PATTERNS.join("\n")}`;
    files["docs/项目基础/文档清单.md"] +=
      `\n| \`${historicalPath}\` | \`historical-proof\` | Old plan. |`;
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(collectCurrentTruthDocFindings(repoDir)).toEqual([]);
  });

  it("requires both the approved banner and historical inventory classification", () => {
    const files = createValidFiles();
    const missingBanner = "docs/技术难题/门禁机械遵守审查2026-07/执行文档.md";
    const missingInventory =
      "docs/技术难题/门禁机械遵守审查2026-07/官方对标修复执行文档.md";
    files[missingBanner] = "# Gate audit record";
    files[missingInventory] = `${HISTORICAL_BANNER}\n# Gate audit record`;
    files["docs/项目基础/文档清单.md"] +=
      `\n| \`${missingBanner}\` | \`historical-proof\` | Gate audit record. |`;
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);
    expect(collectCurrentTruthDocFindings(repoDir)).toEqual(
      expect.arrayContaining([
        {
          file: missingBanner,
          error: `historical document must start with "${HISTORICAL_BANNER}"`,
        },
        {
          file: missingInventory,
          error:
            "historical document is not classified as historical-proof in docs/项目基础/文档清单.md",
        },
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

  it("rejects a tracked document that is missing from the inventory", () => {
    const repoDir = createTempRepo({
      "docs/项目基础/文档清单.md":
        "Mention `docs/new-current-doc.md` in prose only.\n\n| Path | Class | Notes |\n| --- | --- | --- |",
      "docs/new-current-doc.md": "# New current doc",
    });
    tempDirs.push(repoDir);

    expect(
      collectDocumentInventoryFindings(repoDir, ["docs/new-current-doc.md"]),
    ).toEqual([
      {
        file: "docs/项目基础/文档清单.md",
        error:
          'tracked document is missing from inventory "docs/new-current-doc.md"',
      },
    ]);
  });

  it("requires non-Markdown tracked docs to be inventoried", () => {
    const repoDir = createTempRepo({
      "docs/项目基础/文档清单.md":
        "| Path | Class | Notes |\n| --- | --- | --- |\n| `docs/项目基础/文档清单.md` | `current-reference` | Inventory. |",
      "docs/runtime-proof.json": "{}",
    });
    tempDirs.push(repoDir);
    execFileSync("git", ["init", "-q"], { cwd: repoDir });
    execFileSync("git", ["add", "docs"], { cwd: repoDir });

    expect(collectDocumentInventoryFindings(repoDir)).toEqual([
      {
        file: "docs/项目基础/文档清单.md",
        error:
          'tracked document is missing from inventory "docs/runtime-proof.json"',
      },
    ]);
  });

  it("rejects inventory rows without a lifecycle class and retention reason", () => {
    const repoDir = createTempRepo({
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |\n| `docs/unclassified.json` |  |  |",
      "docs/unclassified.json": "{}",
    });
    tempDirs.push(repoDir);

    expect(
      collectDocumentInventoryFindings(repoDir, ["docs/unclassified.json"]),
    ).toEqual([
      {
        file: "docs/项目基础/文档清单.md",
        error:
          'tracked document is missing from inventory "docs/unclassified.json"',
      },
    ]);
  });

  it("accepts the documented inherited-starter lifecycle class", () => {
    const repoDir = createTempRepo({
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |\n| `docs/inherited.md` | `inherited-starter-reference` | Retained upstream reference. |",
      "docs/inherited.md": "# Inherited reference",
    });
    tempDirs.push(repoDir);

    expect(
      collectDocumentInventoryFindings(repoDir, ["docs/inherited.md"]),
    ).toEqual([]);
  });

  it("rejects a missing current source path but ignores a negated path", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| Path | Class | Notes |\n| --- | --- | --- |",
      "docs/current.md": "Use `src/missing.ts` as the runtime entry.",
      "docs/negated.md": [
        "Do not create `src/proxy.ts` for this project.",
        "Do not rename `src/live.ts` to `src/renamed.ts`.",
        "`src/not-created.ts` is not created.",
        "Production code must not import `src/test-only-a.ts`, or",
        "`src/test-only-b.ts`.",
      ].join("\n"),
      "src/live.ts": "export const live = true;",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, [
        "docs/current.md",
        "docs/negated.md",
      ]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/missing.ts"',
      },
    ]);
  });

  it("requires wildcard paths to match files and checks directory references", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| Path | Class | Notes |\n| --- | --- | --- |",
      "docs/current.md": [
        "Use `src/empty/*.ts` as the runtime source.",
        "Keep the helpers under `tests/missing-directory`.",
      ].join("\n"),
      "src/empty/.gitkeep": "",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/empty/*.ts"',
      },
      {
        file: "docs/current.md",
        error:
          'documented repository path does not exist "tests/missing-directory"',
      },
    ]);
  });

  it("does not let an unrelated negation hide a positive path reference", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| Path | Class | Notes |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not use the legacy entry. Use `src/missing.ts` as the runtime entry.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/missing.ts"',
      },
    ]);
  });

  it("does not inherit an unpunctuated negative sentence across lines", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not use the legacy entry\n`src/missing.ts` is the current runtime entry.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/missing.ts"',
      },
    ]);
  });

  it("resets negation at an explicit contrast clause", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not use `src/legacy.ts`, but use `src/missing.ts` as current.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/missing.ts"',
      },
    ]);
  });

  it("resets negation when a comma introduces a positive instruction", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not use `src/legacy.ts`, use `src/current-missing.ts` as the runtime entry.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error:
          'documented repository path does not exist "src/current-missing.ts"',
      },
    ]);
  });

  it("keeps comma-separated paths inside one negative instruction", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md": "Do not use `src/a.ts`, `src/b.ts`, or `src/c.ts`.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([]);
  });

  it("resets negation when an instead clause gives the active path", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not use `src/legacy.ts`, instead use `src/current-missing.ts`.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error:
          'documented repository path does not exist "src/current-missing.ts"',
      },
    ]);
  });

  it("keeps coordinated action lists under the leading negation", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not use `src/a.ts`, create `src/b.ts`, or add `src/c.ts`.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([]);
  });

  it("does not treat a negated noun phrase as a positive instruction", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not use `src/a.ts`, use of `src/b.ts` is also prohibited.",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([]);
  });

  it("recognizes standalone negative predicates without hiding positive ones", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md": [
        "Use of `src/prohibited.ts` is prohibited.",
        "`src/must-not-use.ts` must not be used.",
        "Use of `src/required.ts` is required.",
      ].join("\n"),
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/required.ts"',
      },
    ]);
  });

  it("resets negation for explicit positive path predicates", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md": [
        "Do not use `src/legacy-a.ts`, `src/required.ts` is required.",
        "Do not use `src/legacy-b.ts`, use of `src/also-required.ts` is required.",
      ].join("\n"),
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/required.ts"',
      },
      {
        file: "docs/current.md",
        error:
          'documented repository path does not exist "src/also-required.ts"',
      },
    ]);
  });

  it("does not exempt a positive requirement merely because it contains not", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md": [
        "`src/required.ts` should not be missing.",
        "`src/not-missing.ts` is not missing.",
        "`src/not-used.ts` is not used.",
        "`src/never-used.ts` should never be used.",
        "`src/never-imported.ts` can never be imported.",
        "`src/never-created.ts` is never created.",
        "`src/never-exists.ts` never exists.",
      ].join("\n"),
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/required.ts"',
      },
      {
        file: "docs/current.md",
        error: 'documented repository path does not exist "src/not-missing.ts"',
      },
    ]);
  });

  it("requires preserved sources while exempting rename and replace targets", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md": [
        "Do not delete `src/delete.ts`.",
        "Never remove `src/remove.ts`.",
        "You must not delete `src/must-keep.ts`.",
        "Do not rename `src/rename-source.ts` to `src/rename-target.ts`.",
        "Do not move `src/move-source.ts` to `src/move-target.ts`.",
        "Do not replace `src/replace-source.ts` with `src/replace-target.ts`.",
        "You should not rename `src/should-rename-source.ts` to `src/should-rename-target.ts`.",
        "You cannot move `src/cannot-move-source.ts` to `src/cannot-move-target.ts`.",
        "You may not replace `src/may-replace-source.ts` with `src/may-replace-target.ts`.",
        "You can not rename `src/can-not-rename-source.ts` to `src/can-not-rename-target.ts`.",
        "You must never rename `src/must-never-rename-source.ts` to `src/must-never-rename-target.ts`.",
        "`src/passive-rename-source.ts` must not be renamed to `src/passive-rename-target.ts`.",
        "`src/passive-move-source.ts` must not be moved to `src/passive-move-target.ts`.",
        "`src/passive-replace-source.ts` must not be replaced with `src/passive-replace-target.ts`.",
        "`src/passive-never-source.ts` must never be renamed to `src/passive-never-target.ts`.",
        "`src/passive-is-not-rename-source.ts` is not renamed to `src/passive-is-not-rename-target.ts`.",
        "`src/passive-is-not-move-source.ts` is not moved to `src/passive-is-not-move-target.ts`.",
        "`src/passive-is-not-replace-source.ts` is not replaced with `src/passive-is-not-replace-target.ts`.",
        "`src/passive-source-only.ts` must not be renamed.",
      ].join("\n"),
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual(PRESERVED_ENGLISH_PATH_SOURCES.map(missingCurrentDocPath));
  });

  it("applies the same source and target roles to Chinese directives", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md": [
        "不要删除 `src/keep.ts`。",
        "当前不把 `src/source.ts` 盲目改成 `src/target.ts`。",
        "当前不将 `src/not-jiang-rename-source.ts` 重命名为 `src/not-jiang-rename-target.ts`。",
        "当前不将 `src/not-jiang-move-source.ts` 移动到 `src/not-jiang-move-target.ts`。",
        "当前不将 `src/not-jiang-replace-source.ts` 替换为 `src/not-jiang-replace-target.ts`。",
        "不要把 `src/ba-rename-source.ts` 重命名成 `src/ba-rename-target.ts`。",
        "不得将 `src/jiang-replace-source.ts` 替换成 `src/jiang-replace-target.ts`。",
        "禁止把 `src/ba-move-source.ts` 移动至 `src/ba-move-target.ts`。",
        "不要移动 `src/direct-move-source.ts` 到 `src/direct-move-target.ts`。",
        "不要重命名 `src/direct-rename-source.ts` 为 `src/direct-rename-target.ts`。",
        "不要替换 `src/direct-replace-source.ts` 为 `src/direct-replace-target.ts`。",
        "不要创建 `src/absent.ts`。",
      ].join("\n"),
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual(
      [
        "src/keep.ts",
        "src/source.ts",
        "src/not-jiang-rename-source.ts",
        "src/not-jiang-move-source.ts",
        "src/not-jiang-replace-source.ts",
        "src/ba-rename-source.ts",
        "src/jiang-replace-source.ts",
        "src/ba-move-source.ts",
        "src/direct-move-source.ts",
        "src/direct-rename-source.ts",
        "src/direct-replace-source.ts",
      ].map(missingCurrentDocPath),
    );
  });

  it("inherits an explicit negative heading into Markdown list items", () => {
    const files = {
      "docs/项目基础/文档清单.md":
        "| 文件 | 标签 | 作用 |\n| --- | --- | --- |",
      "docs/current.md":
        "Do not create these paths:\n- `src/legacy.ts`\n- `tests/legacy.test.ts`",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectBacktickedRepoPathFindings(repoDir, ["docs/current.md"]),
    ).toEqual([]);
  });

  it("rejects registered GSE ids without a production consumer", () => {
    const files = {
      "docs/项目基础/维护规则.md":
        "## Active production structural exceptions\n\n| ID | File | Rule | Reason | Verification |\n| --- | --- | --- | --- | --- |\n| GSE-20260716-live-flow | src/app/example.ts | max-lines | reason | verification |",
      "src/app/example.ts": "export const value = 1;",
      "src/app/__tests__/example.test.ts":
        "// guardrail-exception GSE-20260716-live-flow: tests cannot consume production exceptions",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectGuardrailRegistryFindings(repoDir, [
        "src/app/example.ts",
        "src/app/__tests__/example.test.ts",
      ]),
    ).toEqual([
      {
        file: "docs/项目基础/维护规则.md",
        error:
          'registered guardrail exception has no production consumer "gse-20260716-live-flow"',
      },
    ]);
  });

  it("does not count strings, ordinary comments, or non-structural disables as GSE consumers", () => {
    const files = {
      "docs/项目基础/维护规则.md":
        "## Active production structural exceptions\n\n| ID | File | Rule | Reason | Verification |\n| --- | --- | --- | --- | --- |\n| GSE-20260716-live-flow | src/app/example.ts | max-lines | reason | verification |",
      "src/app/example.ts": [
        'export const decoy = "guardrail-exception GSE-20260716-live-flow";',
        "// guardrail-exception GSE-20260716-live-flow: ordinary comment",
        "// eslint-disable-next-line no-console -- guardrail-exception GSE-20260716-live-flow: non-structural rule",
        'console.log("decoy");',
      ].join("\n"),
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectGuardrailRegistryFindings(repoDir, ["src/app/example.ts"]),
    ).toEqual([
      {
        file: "docs/项目基础/维护规则.md",
        error:
          'registered guardrail exception has no production consumer "gse-20260716-live-flow"',
      },
    ]);
  });

  it("accepts registered GSE ids with a production consumer", () => {
    const files = {
      "docs/项目基础/维护规则.md":
        "## Active production structural exceptions\n\n| ID | File | Rule | Reason | Verification |\n| --- | --- | --- | --- | --- |\n| GSE-20260716-live-flow | src/app/example.ts | max-lines | reason | verification |",
      "src/app/example.ts":
        "// eslint-disable-next-line max-lines -- guardrail-exception GSE-20260716-live-flow: reason\nexport const value = 1;",
    };
    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    expect(
      collectGuardrailRegistryFindings(repoDir, ["src/app/example.ts"]),
    ).toEqual([]);
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

describe("current-truth docs product ownership markers", () => {
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
          required: expect.arrayContaining([
            "src/constants/tucsenberg-product-pages.ts",
            "src/config/single-site-product-catalog.ts",
          ]),
        }),
      ]),
    );
  });
});
