import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FEASIBILITY_DOC = "docs/website/nonce-csp-feasibility.md";

describe("nonce CSP feasibility lane", () => {
  it("keeps the nonce CSP lane as a documented proof decision, not a default runtime change", () => {
    expect(existsSync(FEASIBILITY_DOC)).toBe(true);

    const feasibility = existsSync(FEASIBILITY_DOC)
      ? readFileSync(FEASIBILITY_DOC, "utf8")
      : "";
    const securityConfig = readFileSync("src/config/security.ts", "utf8");

    expect(feasibility).toContain("Decision: do not implement nonce CSP now");
    expect(feasibility).toContain(
      "No middleware/proxy migration test in this lane",
    );
    expect(feasibility).toContain(
      "Current default remains static-compatible CSP",
    );
    expect(securityConfig).not.toContain("'nonce-");
    expect(securityConfig).toContain("static-compatible CSP");
  });

  it("records the minimum proof required before any future nonce CSP implementation", () => {
    const feasibility = existsSync(FEASIBILITY_DOC)
      ? readFileSync(FEASIBILITY_DOC, "utf8")
      : "";

    for (const required of [
      "dynamic rendering",
      "proxy-generated nonce",
      "Cache Components",
      "Cloudflare/OpenNext",
      "Turnstile",
      "analytics",
      "deployed-smoke",
      "real-service-canary",
      "rollback plan",
    ]) {
      expect(feasibility).toContain(required);
    }
  });

  it("links the feasibility decision from security and proof docs", () => {
    const qualityProof = readFileSync("docs/website/quality-proof.md", "utf8");
    const technicalDebt = readFileSync(
      "docs/technical/technical-debt.md",
      "utf8",
    );
    const securityRules = readFileSync(".claude/rules/security.md", "utf8");

    for (const source of [qualityProof, technicalDebt, securityRules]) {
      expect(source).toContain("docs/website/nonce-csp-feasibility.md");
    }
  });
});
