import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  RELEASE_PROOF_MANIFEST,
  RELEASE_PROOF_SEQUENCE,
  RELEASE_VERIFY_COMMANDS,
  STARTER_CHECK_COMMANDS,
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
      "CI=1 PLAYWRIGHT_REBUILD_SERVER=true pnpm exec playwright test --project=chromium",
    ]);
  });
});

describe("package proof command surface", () => {
  // Freezing the exact command strings made a new flag look like a broken
  // wiring. Assert what the name claims instead: every check and every nested
  // pnpm script these entry points reach actually exists.
  // Composite entry points fan out to checks and other scripts; every target
  // has to resolve. `website:build:cf` is a leaf that shells straight out to
  // the OpenNext binary, so it only has to exist.
  const COMPOSITE_RELEASE_SCRIPTS = [
    "release:verify",
    "brand:check",
    "content:check",
    "component:check",
    "website:check",
  ] as const;
  const LEAF_RELEASE_SCRIPTS = ["website:build:cf"] as const;

  it("keeps release-facing package scripts wired to existing commands", () => {
    const scripts = readPackageScripts();
    const knownChecks = new Set(STARTER_CHECK_COMMANDS);

    for (const scriptName of LEAF_RELEASE_SCRIPTS) {
      expect(scripts[scriptName]?.trim(), scriptName).toBeTruthy();
    }

    for (const scriptName of COMPOSITE_RELEASE_SCRIPTS) {
      const command = scripts[scriptName];
      expect(
        command,
        `${scriptName} is missing from package.json`,
      ).toBeDefined();

      const referencedChecks = [
        ...command!.matchAll(/starter-checks\.js\s+([\w-]+)/gu),
      ].map((match) => match[1]!);
      for (const check of referencedChecks) {
        expect(knownChecks, `${scriptName} -> ${check}`).toContain(check);
      }

      const nestedScripts = [...command!.matchAll(/\bpnpm\s+([\w:-]+)/gu)]
        .map((match) => match[1]!)
        .filter((name) => name !== "exec");
      for (const nested of nestedScripts) {
        expect(scripts, `${scriptName} -> pnpm ${nested}`).toHaveProperty(
          nested,
        );
      }

      expect(
        referencedChecks.length + nestedScripts.length,
        `${scriptName} reaches no check or nested script`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps direct pnpm commands in the release sequence backed by package scripts", () => {
    const scripts = readPackageScripts();

    for (const command of RELEASE_PROOF_SEQUENCE) {
      const scriptName = extractDirectPnpmScript(command);
      if (scriptName === null) continue;
      expect(scripts, command).toHaveProperty(scriptName);
    }
  });

  // Pattern guards, not a list of names that were never here: `.claude/rules/
  // cloudflare.md` forbids phase-named commands and private topology wrappers,
  // and mutation lanes are opt-in only. These catch a new one being introduced.
  // The named `toBeUndefined()` assertions this replaced named five scripts
  // that never appear anywhere in this repo's history, so they could not fail.
  it("keeps phase and mutation lanes out of public package scripts and release proof", () => {
    const scriptNames = Object.keys(readPackageScripts());
    const releaseProofFlow = RELEASE_PROOF_SEQUENCE.join("\n");

    expect(
      scriptNames.filter((name) => name.startsWith("test:mutation")),
    ).toEqual([]);
    expect(scriptNames.filter((name) => name.includes(":phase"))).toEqual([]);
    expect(releaseProofFlow).not.toMatch(/:?phase\d/u);
  });

  // Every command the release sequence runs must be a real file or a real
  // script. A retired-path allowlist only proved that names nobody uses stay
  // unused; this proves the sequence that actually gates a release still works.
  it("keeps every release sequence node script pointing at a real file", () => {
    const nodeScripts = RELEASE_PROOF_SEQUENCE.flatMap(
      (command) => command.match(/\bnode\s+([\w./-]+)/u)?.[1] ?? [],
    );

    expect(nodeScripts.length).toBeGreaterThan(0);
    for (const scriptPath of nodeScripts) {
      expect(repoPathExists(scriptPath), scriptPath).toBe(true);
    }
  });
});
