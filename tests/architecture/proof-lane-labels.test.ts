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
    const qualityProof = readFileSync("docs/项目基础/上线验证.md", "utf8");

    for (const lane of REQUIRED_PROOF_LANES) {
      expect(qualityProof).toContain(lane);
    }
  });

  it("documents profile-scoped proof lanes", () => {
    const starterProof = [
      readFileSync("docs/项目基础/派生干跑验证.md", "utf8"),
      readFileSync("docs/项目基础/生命周期.md", "utf8"),
      readFileSync("docs/项目基础/派生配置.md", "utf8"),
    ].join("\n");

    for (const profile of RETAINED_STARTER_PROFILES) {
      expect(starterProof).toContain(profile);
    }

    expect(starterProof).toContain("Lifecycle: `starter-only`.");
  });

  it("separates current Tucsenberg proof from starter profile proof", () => {
    const qualityProof = readFileSync("docs/项目基础/上线验证.md", "utf8");

    expect(qualityProof).toContain("## Tucsenberg local proof");
    expect(qualityProof).toContain(
      "Inherited starter/profile proof lanes are not Tucsenberg launch proof.",
    );
    expect(qualityProof).not.toContain("Default `company-site` first-pass");
    expect(qualityProof).not.toContain("Profile proof lanes:");
  });

  it("keeps profile-scoped content-readiness commands out of launch proof", () => {
    const qualityProof = readFileSync("docs/项目基础/上线验证.md", "utf8");

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
    const proofLevels = readFileSync("docs/项目基础/验证等级.md", "utf8");

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
    const proofReadme = readFileSync("docs/技术难题/验证入口.md", "utf8");
    const performanceReadme = readFileSync("docs/技术难题/性能记录.md", "utf8");

    expect(proofReadme).toContain("性能记录.md");
    expect(performanceReadme).toContain("不是当前 Tucsenberg 上线证明");

    const historicalDocs = [
      readFileSync("docs/技术难题/Lighthouse共享负载.md", "utf8"),
      readFileSync("docs/技术难题/Lighthouse产品详情负载.md", "utf8"),
      readFileSync("docs/技术难题/Lighthouse预取策略.md", "utf8"),
      readFileSync("docs/技术难题/Next16行为审计.md", "utf8"),
    ];

    for (const doc of historicalDocs) {
      expect(doc).toContain("Historical starter proof");
      expect(doc).toContain("not current Tucsenberg launch proof");
      expect(doc).toContain("tests/e2e/navigation.spec.ts");
    }
  });

  it("keeps inherited workflow docs out of current docs truth", () => {
    const docsReadme = readFileSync("docs/README.md", "utf8");
    const useReadme = readFileSync("docs/项目基础/维护入口.md", "utf8");

    expect(docsReadme).toContain("docs/superpowers/specs/**");
    expect(docsReadme).toContain("docs/superpowers/plans/**");
    expect(useReadme).toContain("旧 starter workflow 说明已经移出 `docs/`");
    expect(useReadme).not.toContain("project-workflow.md");
    expect(useReadme).not.toContain("website-production-workflow.md");
  });
});
