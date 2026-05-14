import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DECISION_DOC = "docs/website/proxy-migration-official-doc-check.md";

describe("proxy migration official-doc boundary", () => {
  it("keeps the middleware to proxy decision as an official-doc-only check", () => {
    expect(existsSync(DECISION_DOC)).toBe(true);

    const decision = existsSync(DECISION_DOC)
      ? readFileSync(DECISION_DOC, "utf8")
      : "";

    for (const required of [
      "official-doc-only check",
      "Decision: do not migrate middleware.ts to proxy.ts now",
      "No runtime migration test in this lane",
      "src/middleware.ts remains the runtime entrypoint",
      "src/proxy.ts is not created",
      "Cache Components",
      "Cloudflare/OpenNext",
      "node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md",
      "node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md",
      "node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/runtime.md",
      "node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md",
    ]) {
      expect(decision).toContain(required);
    }
  });

  it("does not accidentally create the renamed runtime entrypoint", () => {
    expect(existsSync("src/middleware.ts")).toBe(true);
    expect(existsSync("src/proxy.ts")).toBe(false);
  });

  it("links the decision from Cloudflare and quality proof docs", () => {
    const cloudflareRules = readFileSync(".claude/rules/cloudflare.md", "utf8");
    const qualityProof = readFileSync("docs/website/quality-proof.md", "utf8");

    for (const source of [cloudflareRules, qualityProof]) {
      expect(source).toContain(DECISION_DOC);
      expect(source).toContain("official-doc-only check");
    }
  });
});
