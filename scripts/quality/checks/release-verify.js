const { spawnSync } = require("node:child_process");
const net = require("node:net");
const {
  RELEASE_PROOF_MANIFEST,
  formatReleaseProofCommand,
  getManualProofLaneSummaryLines,
  getReleaseProofDocsCommandBlock,
  getReleaseProofSequence,
  getReleaseVerifyCommands,
} = require("../release-proof-manifest");

const RELEASE_E2E_PORT = 3000;
const LOCAL_E2E_HOSTS = ["127.0.0.1", "::1"];

const RELEASE_PROOF_SEQUENCE = getReleaseProofSequence();
const RELEASE_VERIFY_COMMANDS = getReleaseVerifyCommands();

function isReleaseVerifyBlockedEnv(name) {
  const value = process.env[name] ?? "";
  return value === "true" || value === "1";
}

function formatReleaseCommand(step) {
  return formatReleaseProofCommand(step);
}

function runReleaseVerifyCommand(step, rootDir) {
  const result = spawnSync(step.command, step.args, {
    cwd: rootDir,
    stdio: step.artifactBudget ? "pipe" : "inherit",
    encoding: step.artifactBudget ? "utf8" : undefined,
    env: {
      ...process.env,
      ...(step.env ?? {}),
    },
  });

  if (step.artifactBudget) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");

    const status = result.status ?? 1;
    if (status !== 0) return status;

    return validateArtifactBudget(step.artifactBudget, output);
  }

  return result.status ?? 1;
}

function isPlaywrightReleaseStep(step) {
  return (
    step.command === "pnpm" &&
    step.args.includes("playwright") &&
    step.args.includes("test")
  );
}

function parseWranglerDryRunGzipKiB(output) {
  const match = output.match(/gzip:\s*(\d+(?:\.\d+)?)\s*KiB/iu);
  if (!match?.[1]) return null;

  return Number.parseFloat(match[1]);
}

function validateArtifactBudget(artifactBudget, output) {
  const measuredKiB = parseWranglerDryRunGzipKiB(output);

  if (measuredKiB === null) {
    console.error(
      "Cloudflare artifact budget check failed: missing gzip size.",
    );
    return 1;
  }

  if (measuredKiB > artifactBudget.limitKiB) {
    console.error(
      `Cloudflare artifact budget exceeded: ${measuredKiB.toFixed(2)} KiB gzip > ${artifactBudget.limitKiB} KiB.`,
    );
    return 1;
  }

  if (measuredKiB > artifactBudget.preferredKiB) {
    console.warn(
      `Cloudflare artifact budget warning: ${measuredKiB.toFixed(2)} KiB gzip is above preferred ${artifactBudget.preferredKiB} KiB headroom.`,
    );
  }

  return 0;
}

async function isLocalPortInUse(
  port = RELEASE_E2E_PORT,
  hosts = LOCAL_E2E_HOSTS,
) {
  const results = await Promise.all(
    hosts.map(
      (host) =>
        new Promise((resolve) => {
          const socket = net.createConnection({ host, port });

          socket.setTimeout(1000);
          socket.once("connect", () => {
            socket.destroy();
            resolve(true);
          });
          socket.once("timeout", () => {
            socket.destroy();
            resolve(false);
          });
          socket.once("error", () => {
            socket.destroy();
            resolve(false);
          });
        }),
    ),
  );

  return results.some(Boolean);
}

async function runReleaseVerify({
  rootDir = process.cwd(),
  runCommand = runReleaseVerifyCommand,
  portInUse = isLocalPortInUse,
} = {}) {
  if (isReleaseVerifyBlockedEnv("VALIDATE_CONFIG_SKIP_RUNTIME")) {
    console.error(
      "release-proof must not run with VALIDATE_CONFIG_SKIP_RUNTIME enabled",
    );
    return 1;
  }

  if (isReleaseVerifyBlockedEnv("ALLOW_MEMORY_RATE_LIMIT")) {
    console.error(
      "release-proof must not run with ALLOW_MEMORY_RATE_LIMIT enabled",
    );
    return 1;
  }

  console.log("== Release verification flow ==");
  for (const step of RELEASE_VERIFY_COMMANDS) {
    if (isPlaywrightReleaseStep(step)) {
      const blocked = await portInUse(RELEASE_E2E_PORT);
      if (blocked) {
        console.error(
          "release-proof cannot start local E2E because localhost:3000 is already in use.",
        );
        console.error(
          "Stop the existing local server and rerun pnpm release:verify.",
        );
        return 1;
      }
    }

    const result = runCommand(step, rootDir);
    const status =
      typeof result === "number"
        ? result
        : (result.status ?? 1) === 0 && step.artifactBudget
          ? validateArtifactBudget(
              step.artifactBudget,
              `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
            )
          : (result.status ?? 1);
    if (status !== 0) return status;
  }

  console.log("Cloudflare proof split:");
  for (const line of getManualProofLaneSummaryLines()) {
    console.log(line);
  }
  console.log(
    "  - The lead canary requires deployed Airtable/Resend/Turnstile credentials and must be recorded before broad public launch.",
  );
  console.log(
    "Local release proof completed. This is NOT public launch proof.",
  );
  console.log(
    "Public launch still requires strict config, deployed smoke, real lead canary, and owner signoff.",
  );
  return 0;
}

module.exports = {
  LOCAL_E2E_HOSTS,
  RELEASE_E2E_PORT,
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  formatReleaseCommand,
  getReleaseProofDocsCommandBlock,
  isLocalPortInUse,
  isPlaywrightReleaseStep,
  isReleaseVerifyBlockedEnv,
  parseWranglerDryRunGzipKiB,
  runReleaseVerify,
  runReleaseVerifyCommand,
  validateArtifactBudget,
};
