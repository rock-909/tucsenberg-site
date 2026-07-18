import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  buildSummary,
  deriveResult,
  escapeHtml,
  rejectCrLf,
} from "../../../scripts/workflows/write-airtable-phone-proof-summary.mjs";

const SCRIPT_PATH = "scripts/workflows/write-airtable-phone-proof-summary.mjs";

function runSummaryWriter(env: Record<string, string>): {
  status: number | null;
  summaryPath: string;
  summary: string;
} {
  const dir = mkdtempSync(join(tmpdir(), "airtable-proof-summary-"));
  const summaryPath = join(dir, "summary.md");

  const result = spawnSync("node", [SCRIPT_PATH], {
    env: {
      ...process.env,
      ...env,
      GITHUB_STEP_SUMMARY: summaryPath,
    },
    encoding: "utf8",
  });

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- summary path stays inside the test-owned temp directory
  const summary = existsSync(summaryPath)
    ? // eslint-disable-next-line security/detect-non-literal-fs-filename -- summary path stays inside the test-owned temp directory
      readFileSync(summaryPath, "utf8")
    : "";
  rmSync(dir, { recursive: true, force: true });

  return {
    status: result.status,
    summaryPath,
    summary,
  };
}

describe("write-airtable-phone-proof-summary", () => {
  it("derives result only from proof outcome", () => {
    expect(deriveResult("success")).toBe("pass");
    expect(deriveResult("failure")).toBe("fail");
    expect(deriveResult("cancelled")).toBe("fail");
  });

  it("HTML-escapes dynamic values inside code tags", () => {
    expect(escapeHtml("a&b<c>d")).toBe("a&amp;b&lt;c&gt;d");

    const summary = buildSummary({
      ref: "refs/heads/feature&x",
      sha: "abc<123>",
      table: "Contacts$(touch /tmp/pwned)",
      result: "pass",
    });

    expect(summary).toContain(
      "- **Ref**: <code>refs/heads/feature&amp;x</code>",
    );
    expect(summary).toContain("- **SHA**: <code>abc&lt;123&gt;</code>");
    expect(summary).toContain(
      "- **Table**: <code>Contacts$(touch /tmp/pwned)</code>",
    );
    expect(summary).not.toContain("| Field | Value |");
  });

  it("rejects CR/LF in dynamic values", () => {
    expect(() => rejectCrLf("line1\nline2", "Table")).toThrow();
    expect(() => rejectCrLf("line1\rline2", "Table")).toThrow();
  });

  it("reads ref, sha, table, and outcome from process.env and fails closed on proof failure", () => {
    const maliciousTable = "Contacts$(touch /tmp/pwned)";
    const pass = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/main",
      PROOF_SUMMARY_SHA: "deadbeef",
      PROOF_SUMMARY_TABLE: maliciousTable,
      PROOF_OUTCOME: "success",
    });

    expect(pass.status).toBe(0);
    expect(pass.summary).toContain(
      `- **Table**: <code>${maliciousTable}</code>`,
    );
    expect(pass.summary).toContain("- **Result**: **pass**");

    const fail = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/main",
      PROOF_SUMMARY_SHA: "deadbeef",
      PROOF_SUMMARY_TABLE: "Contacts`id`",
      PROOF_OUTCOME: "failure",
    });

    expect(fail.status).toBe(1);
    expect(fail.summary).toContain("- **Result**: **fail**");
    expect(fail.summary).not.toMatch(
      /record id|AIRTABLE_API_KEY|AIRTABLE_BASE_ID|api response/iu,
    );
  });

  it("rejects multiline summary injection via env values", () => {
    const injected = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/main",
      PROOF_SUMMARY_SHA: "deadbeef",
      PROOF_SUMMARY_TABLE: "Contacts\n| Injected | pwned |",
      PROOF_OUTCOME: "success",
    });

    expect(injected.status).toBe(1);
    expect(injected.summary).toBe("");
  });
});
