import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo fixture files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("ai-smell closure contract", () => {
  it("records closure for every 2026-05-03 ai-smell finding", () => {
    const closure = readRepoFile(
      "docs/audits/ai-smell-remediation-20260503.md",
    );

    for (const findingId of [
      "F-S21-001",
      "F-S21-002",
      "F-S28-001",
      "F-S23-001",
      "F-S25-001",
      "F-S27-001",
      "F-S31-001",
      "F-S32-001",
      "F-S30-001",
    ]) {
      expect(closure).toContain(findingId);
    }

    expect(closure).toContain("Public Demo Starter Site is out of scope");
    expect(closure).toContain("docs/audits/audit-report-20260503.md");
    expect(
      fs.existsSync(path.join(REPO_ROOT, "audit-report-20260503.md")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(REPO_ROOT, "audit-owner-summary-20260503.md")),
    ).toBe(false);
    expect(closure).toContain("Fresh verification");
    expect(closure).toContain(
      "| Finding | Changed files | Closure method | Verification | Remaining boundary |",
    );
    expect(closure).toContain(
      "PUBLIC_LAUNCH_STRICT=true node scripts/starter-checks.js validate-production-config",
    );
    expect(closure).toContain("scripts/starter-checks.js");
    expect(closure).toContain("tests/e2e/contact-form-smoke.spec.ts");
    expect(closure).toContain("playwright.config.ts");
  });
});
