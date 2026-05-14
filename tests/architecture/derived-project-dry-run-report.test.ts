import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("derived project dry-run report", () => {
  it("records the latest dry-run findings and next repair targets", () => {
    const reportPath = "docs/website/derived-project-dry-run.md";
    expect(existsSync(reportPath)).toBe(true);

    const report = readFileSync(reportPath, "utf8");

    expect(report).toContain("Aster Conveyor Systems");
    expect(report).toContain("DRY-01");
    expect(report).toContain("DRY-02");
    expect(report).toContain("DRY-03");
    expect(report).toContain("DRY-04");
    expect(report).toContain("DRY-05");
    expect(report).toContain("Showcase Website Starter");
    expect(report).toContain("content-readiness");
    expect(report).toContain("PUBLIC_LAUNCH_STRICT=true APP_ENV=preview");
    expect(report).toContain(".example");
    expect(report).toContain("555");
    expect(report).toContain(
      "tests/architecture/product-market-slug-contract.test.ts",
    );
    expect(report).toContain("Status: completed in the follow-up repair pass");
    expect(report).toContain("content-readiness --strict-client-launch");
  });
});
