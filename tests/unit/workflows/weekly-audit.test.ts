import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/weekly-audit.yml", "utf8");

describe("weekly dependency audit workflow", () => {
  it("audits production dependencies every Monday and opens an issue on failure", () => {
    expect(workflow).toContain('cron: "0 9 * * 1"');
    expect(workflow).toContain("pnpm audit --prod --audit-level high");
    expect(workflow).toContain("issues: write");
    expect(workflow).toContain("actions/github-script@v8");
    expect(workflow).toContain("steps.audit.outcome == 'failure'");
    expect(workflow).toContain("exit 1");
  });
});
