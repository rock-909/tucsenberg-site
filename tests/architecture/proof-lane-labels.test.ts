import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getManualProofLaneSummaryLines } from "../../scripts/quality/release-proof-manifest.js";

const REQUIRED_PROOF_LANES = [
  "local/test-mode",
  "deployed-smoke",
  "real-service-canary",
] as const;

const RETAINED_STARTER_PROFILES = [
  "company-site",
  "b2b-lead",
  "minimal",
  "catalog",
  "content-marketing",
  "showcase-full",
] as const;

const CURRENT_PLAYWRIGHT_DEFAULT_MATCHES = [
  "**/tucsenberg-site-smoke.spec.ts",
  "**/contact-form-smoke.spec.ts",
  "**/no-js-html-contract.spec.ts",
  "**/smoke/**/*.spec.ts",
] as const;

const RETIRED_PLAYWRIGHT_DEFAULT_FILES = [
  "about-page-rendering.spec.ts",
  "basic-navigation.spec.ts",
  "button-runtime-token-pilot.spec.ts",
  "core-page-visual-calibration.spec.ts",
  "homepage.spec.ts",
  "i18n-redirect-validation.spec.ts",
  "i18n.spec.ts",
  "navigation.spec.ts",
  "safe-navigation.spec.ts",
  "seo-validation.spec.ts",
  "user-journeys.spec.ts",
] as const;

describe("proof lane labels", () => {
  it("documents the shared proof lane vocabulary", () => {
    const qualityProof = readFileSync("docs/proof/launch.md", "utf8");

    for (const lane of REQUIRED_PROOF_LANES) {
      expect(qualityProof).toContain(lane);
    }
  });

  it("documents profile-scoped proof lanes", () => {
    const starterProof = [
      readFileSync("docs/proof/dry-run.md", "utf8"),
      readFileSync("docs/ref/lifecycle.md", "utf8"),
      readFileSync("docs/ref/profiles.md", "utf8"),
    ].join("\n");

    for (const profile of RETAINED_STARTER_PROFILES) {
      expect(starterProof).toContain(profile);
    }

    expect(starterProof).toContain("Lifecycle: `starter-only`.");
  });

  it("separates current Tucsenberg proof from starter profile proof", () => {
    const qualityProof = readFileSync("docs/proof/launch.md", "utf8");

    expect(qualityProof).toContain("## Tucsenberg local proof");
    expect(qualityProof).toContain(
      "Inherited starter/profile proof lanes are not Tucsenberg launch proof.",
    );
    expect(qualityProof).not.toContain("Default `company-site` first-pass");
    expect(qualityProof).not.toContain("Profile proof lanes:");
  });

  it("keeps profile-scoped content-readiness commands out of launch proof", () => {
    const qualityProof = readFileSync("docs/proof/launch.md", "utf8");

    for (const lane of RETAINED_STARTER_PROFILES) {
      expect(qualityProof).not.toContain(
        `node scripts/starter-checks.js content-readiness --profile ${lane}`,
      );
    }
    expect(qualityProof).toContain("pnpm content:check");
  });

  it("labels release proof output with the shared proof lane vocabulary", () => {
    const releaseProofOutput = getManualProofLaneSummaryLines().join("\n");

    for (const lane of REQUIRED_PROOF_LANES) {
      expect(releaseProofOutput).toContain(`[${lane}]`);
    }
  });

  it("labels local and post-deploy Playwright proof boundaries", () => {
    const playwrightConfig = readFileSync("playwright.config.ts", "utf8");
    const localContactSmoke = readFileSync(
      "tests/e2e/contact-form-smoke.spec.ts",
      "utf8",
    );
    const postDeploySmoke = readFileSync(
      "tests/e2e/smoke/post-deploy-form.spec.ts",
      "utf8",
    );

    expect(playwrightConfig).toContain("local/test-mode");
    expect(localContactSmoke).toContain("Proof lane: local/test-mode");
    expect(postDeploySmoke).toContain("Proof lane: real-service-canary");
  });

  it("limits default Playwright discovery to current Tucsenberg proof", () => {
    const playwrightConfig = readFileSync("playwright.config.ts", "utf8");
    const proofLevels = readFileSync("docs/proof/levels.md", "utf8");

    expect(playwrightConfig).toContain("hasExplicitE2eFileSelection");
    expect(playwrightConfig).toContain("testMatch: currentSiteTestMatch");
    for (const match of CURRENT_PLAYWRIGHT_DEFAULT_MATCHES) {
      expect(playwrightConfig).toContain(match);
    }

    for (const file of RETIRED_PLAYWRIGHT_DEFAULT_FILES) {
      expect(playwrightConfig).not.toContain(file);
    }

    expect(proofLevels).toContain(
      "Default Playwright discovery is intentionally limited",
    );
  });

  it("marks retired navigation E2E proof docs as historical", () => {
    const proofReadme = readFileSync("docs/proof/README.md", "utf8");
    const performanceReadme = readFileSync(
      "docs/proof/performance/README.md",
      "utf8",
    );

    expect(proofReadme).toContain("performance/");
    expect(performanceReadme).toContain("不是当前 Tucsenberg 上线证明");

    const historicalDocs = [
      readFileSync(
        "docs/proof/performance/lighthouse-shared-payload.md",
        "utf8",
      ),
      readFileSync(
        "docs/proof/performance/lighthouse-product-detail-payload.md",
        "utf8",
      ),
      readFileSync(
        "docs/proof/performance/lighthouse-prefetch-policy.md",
        "utf8",
      ),
      readFileSync("docs/proof/next16-activity-state-audit.md", "utf8"),
    ];

    for (const doc of historicalDocs) {
      expect(doc).toContain("Historical starter proof");
      expect(doc).toContain("not current Tucsenberg launch proof");
      expect(doc).toContain("tests/e2e/navigation.spec.ts");
    }
  });

  it("labels inherited workflow docs outside current product truth", () => {
    const docsReadme = readFileSync("docs/README.md", "utf8");
    const useReadme = readFileSync("docs/use/README.md", "utf8");
    const workflowDocs = [
      readFileSync("docs/use/project-workflow.md", "utf8"),
      readFileSync("docs/use/website-production-workflow.md", "utf8"),
    ];

    expect(docsReadme).toContain("docs/use/project-workflow.md");
    expect(docsReadme).toContain("docs/use/website-production-workflow.md");
    expect(useReadme).toContain("project-workflow.md");
    expect(useReadme).toContain("website-production-workflow.md");

    for (const doc of workflowDocs) {
      expect(doc).toContain("Historical starter workflow");
      expect(doc).toContain("not current Tucsenberg product truth");
    }
  });
});
