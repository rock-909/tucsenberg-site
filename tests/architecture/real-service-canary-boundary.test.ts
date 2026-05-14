import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("real service canary boundary", () => {
  it("keeps the deployed lead canary gated by explicit deployed-mode environment", () => {
    const spec = readFileSync(
      "tests/e2e/smoke/post-deploy-form.spec.ts",
      "utf8",
    );

    for (const required of [
      "Proof lane: real-service-canary",
      "POST_DEPLOY_TEST",
      "STAGING_URL",
      "PLAYWRIGHT_BASE_URL",
      "AIRTABLE_API_KEY",
      "AIRTABLE_BASE_ID",
    ]) {
      expect(spec).toContain(required);
    }
  });

  it("documents that owner notification confirmation is not automatic in the Playwright canary", () => {
    const runbook = readFileSync(
      "docs/guides/RELEASE-PROOF-RUNBOOK.md",
      "utf8",
    );
    const qualityProof = readFileSync("docs/website/quality-proof.md", "utf8");

    for (const source of [runbook, qualityProof]) {
      expect(source).toContain("recordCreated");
      expect(source).toContain("ownerNotified");
      expect(source).toContain("owner notification");
    }

    expect(runbook).toContain(
      "The current Playwright canary verifies the Airtable record",
    );
    expect(runbook).toContain(
      "owner notification still needs manual target-system confirmation",
    );
  });
});
