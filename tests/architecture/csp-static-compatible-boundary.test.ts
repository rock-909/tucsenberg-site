import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CSP static-compatible boundary", () => {
  it("documents that strict security mode is not nonce-level strict CSP", () => {
    const securityConfig = readFileSync("src/config/security.ts", "utf8");
    const securityRules = readFileSync(".claude/rules/security.md", "utf8");
    const qualityProof = readFileSync("docs/website/quality-proof.md", "utf8");

    for (const source of [securityConfig, securityRules, qualityProof]) {
      expect(source).toContain("static-compatible");
      expect(source).toContain("not nonce-level strict CSP");
    }

    expect(securityConfig).toContain("NEXT_PUBLIC_SECURITY_MODE=strict");
    expect(securityRules).toContain("NEXT_PUBLIC_SECURITY_MODE=strict");
    expect(qualityProof).toContain("NEXT_PUBLIC_SECURITY_MODE=strict");
  });

  it("keeps nonce CSP as a separate proof lane", () => {
    const securityRules = readFileSync(".claude/rules/security.md", "utf8");
    const qualityProof = readFileSync("docs/website/quality-proof.md", "utf8");

    for (const source of [securityRules, qualityProof]) {
      expect(source).toContain("dynamic rendering");
      expect(source).toContain("proxy-generated nonce");
      expect(source).toContain("Cloudflare/OpenNext");
    }
  });
});
