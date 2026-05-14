import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const REQUIRED_PROOF_LANES = [
  "local/test-mode",
  "deployed-smoke",
  "real-service-canary",
] as const;

describe("proof lane labels", () => {
  it("documents the shared proof lane vocabulary", () => {
    const qualityProof = readFileSync("docs/website/quality-proof.md", "utf8");

    for (const lane of REQUIRED_PROOF_LANES) {
      expect(qualityProof).toContain(lane);
    }
  });

  it("labels release proof output with the shared proof lane vocabulary", () => {
    const starterChecks = readFileSync("scripts/starter-checks.js", "utf8");

    for (const lane of REQUIRED_PROOF_LANES) {
      expect(starterChecks).toContain(`[${lane}]`);
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
