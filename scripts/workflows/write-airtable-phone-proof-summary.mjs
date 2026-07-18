import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SUMMARY_PATH = process.env.GITHUB_STEP_SUMMARY;
const REF = process.env.PROOF_SUMMARY_REF ?? "";
const SHA = process.env.PROOF_SUMMARY_SHA ?? "";
const TABLE = process.env.PROOF_SUMMARY_TABLE ?? "";
const OUTCOME = process.env.PROOF_OUTCOME ?? "";

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function rejectCrLf(value, label) {
  if (/[\r\n]/.test(value)) {
    throw new Error(`${label} must not contain CR or LF characters`);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function deriveResult(outcome) {
  return outcome === "success" ? "pass" : "fail";
}

function buildSummary({ ref, sha, table, result }) {
  const code = (value) => `<code>${escapeHtml(value)}</code>`;
  const resultLabel = result === "pass" ? "**pass**" : "**fail**";

  return [
    "## Airtable phone proof",
    "",
    `- **Ref**: ${code(ref)}`,
    `- **SHA**: ${code(sha)}`,
    `- **Table**: ${code(table)}`,
    `- **Result**: ${resultLabel}`,
    "",
  ].join("\n");
}

function main() {
  if (!SUMMARY_PATH) {
    fail("GITHUB_STEP_SUMMARY is required");
  }

  for (const [label, value] of [
    ["Ref", REF],
    ["SHA", SHA],
    ["Table", TABLE],
    ["Proof outcome", OUTCOME],
  ]) {
    if (value.length === 0) {
      fail(`${label} is required`);
    }
    try {
      rejectCrLf(value, label);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  }

  const result = deriveResult(OUTCOME);
  appendFileSync(SUMMARY_PATH, buildSummary({ ref: REF, sha: SHA, table: TABLE, result }));

  if (result === "fail") {
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { buildSummary, deriveResult, escapeHtml, rejectCrLf };
