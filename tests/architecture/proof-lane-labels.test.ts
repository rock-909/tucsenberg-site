import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getManualProofLaneSummaryLines } from "../../scripts/quality/release-proof-manifest.js";

const REQUIRED_PROOF_LANES = [
  "local/test-mode",
  "deployed-smoke",
  "real-service-canary",
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
  it("keeps the shared proof lane vocabulary in docs and release output", () => {
    const launchProof = readFileSync("docs/项目基础/上线验证.md", "utf8");
    const releaseProofOutput = getManualProofLaneSummaryLines().join("\n");

    for (const lane of REQUIRED_PROOF_LANES) {
      expect(launchProof).toContain(lane);
      expect(releaseProofOutput).toContain(`[${lane}]`);
    }
  });

  it("separates current Tucsenberg proof from inherited proof", () => {
    const launchProof = readFileSync("docs/项目基础/上线验证.md", "utf8");

    expect(launchProof).toContain("## Tucsenberg local proof");
    expect(launchProof).toContain(
      "Inherited starter/profile proof lanes are not Tucsenberg launch proof.",
    );
    expect(launchProof).not.toContain("Default `company-site` first-pass");
    expect(launchProof).not.toContain("Profile proof lanes:");
  });

  it("labels local and post-deploy E2E proof boundaries", () => {
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

  it("limits default Playwright discovery to current Tucsenberg smoke proof", () => {
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

  it("marks retired navigation proof docs as historical", () => {
    const proofReadme = readFileSync("docs/技术难题/验证入口.md", "utf8");
    const performanceReadme = readFileSync("docs/技术难题/性能记录.md", "utf8");

    expect(proofReadme).toContain("性能记录.md");
    expect(performanceReadme).toContain("不是当前 Tucsenberg 上线证明");

    for (const docPath of [
      "docs/技术难题/Lighthouse共享负载.md",
      "docs/技术难题/Lighthouse产品详情负载.md",
      "docs/技术难题/Lighthouse预取策略.md",
      "docs/技术难题/Next16行为审计.md",
    ]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths come from the fixed historical proof allowlist above
      const doc = readFileSync(docPath, "utf8");
      expect(doc).toContain("Historical starter proof");
      expect(doc).toContain("not current Tucsenberg launch proof");
      expect(doc).toContain("tests/e2e/navigation.spec.ts");
    }
  });

  it("keeps inherited workflow records outside current docs truth", () => {
    const docsReadme = readFileSync("docs/README.md", "utf8");
    const maintenanceEntry = readFileSync("docs/项目基础/维护入口.md", "utf8");

    expect(docsReadme).toContain("docs/superpowers/specs/**");
    expect(docsReadme).toContain("docs/superpowers/plans/**");
    expect(maintenanceEntry).toContain(
      "旧 starter workflow 说明已经移出 `docs/`",
    );
    expect(maintenanceEntry).not.toContain("project-workflow.md");
    expect(maintenanceEntry).not.toContain("website-production-workflow.md");
  });
});
