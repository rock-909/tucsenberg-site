import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  formatReleaseCommand,
} from "../../../scripts/starter-checks.js";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const VALID_RELEASE_LANES = new Set([
  "local/test-mode",
  "deployed-smoke",
  "real-service-canary",
]);

function readPackageScripts(): Record<string, string> {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };

  return packageJson.scripts ?? {};
}

function repoPathExists(relativePath: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed retired path allowlist
  return fs.existsSync(path.join(REPO_ROOT, relativePath));
}

function extractDirectPnpmScript(command: string): string | null {
  const parts = command.split(/\s+/u);
  if (parts[0] !== "pnpm") return null;
  if (parts[1] === "exec") return null;
  return parts[1] ?? null;
}

describe("release proof manifest contract", () => {
  it("keeps manifest steps uniquely identified and on known proof lanes", () => {
    const stepIds = RELEASE_PROOF_MANIFEST.steps.map((step) => step.id);

    expect(RELEASE_PROOF_MANIFEST.version).toBe(1);
    expect(RELEASE_PROOF_MANIFEST.steps.length).toBeGreaterThan(0);
    expect(new Set(stepIds).size).toBe(stepIds.length);

    for (const step of RELEASE_PROOF_MANIFEST.steps) {
      expect(step.id).toMatch(/^[a-z0-9-]+$/u);
      expect(VALID_RELEASE_LANES.has(step.lane), step.id).toBe(true);
      expect(step.docs?.includeInReleaseSequence, step.id).toBe(true);
      expect(step.command, step.id).toMatch(/^(node|pnpm)$/u);
      expect(step.args.length, step.id).toBeGreaterThan(0);
    }

    for (const lane of RELEASE_PROOF_MANIFEST.manualProofLanes) {
      expect(VALID_RELEASE_LANES.has(lane.lane), lane.label).toBe(true);
      expect(lane.command.length, lane.label).toBeGreaterThan(0);
    }
  });

  it("keeps release verify commands and docs sequence generated from the same manifest", () => {
    const releaseVerifyCommands =
      RELEASE_VERIFY_COMMANDS.map(formatReleaseCommand);

    expect(RELEASE_PROOF_SEQUENCE).toEqual(releaseVerifyCommands);
    expect(RELEASE_PROOF_SEQUENCE).toEqual([
      "node scripts/starter-checks.js truth-docs",
      "node scripts/starter-checks.js content-manifest --check",
      "node scripts/starter-checks.js cf-official-compare --source-only",
      "pnpm type-check",
      "pnpm lint:check",
      "pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts src/i18n/__tests__/request.test.ts src/lib/__tests__/load-messages.fallback.test.ts",
      "pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts",
      "pnpm exec vitest run tests/integration/api/health.test.ts src/__tests__/middleware-locale-cookie.test.ts",
      "node scripts/starter-checks.js translations",
      "node scripts/starter-checks.js content-readiness",
      "pnpm build",
      "pnpm website:build:cf",
      "node scripts/starter-checks.js cf-static-asset-headers",
      "pnpm exec wrangler deploy --dry-run --env preview",
      "CI=1 PLAYWRIGHT_REBUILD_SERVER=true pnpm exec playwright test tests/e2e/tucsenberg-site-smoke.spec.ts tests/e2e/contact-form-smoke.spec.ts --project=chromium",
    ]);
  });
});

describe("package proof command surface", () => {
  it("keeps release-facing package scripts wired to existing commands", () => {
    const scripts = readPackageScripts();

    expect(scripts["release:verify"]).toBe(
      "node scripts/starter-checks.js release-verify",
    );
    expect(scripts["brand:check"]).toBe("node scripts/starter-checks.js brand");
    expect(scripts["content:check"]).toBe(
      "node scripts/starter-checks.js content-manifest --check && node scripts/starter-checks.js content-slugs && node scripts/starter-checks.js translations && node scripts/starter-checks.js message-key-usage",
    );
    expect(scripts["component:check"]).toBe(
      "pnpm component:governance:test && pnpm component:governance && pnpm exec storybook build",
    );
    expect(scripts["website:check"]).toBe(
      "pnpm type-check && pnpm lint:check && pnpm test && pnpm build",
    );
    expect(scripts["website:build:cf"]).toBe(
      "pnpm exec opennextjs-cloudflare build",
    );
  });

  it("keeps direct pnpm commands in the release sequence backed by package scripts", () => {
    const scripts = readPackageScripts();

    for (const command of RELEASE_PROOF_SEQUENCE) {
      const scriptName = extractDirectPnpmScript(command);
      if (scriptName === null) continue;
      expect(scripts, command).toHaveProperty(scriptName);
    }
  });

  it("keeps phase and mutation lanes out of public package scripts and release proof", () => {
    const scripts = readPackageScripts();
    const scriptNames = Object.keys(scripts);
    const releaseProofFlow = RELEASE_PROOF_SEQUENCE.join("\n");

    expect(scripts["build:cf"]).toBeUndefined();
    expect(scripts["deploy:cf"]).toBeUndefined();
    expect(scripts["deploy:cf:dry-run"]).toBeUndefined();
    expect(scripts["proof:cf:preview-deployed"]).toBeUndefined();
    expect(scripts["review:mutation:critical"]).toBeUndefined();
    expect(
      scriptNames.filter((name) => name.startsWith("test:mutation")),
    ).toEqual([]);
    expect(scriptNames.filter((name) => name.includes(":phase"))).toEqual([]);
    expect(releaseProofFlow).not.toMatch(
      /phase6|deploy-phase6|deploy:cf:phase6/u,
    );
  });
});

describe("retired proof artifacts", () => {
  it("keeps retired script and proof artifact files absent", () => {
    const retiredPaths = [
      "scripts/release-proof.sh",
      "scripts/check-current-truth-docs.js",
      "scripts/review-derivative-readiness.js",
      "scripts/review-clusters.js",
      "scripts/cloudflare/deploy.mjs",
      "scripts/cloudflare/preview-smoke.mjs",
      "scripts/cloudflare/proof-preview-deployed.mjs",
      "tests/semgrep",
      "tests/e2e/__snapshots__",
      "tests/e2e/visual-regression.spec.ts",
      "tests/e2e/performance.spec.ts",
    ] as const;

    for (const relativePath of retiredPaths) {
      expect(repoPathExists(relativePath), relativePath).toBe(false);
    }
  });
});
