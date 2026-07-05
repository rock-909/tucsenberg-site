import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isDeployedCanaryUrl } from "../e2e/smoke/post-deploy-canary-url";

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
      "isDeployedCanaryUrl",
      "AIRTABLE_API_KEY",
      "AIRTABLE_BASE_ID",
    ]) {
      expect(spec).toContain(required);
    }
  });

  it("does not treat local URLs as real-service canary targets", () => {
    expect(isDeployedCanaryUrl(undefined)).toBe(false);
    expect(isDeployedCanaryUrl("not a url")).toBe(false);
    expect(isDeployedCanaryUrl("http://localhost:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://127.0.0.1:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://[::1]:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://0.0.0.0:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://10.0.0.5:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://172.16.0.5:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://172.31.0.5:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://192.168.1.10:3000")).toBe(false);
    expect(isDeployedCanaryUrl("http://starter.local:3000")).toBe(false);
    expect(isDeployedCanaryUrl("file:///tmp/showcase")).toBe(false);
    expect(isDeployedCanaryUrl("https://preview.example.com")).toBe(true);
  });

  it("documents POST_DEPLOY_TEST as required for the real-service canary", () => {
    const spec = readFileSync(
      "tests/e2e/smoke/post-deploy-form.spec.ts",
      "utf8",
    );

    expect(spec).toContain("POST_DEPLOY_TEST=1");
    expect(spec).toContain("STAGING_URL or PLAYWRIGHT_BASE_URL");
    expect(spec).toContain('process.env.POST_DEPLOY_TEST === "1"');
  });

  it("documents that owner notification confirmation is not automatic in the Playwright canary", () => {
    const runbook = readFileSync("docs/项目基础/发布验证.md", "utf8");
    const qualityProof = readFileSync("docs/项目基础/上线验证.md", "utf8");

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
