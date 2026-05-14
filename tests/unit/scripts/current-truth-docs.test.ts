import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  CHECKS,
  RELEASE_PROOF_SEQUENCE,
  collectCurrentTruthDocFindings,
  findOutOfOrderCommand,
} from "../../../scripts/starter-checks.js";

function createTempRepo(files: Record<string, string>) {
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

function createValidFiles() {
  const files: Record<string, string> = {};

  for (const check of CHECKS) {
    files[check.file] = [...(check.required ?? []), "safe baseline text"].join(
      "\n",
    );
  }
  files["docs/guides/RELEASE-PROOF-RUNBOOK.md"] = [
    files["docs/guides/RELEASE-PROOF-RUNBOOK.md"],
    ...RELEASE_PROOF_SEQUENCE,
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

  it("passes when required current-truth markers are present", () => {
    const repoDir = createTempRepo(createValidFiles());
    tempDirs.push(repoDir);

    expect(collectCurrentTruthDocFindings(repoDir)).toEqual([]);
  });

  it("flags missing required markers and forbidden stale markers", () => {
    const files = createValidFiles();
    files["docs/guides/CANONICAL-TRUTH-REGISTRY.md"] =
      "src/config/single-site-page-expression.ts";
    files[".claude/rules/i18n.md"] = "messages/en/critical.json";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "docs/guides/CANONICAL-TRUTH-REGISTRY.md",
          error:
            'missing current-truth pattern "src/config/single-site-seo.ts"',
        }),
        expect.objectContaining({
          file: ".claude/rules/i18n.md",
          error:
            'missing current-truth pattern "Current repo truth does **not** include a live `src/sites/**/messages/**` runtime overlay layout."',
        }),
      ]),
    );
  });

  it("flags documented pnpm package scripts that no longer exist", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        "review:tier-a": "echo retired",
      },
    });
    files["docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md"] =
      "Run `pnpm review:tier-a:staged` for staged Tier A review.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md",
        error: 'forbidden current-truth pattern "pnpm review:tier-a:staged"',
      }),
    );
    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md",
        error: 'unknown package script command "pnpm review:tier-a:staged"',
      }),
    );
  });

  it("flags retired Cloudflare script directory in Tier A owner map", () => {
    const files = createValidFiles();
    files["docs/guides/TIER-A-OWNER-MAP.md"] =
      "Platform build + deployment chain uses scripts/cloudflare/**.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/guides/TIER-A-OWNER-MAP.md",
        error: 'forbidden current-truth pattern "scripts/cloudflare/**"',
      }),
    );
  });

  it("flags retired Cloudflare script directory in the architecture diagram", () => {
    const files = createValidFiles();
    files["docs/technical/project-architecture-diagram.svg"] =
      "<text>next.config.ts + scripts/cloudflare/**</text>";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/technical/project-architecture-diagram.svg",
        error: 'forbidden current-truth pattern "scripts/cloudflare/**"',
      }),
    );
  });

  it("flags Cloudflare image optimization as a default starter claim", () => {
    const files = createValidFiles();
    files["docs/website/部署设置.md"] =
      "Cloudflare Image Optimization is enabled by default for every starter deployment.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/website/部署设置.md",
        error:
          'forbidden current-truth pattern "Cloudflare Image Optimization is enabled by default"',
      }),
    );
  });

  it("flags retired package scripts in starter-facing website docs", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        build: "next build",
      },
    });
    files["docs/website/quality-proof.md"] =
      "Run `pnpm website:content:readiness` after replacement.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/website/quality-proof.md",
        error:
          'unknown package script command "pnpm website:content:readiness"',
      }),
    );
  });

  it("flags retired package scripts in active design governance docs", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        "component:check": "echo ok",
      },
    });
    files["docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md"] =
      "Run `pnpm storybook:build` for section review.";

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/impeccable/system/SECTION-REDESIGN-CHECKLIST.md",
        error: 'unknown package script command "pnpm storybook:build"',
      }),
    );
  });

  it("allows deployed lead canary direct pnpm exec command in starter-facing docs", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        build: "next build",
      },
    });
    files["docs/website/quality-proof.md"] =
      'POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec playwright test tests/e2e/smoke/';

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        file: "docs/website/quality-proof.md",
        error: 'unknown package script command "pnpm exec"',
      }),
    );
  });

  it("flags release runbook drift from the canonical release-proof script", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: Object.fromEntries(
        RELEASE_PROOF_SEQUENCE.filter((command) =>
          command.startsWith("pnpm "),
        ).map((command) => [command.replace("pnpm ", ""), "echo ok"]),
      ),
    });
    files["docs/guides/RELEASE-PROOF-RUNBOOK.md"] = [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "dirty worktree",
      "targeted proof",
      "clean branch",
      "node scripts/starter-checks.js truth-docs",
    ].join("\n");

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/guides/RELEASE-PROOF-RUNBOOK.md",
        error:
          'missing release-proof runbook command "node scripts/starter-checks.js cf-official-compare --source-only"',
      }),
    );
  });

  it("flags release runbook command order drift", () => {
    const files = createValidFiles();
    const scripts = Object.fromEntries(
      RELEASE_PROOF_SEQUENCE.filter((command) =>
        command.startsWith("pnpm "),
      ).map((command) => [command.replace("pnpm ", ""), "echo ok"]),
    );
    files["package.json"] = JSON.stringify({ scripts });
    files["docs/guides/RELEASE-PROOF-RUNBOOK.md"] = [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "dirty worktree",
      "targeted proof",
      "clean branch",
      RELEASE_PROOF_SEQUENCE[0],
      RELEASE_PROOF_SEQUENCE[5],
      RELEASE_PROOF_SEQUENCE[1],
      ...RELEASE_PROOF_SEQUENCE.slice(2, 5),
      ...RELEASE_PROOF_SEQUENCE.slice(6),
    ].join("\n");

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).toContainEqual(
      expect.objectContaining({
        file: "docs/guides/RELEASE-PROOF-RUNBOOK.md",
        error: `release-proof runbook command order drift at "${RELEASE_PROOF_SEQUENCE[5]}"`,
      }),
    );
  });

  it("does not require derivative checklist to maintain a separate build proof order", () => {
    const files = createValidFiles();
    files["package.json"] = JSON.stringify({
      scripts: {
        build: "next build",
        "website:build:cf": "pnpm exec opennextjs-cloudflare build --noMinify",
      },
    });
    files["docs/guides/DERIVATIVE-PROJECT-REPLACEMENT-CHECKLIST.md"] = [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "src/config/single-site-product-catalog.ts",
      "src/constants/product-specs/**",
      "Do not replace first",
      "docs/website/新项目替换清单.md",
      "does not own the step-by-step replacement order",
      "Minimum proof references",
      "pnpm website:build:cf",
      "pnpm build",
    ].join("\n");

    const repoDir = createTempRepo(files);
    tempDirs.push(repoDir);

    const findings = collectCurrentTruthDocFindings(repoDir);

    expect(findings).not.toContainEqual(
      expect.objectContaining({
        file: "docs/guides/DERIVATIVE-PROJECT-REPLACEMENT-CHECKLIST.md",
        error: '"pnpm build" must appear before "pnpm website:build:cf"',
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
