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

describe("proof lane labels", () => {
  // The launch checklist is what a human follows while the release script
  // prints the lane labels. Renaming a lane in one place without the other
  // leaves the checklist pointing at output that no longer exists.
  it("keeps the shared proof lane vocabulary in docs and release output", () => {
    const launchProof = readFileSync("docs/项目基础/上线验证.md", "utf8");
    const releaseProofOutput = getManualProofLaneSummaryLines().join("\n");

    for (const lane of REQUIRED_PROOF_LANES) {
      expect(launchProof).toContain(lane);
      expect(releaseProofOutput).toContain(`[${lane}]`);
    }
  });

  it("limits default Playwright discovery to current Tucsenberg smoke proof", () => {
    const playwrightConfig = readFileSync("playwright.config.ts", "utf8");

    expect(playwrightConfig).toContain("hasExplicitE2eFileSelection");
    expect(playwrightConfig).toContain("testMatch: currentSiteTestMatch");
    for (const match of CURRENT_PLAYWRIGHT_DEFAULT_MATCHES) {
      expect(playwrightConfig).toContain(match);
    }
  });
});
