import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo contract files by relative path
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

describe("Cloudflare platform contract", () => {
  it("uses DEPLOYMENT_PLATFORM as the canonical Cloudflare platform signal", () => {
    const nextConfig = readRepoFile("next.config.ts");
    const wrangler = readRepoFile("wrangler.jsonc");
    const docs = [
      "docs/technical/deployment-notes.md",
      "docs/website/部署设置.md",
      "docs/website/quality-proof.md",
    ]
      .map(readRepoFile)
      .join("\n");

    expect(wrangler).toContain('"DEPLOYMENT_PLATFORM": "cloudflare"');
    expect(nextConfig).toContain(
      'process.env.DEPLOYMENT_PLATFORM === "cloudflare"',
    );
    expect(nextConfig).toContain('process.env.DEPLOY_TARGET === "cloudflare"');
    for (const marker of [
      "DEPLOYMENT_PLATFORM=cloudflare",
      "DEPLOY_TARGET=cloudflare",
      "legacy compatibility alias",
    ]) {
      expect(docs).toContain(marker);
    }
  });
});
