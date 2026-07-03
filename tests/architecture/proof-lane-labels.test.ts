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
});
