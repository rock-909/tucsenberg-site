import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { RELEASE_PROOF_SEQUENCE } from "../../../scripts/starter-checks.js";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const SPLIT_LOCALE_PATHS = [
  "messages/en/critical.json",
  "messages/en/deferred.json",
  "messages/zh/critical.json",
  "messages/zh/deferred.json",
];
const REMOVED_FLAT_LOCALE_PATHS = ["messages/en.json", "messages/zh.json"];
const LEAD_FAMILY_TEST_FILES = [
  "tests/integration/api/lead-family-contract.test.ts",
  "tests/integration/api/lead-family-protection.test.ts",
  "src/app/api/inquiry/__tests__/route.test.ts",
  "tests/integration/api/subscribe.test.ts",
] as const;
const RETIRED_NON_STARTER_TEST_DIRS = [
  "tests/semgrep",
  "tests/e2e/__snapshots__",
] as const;
const RETIRED_NON_STARTER_TEST_FILES = [
  "tests/e2e/firefox-diagnosis.spec.ts",
  "tests/e2e/header-layout.bbox.spec.ts",
  "tests/e2e/performance.spec.ts",
  "tests/e2e/visual-cross-browser.spec.ts",
  "tests/e2e/visual-regression.spec.ts",
] as const;
const RETIRED_ACTIVE_PROOF_MARKERS = [
  "tests/semgrep",
  "Semgrep untrusted key write",
  "browser visual smoke",
  "visual regression",
  "tests/e2e/visual",
  "performance.spec.ts",
  "header-layout.bbox",
  "firefox-diagnosis",
  "__snapshots__",
  "toHaveScreenshot",
  "toMatchSnapshot",
] as const;

interface WorkflowStep {
  readonly name?: string;
  readonly if?: string;
  readonly run?: string;
  readonly uses?: string;
  readonly with?: Record<string, unknown>;
  readonly env?: Record<string, string>;
}

interface WorkflowJob {
  readonly name?: string;
  readonly "runs-on"?: string;
  readonly needs?: string | string[];
  readonly "timeout-minutes"?: number;
  readonly container?: string;
  readonly steps?: WorkflowStep[];
}

interface Workflow {
  readonly jobs?: Record<string, WorkflowJob>;
}

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function readCiWorkflow(): Workflow {
  return yaml.load(readRepoFile(".github/workflows/ci.yml")) as Workflow;
}

function listRepoFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(REPO_ROOT, relativeDir);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test checks fixed retired artifact directories
  if (!fs.existsSync(absoluteDir)) return [];

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test checks fixed retired artifact directories
  return fs
    .readdirSync(absoluteDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(REPO_ROOT, path.join(entry.parentPath, entry.name)),
    );
}

describe("Semgrep proof lane contract", () => {
  it("wires Semgrep through CI without depending on fake npm semgrep", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const workflow = readCiWorkflow();
    const semgrepJob = workflow.jobs?.semgrep;
    const ciSummaryNeeds = workflow.jobs?.["ci-summary"]?.needs;
    const checkoutStep = semgrepJob?.steps?.find(
      (step) => step.uses === "actions/checkout@v6",
    );
    const semgrepStep = semgrepJob?.steps?.find(
      (step) => step.name === "运行 Semgrep",
    );
    const ciSummaryRun =
      workflow.jobs?.["ci-summary"]?.steps?.find(
        (step) => step.name === "检查所有作业状态",
      )?.run ?? "";

    expect(packageJson.dependencies?.semgrep).toBeUndefined();
    expect(packageJson.devDependencies?.semgrep).toBeUndefined();
    expect(semgrepJob).toMatchObject({
      name: "Semgrep 安全扫描",
      "runs-on": "ubuntu-latest",
      needs: "quality",
      "timeout-minutes": 10,
      container: "semgrep/semgrep:1.162.0",
    });
    expect(checkoutStep).toMatchObject({
      name: "检出代码",
      uses: "actions/checkout@v6",
      with: { submodules: false, "persist-credentials": false },
    });
    expect(semgrepStep?.run).toContain(
      "semgrep scan --error --severity ERROR --config semgrep.yml src",
    );
    expect(ciSummaryNeeds).toContain("semgrep");
    for (const expectedSummaryText of [
      "needs.semgrep.result",
      "| Semgrep 安全扫描 | ${{ needs.semgrep.result }} |",
      '${{ needs.semgrep.result }}" != "success"',
    ]) {
      expect(ciSummaryRun).toContain(expectedSummaryText);
    }
  });

  it("documents Semgrep local binary absence as blocked instead of passed", () => {
    const qualityProof = readRepoFile("docs/website/quality-proof.md");
    const qualityProofLevels = readRepoFile(
      "docs/guides/QUALITY-PROOF-LEVELS.md",
    );

    expect(qualityProof).toContain("Semgrep local CLI may be unavailable");
    expect(qualityProofLevels).toContain(
      "A missing local `semgrep` binary is `Blocked`, not `Passed`.",
    );
  });
});

