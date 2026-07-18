import { describe, expect, it } from "vitest";
import { writeAirtablePhoneProofSummary } from "../../../scripts/workflows/write-airtable-phone-proof-summary.mjs";

function runSummaryWriter(env: Record<string, string>): {
  exitCode: number;
  summary: string;
} {
  let summary = "";
  const exitCode = writeAirtablePhoneProofSummary({
    env: {
      GITHUB_STEP_SUMMARY: "step-summary.md",
      ...env,
    },
    appendWriter: (_path, content) => {
      summary += content;
    },
  });

  return { exitCode, summary };
}

describe("write-airtable-phone-proof-summary", () => {
  it("HTML-escapes dynamic values inside code tags", () => {
    const maliciousTable = "Contacts$(touch /tmp/pwned)";
    const { exitCode, summary } = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/feature&x",
      PROOF_SUMMARY_SHA: "abc<123>",
      PROOF_SUMMARY_TABLE: maliciousTable,
      PROOF_OUTCOME: "success",
    });

    expect(exitCode).toBe(0);
    expect(summary).toContain(
      "- **Ref**: <code>refs/heads/feature&amp;x</code>",
    );
    expect(summary).toContain("- **SHA**: <code>abc&lt;123&gt;</code>");
    expect(summary).toContain(`- **Table**: <code>${maliciousTable}</code>`);
    expect(summary).not.toContain("| Field | Value |");
  });

  it("derives pass only from success outcome and fails closed otherwise", () => {
    const pass = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/main",
      PROOF_SUMMARY_SHA: "deadbeef",
      PROOF_SUMMARY_TABLE: "Contacts$(touch /tmp/pwned)",
      PROOF_OUTCOME: "success",
    });

    expect(pass.exitCode).toBe(0);
    expect(pass.summary).toContain("- **Result**: **pass**");

    const failure = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/main",
      PROOF_SUMMARY_SHA: "deadbeef",
      PROOF_SUMMARY_TABLE: "Contacts`id`",
      PROOF_OUTCOME: "failure",
    });

    expect(failure.exitCode).toBe(1);
    expect(failure.summary).toContain("- **Result**: **fail**");
    expect(failure.summary).not.toMatch(
      /record id|AIRTABLE_API_KEY|AIRTABLE_BASE_ID|api response/iu,
    );

    const cancelled = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/main",
      PROOF_SUMMARY_SHA: "deadbeef",
      PROOF_SUMMARY_TABLE: "Contacts",
      PROOF_OUTCOME: "cancelled",
    });

    expect(cancelled.exitCode).toBe(1);
    expect(cancelled.summary).toContain("- **Result**: **fail**");
  });

  it("rejects CR/LF in dynamic values", () => {
    const injected = runSummaryWriter({
      PROOF_SUMMARY_REF: "refs/heads/main",
      PROOF_SUMMARY_SHA: "deadbeef",
      PROOF_SUMMARY_TABLE: "Contacts\n| Injected | pwned |",
      PROOF_OUTCOME: "success",
    });

    expect(injected.exitCode).toBe(1);
    expect(injected.summary).toBe("");
  });
});
