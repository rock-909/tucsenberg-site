import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "scripts/quality/release-proof-manifest.js",
);
const requireModule = createRequire(path.join(REPO_ROOT, "package.json"));

interface ReleaseProofStep {
  readonly id: string;
  readonly label: string;
  readonly lane: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: Record<string, string>;
  readonly requiresFreePort?: number;
  readonly artifactBudget?: ReleaseProofArtifactBudget;
}

interface ReleaseProofArtifactBudget {
  readonly metric: string;
  readonly limitKiB: number;
  readonly preferredKiB: number;
  readonly measuredArtifact: string;
  readonly source: string;
}

interface ReleaseProofManifestModule {
  readonly RELEASE_PROOF_MANIFEST: {
    readonly steps: readonly ReleaseProofStep[];
  };
  readonly formatReleaseProofCommand: (step: ReleaseProofStep) => string;
  readonly getReleaseProofDocsCommandBlock: () => string;
  readonly getReleaseProofSequence: () => string[];
  readonly getReleaseProofSteps: () => ReleaseProofStep[];
  readonly getReleaseVerifyCommands: () => Array<{
    readonly command: string;
    readonly args: readonly string[];
    readonly env?: Record<string, string>;
  }>;
}

function loadReleaseProofManifest(): ReleaseProofManifestModule {
  expect(fs.existsSync(MANIFEST_PATH)).toBe(true);
  return requireModule(MANIFEST_PATH) as ReleaseProofManifestModule;
}

describe("release proof manifest", () => {
  it("is the canonical source for release proof command order", () => {
    const manifest = loadReleaseProofManifest();
    const steps = manifest.getReleaseProofSteps();

    expect(steps).toHaveLength(manifest.RELEASE_PROOF_MANIFEST.steps.length);
    expect(manifest.getReleaseProofSequence()).toEqual(
      steps.map((step) => manifest.formatReleaseProofCommand(step)),
    );
    expect(manifest.getReleaseVerifyCommands()).toEqual(
      steps.map(({ id, command, args, env, artifactBudget }) => ({
        id,
        command,
        args,
        ...(env ? { env } : {}),
        ...(artifactBudget ? { artifactBudget } : {}),
      })),
    );
  });

  it("keeps default release proof local and company-site scoped", () => {
    const manifest = loadReleaseProofManifest();
    const releaseProofFlow = manifest.getReleaseProofSequence().join("\n");
    const lanes = new Set(
      manifest.getReleaseProofSteps().map((step) => step.lane),
    );

    expect([...lanes]).toEqual(["local/test-mode"]);
    expect(releaseProofFlow).toContain(
      "node scripts/starter-checks.js content-readiness --profile company-site",
    );
    expect(releaseProofFlow).not.toContain(
      "node scripts/starter-checks.js content-readiness --profile b2b-lead",
    );
    expect(releaseProofFlow).not.toContain("cf-preview-deployed");
    expect(releaseProofFlow).not.toContain("deployed-smoke");
    expect(releaseProofFlow).not.toContain("POST_DEPLOY_TEST=1");
  });

  it("marks the local Playwright step as requiring port 3000", () => {
    const manifest = loadReleaseProofManifest();
    const playwrightStep = manifest
      .getReleaseProofSteps()
      .find((step) => step.args.includes("playwright"));

    if (!playwrightStep) {
      throw new Error("Missing local Playwright release proof step");
    }

    expect(playwrightStep.command).toBe("pnpm");
    expect(playwrightStep.args).toEqual(
      expect.arrayContaining(["exec", "playwright", "test"]),
    );
    expect(playwrightStep.env).toEqual(expect.objectContaining({ CI: "1" }));
    expect(playwrightStep.requiresFreePort).toBe(3000);
  });

  it("generates the release docs command block from the manifest", () => {
    const manifest = loadReleaseProofManifest();

    expect(manifest.getReleaseProofDocsCommandBlock()).toBe(
      manifest.getReleaseProofSequence().join("\n"),
    );
  });

  it("records the Cloudflare Free gzip budget on the Wrangler dry-run step", () => {
    const manifest = loadReleaseProofManifest();
    const wranglerStep = manifest
      .getReleaseProofSteps()
      .find((step) => step.id === "wrangler-preview-dry-run");

    if (!wranglerStep) {
      throw new Error("Missing Wrangler preview dry-run release proof step");
    }

    expect(wranglerStep.command).toBe("pnpm");
    expect(wranglerStep.args).toEqual([
      "exec",
      "wrangler",
      "deploy",
      "--dry-run",
      "--env",
      "preview",
    ]);
    expect(wranglerStep.artifactBudget).toEqual({
      metric: "gzip KiB",
      limitKiB: 3000,
      preferredKiB: 2700,
      measuredArtifact: "source-checkout",
      source: "Cloudflare Workers Free gzip upload limit",
    });
  });
});
