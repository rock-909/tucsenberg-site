const RELEASE_PROOF_LANES = Object.freeze({
  LOCAL_TEST_MODE: "local/test-mode",
  DEPLOYED_SMOKE: "deployed-smoke",
  REAL_SERVICE_CANARY: "real-service-canary",
});

const INCLUDE_IN_RELEASE_SEQUENCE_DOCS = Object.freeze({
  includeInReleaseSequence: true,
});

const RELEASE_PROOF_MANIFEST = deepFreeze({
  version: 1,
  steps: [
    {
      id: "truth-docs",
      label: "Current truth docs",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "node",
      args: ["scripts/starter-checks.js", "truth-docs"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "content-manifest-freshness",
      label: "Generated content manifest freshness",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "node",
      args: ["scripts/starter-checks.js", "content-manifest", "--check"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "cloudflare-official-source-compare",
      label: "Cloudflare official source compare",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "node",
      args: [
        "scripts/starter-checks.js",
        "cf-official-compare",
        "--source-only",
      ],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "type-check",
      label: "TypeScript type check",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: ["type-check"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "lint-check",
      label: "ESLint quality check",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: ["lint:check"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "middleware-i18n-unit-tests",
      label: "Middleware and i18n unit tests",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: [
        "exec",
        "vitest",
        "run",
        "tests/unit/middleware.test.ts",
        "src/__tests__/middleware-locale-cookie.test.ts",
        "src/i18n/__tests__/request.test.ts",
        "src/lib/__tests__/load-messages.fallback.test.ts",
      ],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "lead-family-api-tests",
      label: "Lead family API tests",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: [
        "exec",
        "vitest",
        "run",
        "tests/integration/api/lead-family-contract.test.ts",
        "tests/integration/api/lead-family-protection.test.ts",
        "src/app/api/inquiry/__tests__/route.test.ts",
        "tests/integration/api/subscribe.test.ts",
      ],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "health-api-tests",
      label: "Health API tests",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: [
        "exec",
        "vitest",
        "run",
        "tests/integration/api/health.test.ts",
        "src/__tests__/middleware-locale-cookie.test.ts",
      ],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "translations",
      label: "Translation packs",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "node",
      args: ["scripts/starter-checks.js", "translations"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "content-readiness-company-site",
      label: "Company-site content readiness",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "node",
      args: [
        "scripts/starter-checks.js",
        "content-readiness",
        "--profile",
        "company-site",
      ],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "next-build",
      label: "Next.js build",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: ["build"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "cloudflare-build",
      label: "Cloudflare build",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: ["website:build:cf"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "cloudflare-static-asset-headers",
      label: "Cloudflare Static Assets headers",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "node",
      args: ["scripts/starter-checks.js", "cf-static-asset-headers"],
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "wrangler-preview-dry-run",
      label: "Wrangler preview dry run",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: ["exec", "wrangler", "deploy", "--dry-run", "--env", "preview"],
      artifactBudget: {
        metric: "gzip KiB",
        limitKiB: 3000,
        preferredKiB: 2700,
        measuredArtifact: "source-checkout",
        source: "Cloudflare Workers Free gzip upload limit",
      },
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
    {
      id: "local-playwright-smoke",
      label: "Local Playwright E2E smoke",
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      command: "pnpm",
      args: [
        "exec",
        "playwright",
        "test",
        "tests/e2e/tucsenberg-site-smoke.spec.ts",
        "tests/e2e/contact-form-smoke.spec.ts",
        "--project=chromium",
      ],
      env: {
        CI: "1",
      },
      requiresFreePort: 3000,
      docs: INCLUDE_IN_RELEASE_SEQUENCE_DOCS,
    },
  ],
  manualProofLanes: [
    {
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      label: "Local stock preview",
      command: "node scripts/starter-checks.js cf-preview-smoke",
    },
    {
      lane: RELEASE_PROOF_LANES.LOCAL_TEST_MODE,
      label: "Local Cloudflare deploy-artifact dry run",
      command: "pnpm exec wrangler deploy --dry-run --env preview",
    },
    {
      lane: RELEASE_PROOF_LANES.DEPLOYED_SMOKE,
      label: "Real preview publish path",
      command: "node scripts/starter-checks.js cf-preview-deployed",
    },
    {
      lane: RELEASE_PROOF_LANES.DEPLOYED_SMOKE,
      label: "Deployed GET smoke",
      command:
        'node scripts/starter-checks.js deployed-smoke --base-url "$DEPLOYED_BASE_URL"',
    },
    {
      lane: RELEASE_PROOF_LANES.REAL_SERVICE_CANARY,
      label: "Real deployed lead canary manual launch gate",
      command:
        'POST_DEPLOY_TEST=1 PLAYWRIGHT_BASE_URL="$DEPLOYED_BASE_URL" pnpm exec playwright test tests/e2e/smoke/',
    },
  ],
});

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  for (const propertyValue of Object.values(value)) {
    deepFreeze(propertyValue);
  }

  return Object.freeze(value);
}

function cloneStep(step) {
  return {
    ...step,
    args: [...step.args],
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.docs ? { docs: { ...step.docs } } : {}),
    ...(step.artifactBudget
      ? { artifactBudget: { ...step.artifactBudget } }
      : {}),
  };
}

function cloneReleaseVerifyCommand(step) {
  return {
    id: step.id,
    command: step.command,
    args: [...step.args],
    ...(step.env ? { env: { ...step.env } } : {}),
    ...(step.artifactBudget
      ? { artifactBudget: { ...step.artifactBudget } }
      : {}),
  };
}

function formatReleaseProofCommand(step) {
  const envPrefix = step.env
    ? `${Object.entries(step.env)
        .map(([name, value]) => `${name}=${value}`)
        .join(" ")} `
    : "";

  return `${envPrefix}${step.command} ${step.args.join(" ")}`;
}

function getReleaseProofSteps() {
  return RELEASE_PROOF_MANIFEST.steps.map(cloneStep);
}

function getReleaseProofSequence() {
  return getReleaseProofSteps()
    .filter((step) => step.docs.includeInReleaseSequence)
    .map(formatReleaseProofCommand);
}

function getReleaseVerifyCommands() {
  return RELEASE_PROOF_MANIFEST.steps.map(cloneReleaseVerifyCommand);
}

function getReleaseProofDocsCommandBlock() {
  return getReleaseProofSequence().join("\n");
}

function getManualProofLaneSummaryLines() {
  return RELEASE_PROOF_MANIFEST.manualProofLanes.map(
    (entry) => `  - [${entry.lane}] ${entry.label}: ${entry.command}`,
  );
}

module.exports = {
  RELEASE_PROOF_LANES,
  RELEASE_PROOF_MANIFEST,
  formatReleaseProofCommand,
  getManualProofLaneSummaryLines,
  getReleaseProofDocsCommandBlock,
  getReleaseProofSequence,
  getReleaseProofSteps,
  getReleaseVerifyCommands,
};
