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
  readonly getReleaseProofSequence: () => string[];
  readonly getReleaseProofSteps: () => ReleaseProofStep[];
  readonly getReleaseVerifyCommands: () => Array<{
    readonly id: string;
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
  it("keeps release proof local and catalog-only", () => {
    const manifest = loadReleaseProofManifest();
    const releaseProofFlow = manifest.getReleaseProofSequence().join("\n");
    const lanes = new Set(
      manifest.getReleaseProofSteps().map((step) => step.lane),
    );

    // The lane assertion already excludes every deployed step, so naming
    // `deployed-smoke` and `cf-preview-deployed` again proved nothing; the
    // other two named starter-era flags that no longer exist anywhere.
    expect([...lanes]).toEqual(["local/test-mode"]);
    expect(releaseProofFlow).toContain(
      "node scripts/starter-checks.js content-readiness",
    );
  });

  it("rebuilds the local Playwright step without leaving CI", () => {
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
    expect(playwrightStep.env).toEqual(
      expect.objectContaining({
        CI: "1",
        PLAYWRIGHT_REBUILD_SERVER: "true",
      }),
    );
    expect(playwrightStep.requiresFreePort).toBe(3000);
  });

  it("runs the Cloudflare artifact config proof after the OpenNext build", () => {
    const manifest = loadReleaseProofManifest();
    const releaseCommands = manifest.getReleaseVerifyCommands();
    const cloudflareBuildIndex = releaseCommands.findIndex(
      (step) => step.id === "cloudflare-build",
    );
    const artifactConfigIndex = releaseCommands.findIndex(
      (step) =>
        step.command === "node" &&
        step.args.join(" ") ===
          "scripts/quality/checks/cloudflare-artifact-config.js",
    );
    const playwrightIndex = releaseCommands.findIndex((step) =>
      step.args.includes("playwright"),
    );
    const staticAssetHeadersIndex = releaseCommands.findIndex(
      (step) => step.id === "cloudflare-static-asset-headers",
    );

    expect(playwrightIndex).toBeGreaterThanOrEqual(0);
    expect(playwrightIndex).toBeLessThan(cloudflareBuildIndex);
    expect(cloudflareBuildIndex).toBeGreaterThanOrEqual(0);
    expect(artifactConfigIndex).toBe(cloudflareBuildIndex + 1);
    expect(artifactConfigIndex).toBeLessThan(staticAssetHeadersIndex);
    expect(manifest.getReleaseProofSequence()[artifactConfigIndex]).toBe(
      "node scripts/quality/checks/cloudflare-artifact-config.js",
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
    // 这里只证明 dry-run 这步确实挂着一份 gzip 预算——具体数字守在
    // `cloudflare-free-runtime-budget-contract.test.ts`（留在平台上限以内）。
    // 原来把整个对象连同一句英文散文 `source` 一起 toEqual 冻住；那个形状那份
    // 契约测试 2026-07-27 已经从自己身上删掉了，理由是门逼着文档改字。
    expect(wranglerStep.artifactBudget).toEqual(
      expect.objectContaining({
        metric: "gzip KiB",
        measuredArtifact: "source-checkout",
      }),
    );
  });
});
