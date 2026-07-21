import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import {
  HISTORICAL_BANNER,
  HISTORICAL_DERIVATION_DOCS,
  RETIRED_PUBLIC_TRUTH_PATTERNS,
  REQUIRED_TRUTH_FILES,
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

  for (const file of REQUIRED_TRUTH_FILES) {
    files[file] = "safe baseline text";
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

  it("keeps current Cache Components and PPR claims aligned with runtime config", () => {
    const nextConfig = fs.readFileSync(path.resolve("next.config.ts"), "utf8");
    const configuredValue = nextConfig.match(
      /\bcacheComponents:\s*(true|false)/u,
    )?.[1];
    const currentRuntimeDocs = [
      "AGENTS.md",
      "CLAUDE.md",
      ".claude/rules/conventions.md",
      ".claude/rules/cloudflare.md",
      ".claude/rules/i18n.md",
      "docs/项目基础/技术栈.md",
      "docs/技术难题/路由模式基线.md",
    ].map((file) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo-owned truth-doc paths
      return [file, fs.readFileSync(path.resolve(file), "utf8")] as const;
    });

    expect(configuredValue).toBeDefined();
    for (const [file, source] of currentRuntimeDocs) {
      expect(
        source,
        `${file} must match next.config.ts cache runtime truth`,
      ).toContain(`cacheComponents: ${configuredValue}`);
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

  const minimalInventoryFixture = {
    "docs/项目基础/文档清单.md":
      "| Path | Class | Notes |\n| --- | --- | --- |",
  };

  it("keeps flagging documented src paths that do not exist", () => {
    const repoDir = createTempRepo({
      ...minimalInventoryFixture,
      "doc.md": "Use `src/lib/definitely-missing.ts` for X.\n",
    });
    try {
      expect(
        collectBacktickedRepoPathFindings(repoDir, ["doc.md"]),
      ).toHaveLength(1);
    } finally {
      moveTempRepoToTrash(repoDir);
    }
  });

  it("skips missing paths only on lines with the allow-missing marker", () => {
    const repoDir = createTempRepo({
      ...minimalInventoryFixture,
      "doc.md":
        "Do not create `src/lib/definitely-missing.ts` <!-- truth-docs:allow-missing -->.\n",
    });
    try {
      expect(collectBacktickedRepoPathFindings(repoDir, ["doc.md"])).toEqual(
        [],
      );
    } finally {
      moveTempRepoToTrash(repoDir);
    }
  });

  it("does not exempt a missing path from negation wording alone", () => {
    const repoDir = createTempRepo({
      ...minimalInventoryFixture,
      "doc.md": "不要创建 `src/lib/definitely-missing.ts`。\n",
    });
    try {
      expect(
        collectBacktickedRepoPathFindings(repoDir, ["doc.md"]),
      ).toHaveLength(1);
    } finally {
      moveTempRepoToTrash(repoDir);
    }
  });

  it("reports required truth files that are missing", () => {
    const files = createValidFiles();
    const target =
      REQUIRED_TRUTH_FILES.find(
        (file) => file !== "docs/项目基础/文档清单.md",
      ) ?? REQUIRED_TRUTH_FILES[0];
    if (!target) throw new Error("REQUIRED_TRUTH_FILES must not be empty");
    delete files[target];
    const repoDir = createTempRepo(files);
    try {
      const findings = collectCurrentTruthDocFindings(repoDir);
      expect(
        findings.some((f) =>
          f.error.includes(`missing required current-truth file "${target}"`),
        ),
      ).toBe(true);
    } finally {
      moveTempRepoToTrash(repoDir);
    }
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