describe("proof lane contract", () => {
  it("documents the no-proxy migration policy for Cloudflare/OpenNext", () => {
    const cloudflareRules = readRepoFile(".claude/rules/cloudflare.md");
    const routeModeContract = readRepoFile(
      "docs/quality/route-mode-contract.md",
    );
    const qualityProof = readRepoFile("docs/website/quality-proof.md");

    for (const content of [cloudflareRules, routeModeContract, qualityProof]) {
      expect(content).toContain(
        "Do not rename `src/middleware.ts` to `src/proxy.ts`",
      );
      expect(content).toContain(
        "Cloudflare/OpenNext support is not acceptable for a blind migration",
      );
    }

    expect(qualityProof).toContain("Next.js deprecation warning");
    expect(qualityProof).toContain("known platform-transition warning");
  });

  it("makes release verify wording impossible to confuse with public launch proof", () => {
    const releaseProofScript = readRepoFile("scripts/starter-checks.js");
    const qualityProof = readRepoFile("docs/website/quality-proof.md");
    const releaseRunbook = readRepoFile("docs/guides/RELEASE-PROOF-RUNBOOK.md");

    expect(releaseProofScript).toContain("Local release proof completed");
    expect(releaseProofScript).toContain("NOT public launch proof");
    expect(releaseProofScript).not.toContain(
      "Release verification completed successfully.",
    );

    for (const content of [qualityProof, releaseRunbook]) {
      expect(content).toContain(
        "Local release proof is not public launch proof",
      );
      expect(content).toContain(
        "PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config",
      );
      expect(content).toContain("deployed lead canary");
    }
  });

  it("keeps Wrangler dry-run secrets out of pull request workflows", () => {
    const workflow = readCiWorkflow();
    const steps = workflow.jobs?.["cloudflare-build"]?.steps ?? [];
    const buildIndex = steps.findIndex(
      (step) => step.name === "Cloudflare/OpenNext 构建",
    );
    const dryRunIndex = steps.findIndex(
      (step) => step.name === "Cloudflare/Wrangler dry-run",
    );
    const dryRunStep = steps[dryRunIndex];
    const dryRunCondition = dryRunStep?.if ?? "";

    expect(buildIndex).toBeGreaterThan(-1);
    expect(dryRunIndex).toBeGreaterThan(-1);
    expect(buildIndex).toBeLessThan(dryRunIndex);
    expect(dryRunCondition).toBe("${{ github.event_name != 'pull_request' }}");
    expect(dryRunStep?.run).toContain(
      "pnpm exec wrangler deploy --dry-run --env preview",
    );
    expect(dryRunStep?.env).toEqual(
      expect.objectContaining({
        NODE_ENV: "production",
        APP_ENV: "preview",
        NEXT_PUBLIC_SITE_URL: "https://tucsenberg.com",
        CLOUDFLARE_API_TOKEN: "${{ secrets.CLOUDFLARE_API_TOKEN }}",
        CLOUDFLARE_ACCOUNT_ID: "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
      }),
    );
  });

  it("keeps release proof wired without the removed cluster command wrapper", () => {
    const packageJson = readRepoFile("package.json");
    const releaseProofFlow = RELEASE_PROOF_SEQUENCE.join("\n");

    expect(packageJson).toContain('"release:verify"');
    expect(packageJson).toContain('"brand:check"');
    expect(packageJson).toContain('"content:check"');
    expect(packageJson).toContain('"component:check"');
    expect(packageJson).toContain('"website:check"');
    expect(packageJson).toContain('"website:build:cf"');
    expect(packageJson).toContain(
      '"release:verify": "node scripts/starter-checks.js release-verify"',
    );

    expect(releaseProofFlow).toContain(
      "node scripts/starter-checks.js truth-docs",
    );
    expect(releaseProofFlow).toContain(
      "node scripts/starter-checks.js cf-static-baseline --source-only",
    );
    expect(releaseProofFlow).not.toContain(
      "node scripts/starter-checks.js cf-static-baseline --generated-only",
    );
    expect(
      releaseProofFlow.indexOf(
        "node scripts/starter-checks.js cf-static-baseline --source-only",
      ),
    ).toBeLessThan(
      releaseProofFlow.indexOf(
        "pnpm exec wrangler deploy --dry-run --env preview",
      ),
    );
    expect(releaseProofFlow).not.toContain("phase6");
    expect(releaseProofFlow).not.toContain("build-webpack");
    expect(releaseProofFlow).not.toContain("deploy-phase6");
    expect(releaseProofFlow).not.toContain(
      "node scripts/review-derivative-readiness.js",
    );
    expect(releaseProofFlow).not.toContain("pnpm review:docs-truth");
    expect(releaseProofFlow).not.toContain(
      "pnpm review:cf:official-compare:source",
    );
    expect(releaseProofFlow).not.toContain(
      "pnpm review:cf:official-compare:generated",
    );
    expect(releaseProofFlow).not.toContain("pnpm review:derivative-readiness");
    expect(releaseProofFlow).not.toContain("node scripts/review-clusters.js");
    expect(releaseProofFlow).not.toContain("pnpm review:clusters");
  });

  it("keeps the canonical starter proof command surface", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const scripts = packageJson.scripts;

    const expectedScripts = Object.entries({
      "brand:check": "node scripts/starter-checks.js brand",
      "content:check":
        "node scripts/starter-checks.js content-manifest --check && node scripts/starter-checks.js content-slugs && node scripts/starter-checks.js translations",
      "component:check":
        "pnpm component:governance:test && pnpm component:governance && pnpm exec storybook build",
      "component:governance":
        "node scripts/starter-checks.js component-governance",
      "website:check":
        "pnpm type-check && pnpm lint:check && pnpm test && pnpm build",
      start: "next start",
      "website:build:cf": "pnpm exec opennextjs-cloudflare build --noMinify",
      "route-mode:snapshot": "node scripts/quality/route-mode-snapshot.mjs",
    } satisfies Record<string, string>);

    for (const [scriptName, command] of expectedScripts) {
      expect(scripts[scriptName]).toBe(command);
    }
  });

  it("uses split critical/deferred messages as the translation source of truth", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const scripts = packageJson.scripts;

    expect(scripts).not.toHaveProperty("i18n:regenerate-flat");
    expect(scripts).not.toHaveProperty("validate:translations");
  });

  it("does not require flat locale files", () => {
    for (const splitPath of SPLIT_LOCALE_PATHS) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
      expect(fs.existsSync(path.join(REPO_ROOT, splitPath))).toBe(true);
    }

    for (const relativePath of REMOVED_FLAT_LOCALE_PATHS) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
      expect(fs.existsSync(path.join(REPO_ROOT, relativePath))).toBe(false);
    }
  });

  it("does not expose old governance command families as default scripts", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const scriptNames = Object.keys(packageJson.scripts);

    expect(scriptNames.filter((name) => name.startsWith("arch:"))).toEqual([]);
    expect(scriptNames.filter((name) => name.startsWith("quality:"))).toEqual(
      [],
    );
    expect(scriptNames).not.toContain("review:clusters");
    expect(scriptNames).not.toContain("review:cluster");
    expect(scriptNames).not.toContain("review:lead-family");
    expect(scriptNames).not.toContain("review:translation-quartet");
    expect(scriptNames).not.toContain("review:architecture-truth");
    expect(scriptNames).not.toContain("test:visual");
    expect(scriptNames).not.toContain("test:visual:update");
    expect(scriptNames).not.toContain("test:e2e:visual-cross");
    expect(scriptNames).not.toContain("ci:local");
    expect(scriptNames).not.toContain("ci:local:quick");
    expect(scriptNames).not.toContain("ci:local:fix");
  });

  it("keeps internal diagnostic helpers out of the public starter command surface", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const scriptNames = Object.keys(packageJson.scripts);

    expect(scriptNames.length).toBeLessThanOrEqual(30);
    expect(scriptNames.length).toBeLessThanOrEqual(20);
    expect(scriptNames).not.toEqual(
      expect.arrayContaining([
        "analyze:size",
        "analyze:stats",
        "build:analyze",
        "build:analyze:webpack",
        "build:check",
        "cf:sync:server-actions-key",
        "cf:sync:server-actions-key:dry-run",
        "design:detect",
        "design:detect:ci",
        "dev:react-grab",
        "i18n:shape:check",
        "i18n:validate:code",
        "lint:pii",
        "perf:check",
        "perf:lighthouse",
        "proof:release:tier-a",
        "review:cf:official-compare:generated",
        "review:cf:official-compare:source",
        "review:cf:official-compare",
        "review:derivative-readiness",
        "review:docs-truth",
        "review:health",
        "review:tier-a",
        "scan:translations",
        "security:check",
        "security:csp:check",
        "sync:translations:enhanced",
        "test:debug",
        "test:coverage",
        "test:e2e:ci-local",
        "test:e2e:no-reuse",
        "test:lead-family",
        "test:locale-runtime",
        "test:release-smoke",
        "test:translate-compat",
        "transform:barrel",
        "transform:barrel:dry",
        "truth:check",
        "typegen",
        "type-check:generated",
        "type-check:source",
        "type-check:tests",
        "unused:check",
        "unused:fix",
        "unused:production",
        "validate:generated-types",
        "validate:translations",
        "validate:config",
        "config:check",
        "content:slug-check",
        "eslint:disable:check",
        "clean:next-artifacts",
        "format:check",
        "preview:cf",
        "smoke:cf:deploy",
        "smoke:cf:preview",
        "storybook:build",
        "test:e2e:post-deploy",
        "validate:launch-content",
      ]),
    );
  });

  it("keeps manual Lighthouse proof URLs aligned with shipped dynamic routes", () => {
    const lighthouseConfig = readRepoFile("lighthouserc.js");
    const productCatalog = readRepoFile(
      "src/config/single-site-product-catalog.ts",
    );
    const starterBlog = readRepoFile("src/lib/blog/starter-blog.ts");

    expect(lighthouseConfig).toContain("/en/products/north-america");
    expect(lighthouseConfig).toContain("/zh/products/north-america");
    expect(lighthouseConfig).toContain("/en/blog/prepare-before-launch");
    expect(lighthouseConfig).toContain("/zh/blog/prepare-before-launch");
    expect(productCatalog).toContain('slug: "north-america"');
    expect(starterBlog).toContain('slug: "prepare-before-launch"');
    expect(lighthouseConfig).not.toContain("industrial-control-panel");
    expect(lighthouseConfig).not.toContain("/blog/welcome");
  });

  it("removes retired governance script files after public command pruning", () => {
    for (const relativePath of [
      "scripts/append-guardrail-summary.js",
      "scripts/architecture-metrics.js",
      "scripts/archive-hygiene-audit.js",
      "scripts/check-mutation-required.js",
      "scripts/check-review-hygiene.js",
      "scripts/dependency-conformance.js",
      "scripts/ci-local.sh",
      "scripts/quality-gate.js",
      "scripts/quality-monitor.js",
      "scripts/quality-quick-staged.js",
      "scripts/review-analysis-env-boundaries.js",
      "scripts/review-boundary-leaks.js",
      "scripts/review-ci-env-boundaries.js",
      "scripts/review-contract-smells.js",
      "scripts/review-env-boundaries.js",
      "scripts/review-proof-env-boundaries.js",
      "scripts/review-server-env-boundaries.js",
      "scripts/review-template-residue.js",
      "scripts/run-cluster-review.js",
      "scripts/run-scripts-env-review.js",
      "scripts/structural-hotspots.js",
      "scripts/transform-barrel-exports.js",
      "scripts/translation-scanner.js",
      "scripts/validate-i18n-content.ts",
      "scripts/check-pii-in-logs.js",
      "scripts/check-translate-compat.js",
      "scripts/csp/check-inline-scripts.ts",
      "scripts/legacy-marker-audit.js",
      "scripts/semgrep-common.js",
      "scripts/semgrep-scan.js",
      "scripts/semgrep-test-rules.js",
      "scripts/dependency-update-policy.mjs",
      "scripts/deps-check.mjs",
      "scripts/tech-check.mjs",
      "scripts/check-config-consistency.js",
      "scripts/i18n-shape-check.js",
      "scripts/translation-sync.js",
      "scripts/lib/guardrail-report.js",
      "scripts/cloudflare/legacy-entrypoint-guard.mjs",
      "scripts/review-clusters.js",
      "scripts/structural-cluster-registry.js",
      "scripts/tier-a-impact.js",
      "scripts/lib/runtime-env.js",
      "scripts/mdx-slug-sync.js",
      "scripts/copy-translations.js",
      "scripts/review-derivative-readiness.js",
      "scripts/translation-split-utils.js",
      "scripts/static-truth-check.js",
      "scripts/clean-next-build-artifacts.mjs",
      "scripts/cloudflare/patch-prefetch-hints-manifest.mjs",
      "scripts/cloudflare/jsonc-utils.mjs",
      "scripts/cloudflare/load-local-env.mjs",
      "scripts/cloudflare/sync-server-actions-key.mjs",
      "scripts/cloudflare/shims/empty-module.mjs",
      "scripts/cloudflare/deploy.mjs",
      "scripts/cloudflare/empty-module.mjs",
      "scripts/cloudflare/support.mjs",
      "scripts/cloudflare/check-official-compare.mjs",
      "scripts/cloudflare/preview-smoke.mjs",
      "scripts/cloudflare/proof-preview-deployed.mjs",
      "scripts/deploy/post-deploy-smoke.mjs",
      "scripts/release-proof.sh",
      "scripts/brand-check.mjs",
      "scripts/check-current-truth-docs.js",
      "scripts/component-governance-check.js",
      "scripts/check-eslint-disable-usage.js",
      "scripts/client-boundary-budget.mjs",
      "scripts/content-readiness-check.mjs",
      "scripts/content-slug-sync.js",
      "scripts/validate-translations.js",
      "scripts/generate-content-manifest.ts",
      "scripts/validate-production-config.ts",
    ]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test iterates over a fixed retired-script allowlist
      expect(fs.existsSync(path.join(REPO_ROOT, relativePath))).toBe(false);
    }
  });

  it("documents dirty-worktree targeted proof separately from clean-branch full proof", () => {
    const qualityProofLevels = readRepoFile(
      "docs/guides/QUALITY-PROOF-LEVELS.md",
    );
    const releaseProofRunbook = readRepoFile(
      "docs/guides/RELEASE-PROOF-RUNBOOK.md",
    );

    expect(qualityProofLevels).toContain("dirty worktree");
    expect(qualityProofLevels).toContain("targeted proof");
    expect(qualityProofLevels).toContain("clean branch");

    expect(releaseProofRunbook).toContain("dirty worktree");
    expect(releaseProofRunbook).toContain("targeted proof");
    expect(releaseProofRunbook).toContain("clean branch");
  });

  it("keeps the lead-family proof lane aligned with route-level replay coverage", () => {
    const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
    const releaseProofScript = readRepoFile("scripts/starter-checks.js");

    for (const testFile of LEAD_FAMILY_TEST_FILES) {
      expect(releaseProofScript).toContain(testFile);
      expect(ciWorkflow).toContain(testFile);
    }
    expect(JSON.parse(readRepoFile("package.json")).scripts).not.toHaveProperty(
      "test:lead-family",
    );
    expect(ciWorkflow).not.toContain("pnpm review:lead-family");
  });

  it("does not imply deployed GET smoke proves real lead submission", () => {
    const releaseProofScript = readRepoFile("scripts/starter-checks.js");
    const releaseProofRunbook = readRepoFile(
      "docs/guides/RELEASE-PROOF-RUNBOOK.md",
    );

    expect(releaseProofScript).toContain("tests/e2e/smoke/");
    expect(releaseProofScript).toContain("Airtable");
    expect(releaseProofScript).toContain("manual launch gate");
    expect(releaseProofRunbook).toContain("tests/e2e/smoke/");
    expect(releaseProofRunbook).toContain("manual launch gate");
  });

  it("keeps phase and mutation lanes out of the public package command surface", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const releaseProofScript = readRepoFile("scripts/starter-checks.js");
    const scriptNames = Object.keys(packageJson.scripts);

    expect(packageJson.scripts["website:build:cf"]).toBe(
      "pnpm exec opennextjs-cloudflare build --noMinify",
    );
    expect(packageJson.scripts["build:cf"]).toBeUndefined();
    expect(packageJson.scripts["deploy:cf"]).toBeUndefined();
    expect(packageJson.scripts["deploy:cf:dry-run"]).toBeUndefined();
    expect(packageJson.scripts["proof:cf:preview-deployed"]).toBeUndefined();

    expect(
      scriptNames.filter((name) => name.startsWith("test:mutation")),
    ).toEqual([]);
    expect(packageJson.scripts["review:mutation:critical"]).toBeUndefined();
    expect(scriptNames.filter((name) => name.includes(":phase"))).toEqual([]);
    expect(releaseProofScript).toContain(
      "pnpm exec wrangler deploy --dry-run --env preview",
    );
    expect(releaseProofScript).not.toContain("phase6");
    expect(releaseProofScript).not.toContain("build-webpack");
    expect(releaseProofScript).not.toContain("deploy-phase6");
    expect(releaseProofScript).not.toContain("deploy:cf:phase6");
  });

  it("keeps Vercel deployment artifacts out of the starter", () => {
    for (const relativePath of [
      "vercel.json",
      ".github/workflows/vercel-deploy.yml",
      "docs/impeccable/external/vercel-design-system/README.md",
    ]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test iterates over a fixed retired Vercel artifact allowlist
      expect(fs.existsSync(path.join(REPO_ROOT, relativePath))).toBe(false);
    }
  });

  it("removes non-starter security, visual, performance, bbox, and browser-diagnosis test artifacts", () => {
    for (const relativePath of RETIRED_NON_STARTER_TEST_FILES) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test checks a fixed retired proof-artifact allowlist
      expect(fs.existsSync(path.join(REPO_ROOT, relativePath))).toBe(false);
    }
    for (const relativeDir of RETIRED_NON_STARTER_TEST_DIRS) {
      expect(listRepoFiles(relativeDir)).toEqual([]);
    }

    // Starter governance and contact smoke are still active proof surfaces.
    expect(fs.existsSync(path.join(REPO_ROOT, "tests/architecture"))).toBe(
      true,
    );
    expect(
      fs.existsSync(
        path.join(REPO_ROOT, "tests/e2e/contact-form-smoke.spec.ts"),
      ),
    ).toBe(true);
  });

  it("keeps contact smoke scoped to the showcase starter site only", () => {
    const contactSmokeSpec = readRepoFile(
      "tests/e2e/contact-form-smoke.spec.ts",
    );

    expect(contactSmokeSpec).toContain("Showcase Website Starter");
    expect(contactSmokeSpec).not.toContain("showcase-equipment");
    expect(contactSmokeSpec).not.toContain("equipment.");
  });

  it("removes Playwright snapshot configuration when no E2E snapshot assertions remain", () => {
    const playwrightConfig = readRepoFile("playwright.config.ts");

    expect(playwrightConfig).not.toContain("toHaveScreenshot");
    expect(playwrightConfig).not.toContain("toMatchSnapshot");
    expect(playwrightConfig).not.toContain("snapshotDir");
    expect(playwrightConfig).not.toContain("snapshotPathTemplate");

    const e2eDir = path.join(REPO_ROOT, "tests/e2e");
    const e2eSpecFiles = fs
      .readdirSync(e2eDir, { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".spec.ts"))
      .map((entry) =>
        path.relative(REPO_ROOT, path.join(entry.parentPath, entry.name)),
      );

    for (const specFile of e2eSpecFiles) {
      const content = readRepoFile(specFile);
      expect(content).not.toContain("toHaveScreenshot");
      expect(content).not.toContain("toMatchSnapshot");
    }
  });

  it("does not keep hook commands for retired layout visual E2E specs", () => {
    const lefthookConfig = readRepoFile("lefthook.yml");

    expect(lefthookConfig).not.toContain("e2e-layout-check");
    expect(lefthookConfig).not.toContain("RUN_E2E_LAYOUT");
    expect(lefthookConfig).not.toContain("header-layout.bbox.spec.ts");
  });

  it("keeps active proof docs on starter smoke and component governance instead of retired derivative proof lanes", () => {
    const activeProofDocs = [
      readRepoFile("docs/specs/behavioral-contracts.md"),
      readRepoFile("docs/guides/PROOF-BOUNDARY-MAP.md"),
      readRepoFile("docs/guides/CANONICAL-TRUTH-REGISTRY.md"),
    ].join("\n");

    for (const activeMarker of [
      "tests/e2e/navigation.spec.ts",
      "tests/e2e/i18n.spec.ts",
      "tests/e2e/contact-form-smoke.spec.ts",
      "tests/e2e/smoke/",
      "tests/architecture/component-governance.test.ts",
      "pnpm component:check",
    ]) {
      expect(activeProofDocs).toContain(activeMarker);
    }

    for (const retiredMarker of RETIRED_ACTIVE_PROOF_MARKERS) {
      expect(activeProofDocs).not.toContain(retiredMarker);
    }
  });

  it("keeps starter readiness proof commands available after grouped guardrail runner removal", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
    const groupedRunnerExists = fs.existsSync(
      path.join(REPO_ROOT, "scripts/run-all-guardrails-review.js"),
    );

    expect(packageJson.scripts["brand:check"]).toBe(
      "node scripts/starter-checks.js brand",
    );
    expect(packageJson.scripts["content:check"]).toBe(
      "node scripts/starter-checks.js content-manifest --check && node scripts/starter-checks.js content-slugs && node scripts/starter-checks.js translations",
    );
    expect(packageJson.scripts["component:check"]).toBe(
      "pnpm component:governance:test && pnpm component:governance && pnpm exec storybook build",
    );
    expect(packageJson.scripts["component:governance"]).toBe(
      "node scripts/starter-checks.js component-governance",
    );
    expect(packageJson.scripts["website:check"]).toBe(
      "pnpm type-check && pnpm lint:check && pnpm test && pnpm build",
    );
    expect(packageJson.scripts["website:build:cf"]).toBe(
      "pnpm exec opennextjs-cloudflare build --noMinify",
    );
    expect(packageJson.scripts["website:content:readiness"]).toBeUndefined();
    expect(
      packageJson.scripts["website:review:client-boundary"],
    ).toBeUndefined();
    expect(groupedRunnerExists).toBe(false);
    expect(ciWorkflow).toContain("pnpm brand:check");
    expect(ciWorkflow).toContain("pnpm content:check");
    expect(ciWorkflow).toContain(
      "node scripts/starter-checks.js client-boundary",
    );
    expect(ciWorkflow).toContain("pnpm website:build:cf");
  });

  it("does not overclaim local contact smoke as real submission proof", () => {
    const contactSmokeSpec = readRepoFile(
      "tests/e2e/contact-form-smoke.spec.ts",
    );
    const playwrightConfig = readRepoFile("playwright.config.ts");

    expect(contactSmokeSpec).not.toContain("应该能够成功提交表单");
    expect(contactSmokeSpec).toContain("完整填写后提交入口可见");
    expect(contactSmokeSpec).toContain("Local smoke");
    expect(contactSmokeSpec).toContain(
      "does not submit to the deployed lead pipeline",
    );

    expect(playwrightConfig).toContain("NEXT_PUBLIC_TEST_MODE");
    expect(playwrightConfig).toContain("Local E2E proof boundary");
    expect(playwrightConfig).toContain(
      "not real Turnstile or deployed lead proof",
    );
  });

  it("labels lead-family contract proof as auxiliary rather than full-chain proof", () => {
    const contractSpec = readRepoFile(
      "tests/integration/api/lead-family-contract.test.ts",
    );
    const ciWorkflow = readRepoFile(".github/workflows/ci.yml");
    const structuralClusters = readRepoFile(
      "docs/guides/STRUCTURAL-CHANGE-CLUSTERS.md",
    );
    const normalizedContractSpec = contractSpec.replace(/\s+/gu, " ");

    expect(contractSpec).toContain("Auxiliary response contract checks only.");
    expect(normalizedContractSpec).toContain(
      "not full lead-chain protection proof",
    );
    expect(ciWorkflow).toContain("Lead API family proof");
    expect(ciWorkflow).not.toContain("Lead API Family Contract Review");
    expect(structuralClusters).toContain("auxiliary contract proof");
    expect(structuralClusters).toContain("route-level protection proof");
  });

  it("keeps BC-024 duplicate-submission contract aligned with starter defaults", () => {
    const behavioralContracts = readRepoFile(
      "docs/specs/behavioral-contracts.md",
    );

    expect(behavioralContracts).toContain("do not require a replay key");
    expect(behavioralContracts).not.toContain("`Idempotency-Key`");
    expect(behavioralContracts).toContain(
      "Duplicated leads are acceptable starter behavior; dropped leads are not",
    );
    expect(behavioralContracts).toContain("Status | Covered");
    expect(behavioralContracts).not.toContain(
      "Route-level idempotency is covered for contact, inquiry, and subscribe",
    );
    expect(behavioralContracts).not.toContain("compatibility-only");
    expect(behavioralContracts).toContain(
      "Contact Server Action compatibility now follows the same no-key",
    );
  });

  it("documents all client-launch catalog, identity, SEO, and legal replacement surfaces", () => {
    const brandSettings = readRepoFile("docs/website/品牌设置.md");
    const replacementChecklist = readRepoFile("docs/website/新项目替换清单.md");
    const qualityProof = readRepoFile("docs/website/quality-proof.md");

    for (const expectedSurface of [
      "src/config/single-site.ts",
      "src/config/single-site-seo.ts",
      "src/config/single-site-navigation.ts",
      "src/config/single-site-links.ts",
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-product-catalog.ts",
      "src/constants/product-specs/**",
      "messages/{locale}/critical.json",
      "messages/{locale}/deferred.json",
      "public/images/**",
      "content/pages/{locale}/about.mdx",
      "content/pages/{locale}/contact.mdx",
      "content/pages/{locale}/privacy.mdx",
      "content/pages/{locale}/terms.mdx",
    ]) {
      expect(replacementChecklist).toContain(expectedSurface);
    }

    expect(brandSettings).toContain("src/config/single-site.ts");
    expect(brandSettings).toContain("src/config/single-site-seo.ts");
    expect(brandSettings).toContain("src/config/single-site-navigation.ts");
    expect(brandSettings).toContain("src/config/single-site-links.ts");
    expect(brandSettings).toContain(
      "src/config/single-site-page-expression.ts",
    );
    expect(brandSettings).not.toContain("品牌信息集中在 `src/config/website/`");
    expect(brandSettings).not.toContain("src/config/website");
    expect(brandSettings).not.toContain("镜像层");

    expect(replacementChecklist).toContain("公开上线");
    expect(replacementChecklist).toContain("临时示例");
    expect(replacementChecklist).toContain("SEO");
    expect(replacementChecklist).toContain("法务");
    expect(qualityProof).toContain("src/config/single-site.ts");
    expect(qualityProof).toContain("src/config/single-site-seo.ts");
    expect(qualityProof).toContain("src/config/single-site-navigation.ts");
    expect(qualityProof).toContain("src/config/single-site-links.ts");
    expect(qualityProof).toContain("src/config/single-site-page-expression.ts");
    expect(qualityProof).toContain("src/config/single-site-product-catalog.ts");
    expect(qualityProof).toContain("src/constants/product-specs/**");
    expect(qualityProof).toContain("catalog truth");
    expect(qualityProof).toContain("crawl / indexing truth");
    expect(qualityProof).toContain("canonical authoring source");
    expect(qualityProof).toContain("临时示例可以存在于受控开发阶段");
    expect(qualityProof).not.toContain("src/config/website");
    expect(qualityProof).toContain(
      "PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config",
    );
  });

  it("keeps ai-smell repo profile pointed at current critical surfaces", () => {
    const codexRepoProfile = readRepoFile(
      ".codex/skills/ai-smell-audit/references/repo-profile.md",
    );
    const claudeRepoProfile = readRepoFile(
      ".claude/skills/ai-smell-audit/references/repo-profile.md",
    );

    expect(claudeRepoProfile).toBe(codexRepoProfile);

    for (const repoProfile of [codexRepoProfile, claudeRepoProfile]) {
      expect(repoProfile).toContain("src/app/api/contact/**");
      expect(repoProfile).toContain("src/lib/actions/contact.ts");
      expect(repoProfile).toContain("src/app/api/inquiry/route.ts");
      expect(repoProfile).toContain("src/app/api/subscribe/route.ts");
      expect(repoProfile).toContain("src/app/api/verify-turnstile/**");
      expect(repoProfile).toContain("src/lib/security/turnstile.ts");
      expect(repoProfile).toContain(
        "src/lib/lead-pipeline/{lead-schema,process-lead,utils}.ts",
      );
      expect(repoProfile).toContain(
        "src/config/single-site-product-catalog.ts",
      );
      expect(repoProfile).toContain("src/config/single-site-seo.ts");
      expect(repoProfile).toContain("src/config/single-site-navigation.ts");
      expect(repoProfile).toContain("src/config/single-site-links.ts");
      expect(repoProfile).toContain(
        "src/config/single-site-page-expression.ts",
      );
      expect(repoProfile).toContain("src/constants/product-specs/**");
      expect(repoProfile).toContain("tests/e2e/contact-form-smoke.spec.ts");
      expect(repoProfile).toContain("tests/e2e/smoke/post-deploy-form.spec.ts");
      expect(repoProfile).toContain("playwright.config.ts");
      expect(repoProfile).toContain("docs/website/quality-proof.md");
      expect(repoProfile).not.toContain("src/app/actions.ts");
      expect(repoProfile).not.toContain(
        "src/components/products/product-inquiry-form",
      );
      expect(repoProfile).not.toContain("src/config/website/**");
      expect(repoProfile).not.toContain("src/lib/load-messages*");
      expect(repoProfile).not.toContain("src/lib/turnstile.ts");
      expect(repoProfile).not.toContain("src/lib/idempotency/**");
    }
  });
});
