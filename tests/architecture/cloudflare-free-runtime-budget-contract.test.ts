import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const requireModule = createRequire(`${process.cwd()}/package.json`);

interface ReleaseProofStep {
  readonly id: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly artifactBudget?: {
    readonly metric: string;
    readonly limitKiB: number;
    readonly preferredKiB: number;
    readonly measuredArtifact: string;
    readonly source: string;
  };
}

interface ReleaseProofManifestModule {
  readonly getReleaseProofSteps: () => ReleaseProofStep[];
}

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo docs by relative path
  return readFileSync(relativePath, "utf8");
}

function loadReleaseProofManifest(): ReleaseProofManifestModule {
  return requireModule(
    "./scripts/quality/release-proof-manifest.js",
  ) as ReleaseProofManifestModule;
}

describe("Cloudflare Free runtime budget contract", () => {
  it("keeps docs and release manifest aligned on the source-checkout Cloudflare budget", () => {
    const docs = [
      "docs/ref/profiles.md",
      "docs/proof/levels.md",
      "docs/proof/launch.md",
      "docs/proof/release.md",
      "docs/proof/dry-run.md",
    ]
      .map(readRepoFile)
      .join("\n");
    const wranglerStep = loadReleaseProofManifest()
      .getReleaseProofSteps()
      .find((step) => step.id === "wrangler-preview-dry-run");

    if (!wranglerStep) {
      throw new Error("Missing Wrangler preview dry-run release proof step");
    }

    expect(wranglerStep.artifactBudget).toEqual({
      metric: "gzip KiB",
      limitKiB: 3000,
      preferredKiB: 2700,
      measuredArtifact: "source-checkout",
      source: "Cloudflare Workers Free gzip upload limit",
    });
    expect(wranglerStep.command).toBe("pnpm");
    expect(wranglerStep.args.join(" ")).toBe(
      "exec wrangler deploy --dry-run --env preview",
    );

    for (const expected of [
      "company-site",
      "source checkout",
      "Cloudflare Workers Free",
      "3000 KiB gzip",
      "2700 KiB",
      "pnpm exec wrangler deploy --dry-run --env preview",
    ]) {
      expect(docs).toContain(expected);
    }
  });

  it("makes the PR CI budget-proof boundary explicit", () => {
    const workflow = readRepoFile(".github/workflows/ci.yml");
    const docs = [
      "docs/proof/release.md",
      "docs/proof/launch.md",
      "docs/proof/dry-run.md",
    ]
      .map(readRepoFile)
      .join("\n");

    expect(workflow).toContain("Cloudflare/Wrangler dry-run");
    expect(workflow).toContain("github.event_name != 'pull_request'");
    expect(workflow).toContain("Cloudflare Free budget note");
    expect(workflow).toContain(
      "Pull request CI does not prove the Cloudflare Free gzip budget.",
    );
    expect(workflow).toContain("workflow_dispatch");
    expect(workflow).toContain("pnpm release:verify");

    for (const expected of [
      "Pull request CI does not prove the Cloudflare Free gzip budget",
      "workflow_dispatch",
      "pnpm release:verify",
      "exact head SHA",
    ]) {
      expect(docs).toContain(expected);
    }
  });

  it("keeps Cloudflare static asset headers aligned with the Free runtime baseline", () => {
    const headersPath = "public/_headers";
    const wrangler = readRepoFile("wrangler.jsonc");
    const docs = [
      "docs/proof/release.md",
      "docs/proof/launch.md",
      ".claude/rules/cloudflare.md",
    ]
      .map(readRepoFile)
      .join("\n");
    const releaseSteps = loadReleaseProofManifest().getReleaseProofSteps();
    const cloudflareBuildIndex = releaseSteps.findIndex(
      (step) => step.id === "cloudflare-build",
    );
    const headerStepIndex = releaseSteps.findIndex(
      (step) => step.id === "cloudflare-static-asset-headers",
    );
    const wranglerStepIndex = releaseSteps.findIndex(
      (step) => step.id === "wrangler-preview-dry-run",
    );
    const headerStep = releaseSteps[headerStepIndex];

    expect(existsSync(headersPath)).toBe(true);

    const headers = readRepoFile(headersPath);

    expect(headers).toContain("/_next/static/*");
    expect(headers).toContain(
      "Cache-Control: public,max-age=31536000,immutable",
    );
    expect(wrangler).toContain("Cloudflare Workers Free baseline");
    expect(wrangler).not.toContain(
      "Bundle size assumes the Cloudflare Workers paid plan.",
    );
    expect(headerStep).toEqual(
      expect.objectContaining({
        id: "cloudflare-static-asset-headers",
        command: "node",
        args: ["scripts/starter-checks.js", "cf-static-asset-headers"],
      }),
    );
    expect(cloudflareBuildIndex).toBeGreaterThan(-1);
    expect(headerStepIndex).toBeGreaterThan(cloudflareBuildIndex);
    expect(headerStepIndex).toBeLessThan(wranglerStepIndex);
    expect(docs).toContain(
      "node scripts/starter-checks.js cf-static-asset-headers",
    );
  });
});
