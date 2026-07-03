import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getManualProofLaneSummaryLines } from "../../scripts/quality/release-proof-manifest.js";

const REQUIRED_PROOF_LANES = [
  "local/test-mode",
  "deployed-smoke",
  "real-service-canary",
] as const;

const REQUIRED_PROFILE_PROOF_LANES = [
  "core-starter",
  "company-site",
  "b2b-lead",
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
    const qualityProof = readFileSync("docs/proof/launch.md", "utf8");

    for (const lane of REQUIRED_PROFILE_PROOF_LANES) {
      expect(qualityProof).toContain(lane);
    }

    expect(qualityProof).toContain(
      "`company-site` proof must not fail because `/products/north-america` is absent.",
    );
  });

  it("separates current full-repo proof from default company-site profile proof", () => {
    const qualityProof = readFileSync("docs/proof/launch.md", "utf8");

    expect(qualityProof).toMatch(
      /current full-repo|当前完整仓库|full-repo proof|完整仓库证明/,
    );
    expect(qualityProof).toMatch(
      /Default `company-site` first-pass|默认 `company-site` 首轮/,
    );
    expect(qualityProof).toContain("Profile proof lanes");
  });

  it("documents profile-scoped content-readiness commands in quality-proof.md", () => {
    const qualityProof = readFileSync("docs/proof/launch.md", "utf8");

    expect(qualityProof).toContain(
      "node scripts/starter-checks.js content-readiness --profile minimal",
    );
    expect(qualityProof).toContain(
      "node scripts/starter-checks.js content-readiness --profile company-site",
    );
    expect(qualityProof).toContain(
      "node scripts/starter-checks.js content-readiness --profile b2b-lead",
    );
    expect(qualityProof).toContain(
      "node scripts/starter-checks.js content-readiness --profile catalog",
    );
    expect(qualityProof).toContain(
      "node scripts/starter-checks.js content-readiness --profile content-marketing",
    );
    expect(qualityProof).toContain(
      "node scripts/starter-checks.js content-readiness --profile showcase-full",
    );
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
