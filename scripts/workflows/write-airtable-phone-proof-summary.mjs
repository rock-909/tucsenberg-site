import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

/**
 * @param {object} options
 * @param {Record<string, string | undefined>} options.env
 * @param {(path: string, content: string) => void} options.appendWriter
 * @param {(message: string) => void} [options.reportError]
 * @returns {number}
 */
export function writeAirtablePhoneProofSummary({
  env,
  appendWriter,
  reportError = () => {},
}) {
  const summaryPath = env.GITHUB_STEP_SUMMARY ?? "";
  const ref = env.PROOF_SUMMARY_REF ?? "";
  const sha = env.PROOF_SUMMARY_SHA ?? "";
  const table = env.PROOF_SUMMARY_TABLE ?? "";
  const outcome = env.PROOF_OUTCOME ?? "";

  if (!summaryPath) {
    reportError("GITHUB_STEP_SUMMARY is required");
    return 1;
  }

  for (const [label, value] of [
    ["Ref", ref],
    ["SHA", sha],
    ["Table", table],
    ["Proof outcome", outcome],
  ]) {
    if (value.length === 0) {
      reportError(`${label} is required`);
      return 1;
    }
    try {
      rejectCrLf(value, label);
    } catch (error) {
      reportError(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  const result = deriveResult(outcome);
  appendWriter(
    summaryPath,
    buildSummary({ ref, sha, table, result }),
  );

  return result === "fail" ? 1 : 0;
}

function main() {
  const exitCode = writeAirtablePhoneProofSummary({
    env: process.env,
    appendWriter: appendFileSync,
    reportError: (message) => {
      console.error(`::error::${message}`);
    },
  });
  process.exitCode = exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
