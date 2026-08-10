import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(repoPath: string) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local files
  return readFileSync(repoPath, "utf8");
}

describe("proxy responsibility boundary", () => {
  it("keeps CSP and generic security headers out of proxy", () => {
    const proxySource = read("src/proxy.ts");

    expect(proxySource).not.toContain("@/config/security");
    expect(proxySource).not.toContain("generateNonce");
    expect(proxySource).not.toContain("getSecurityHeaders");
    expect(proxySource).not.toContain("Content-Security-Policy");
    expect(proxySource).not.toContain("x-nonce");
  });

  it("keeps Next.js native headers as the security-header owner", () => {
    const nextConfigSource = read("next.config.ts");

    expect(nextConfigSource).toContain(
      "const securityHeaders = getSecurityHeaders();",
    );
    expect(nextConfigSource).toContain("headers: securityHeaders");
    expect(nextConfigSource).not.toContain("headersNoCSP");
    expect(nextConfigSource).not.toContain(
      "Content-Security-Policy-Report-Only",
    );
  });

  it("removes nonce helpers from the active security config API", () => {
    const securitySource = read("src/config/security.ts");

    expect(securitySource).not.toContain("export function generateNonce");
    expect(securitySource).not.toContain("export function isValidNonce");
  });

  it("keeps proxy as a thin next-intl delegate with pre-stream finite-route 404s", () => {
    const proxySource = read("src/proxy.ts");

    expect(proxySource).toContain(
      'import createMiddleware from "next-intl/middleware";',
    );
    expect(proxySource).toContain(
      "const intlMiddleware = createMiddleware(routing);",
    );
    expect(proxySource).toContain("isUnknownProductPath(pathname)");
    expect(proxySource).toContain("return createPlainNotFound();");
    expect(proxySource).toContain("return intlMiddleware(request);");
  });
});
