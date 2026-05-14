# Middleware Slimming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move CSP/security-header responsibility out of `src/middleware.ts` and into native Next.js `headers()` while preserving documented locale behavior.

**Architecture:** `src/middleware.ts` remains the routing and locale-cookie edge layer. `src/config/security.ts` becomes a static security-header builder without nonce helpers. `next.config.ts` applies the complete header set through the native Next.js `headers()` API.

**Tech Stack:** Next.js 16.2.4 App Router, next-intl middleware, TypeScript, Vitest architecture/unit tests, OpenNext Cloudflare build.

---

## File structure

- Create `tests/architecture/middleware-boundary.test.ts`
  - Source-level contract that middleware no longer owns CSP/security headers or nonce helpers.
- Modify `src/middleware.ts`
  - Remove `@/config/security` import, nonce generation, and security-header mutation.
  - Keep locale redirect, no-JS fallback, locale cookie normalization, leaked-cookie cleanup, and static matcher.
- Modify `src/config/security.ts`
  - Remove nonce parameter support and nonce helper exports from the active runtime API.
  - Keep static CSP directives and existing security-header modes.
- Modify `src/config/__tests__/security.test.ts`
  - Replace nonce expectations with static CSP expectations.
- Modify `next.config.ts`
  - Apply `getSecurityHeaders()` directly and remove CSP filtering.
- Modify docs:
  - `.claude/rules/security.md`
  - `docs/technical/technical-debt.md`
  - `docs/technical/project-architecture-diagram.svg`
  - `docs/superpowers/current/starter-review-pro-reset-final-report.md`
  - proof docs that mention nonce as a current middleware responsibility.

## Task 1: Lock the new boundary with a failing architecture test

**Files:**
- Create: `tests/architecture/middleware-boundary.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(repoPath: string) {
  return readFileSync(repoPath, "utf8");
}

describe("middleware responsibility boundary", () => {
  it("keeps CSP and generic security headers out of middleware", () => {
    const middlewareSource = read("src/middleware.ts");

    expect(middlewareSource).not.toContain("@/config/security");
    expect(middlewareSource).not.toContain("generateNonce");
    expect(middlewareSource).not.toContain("getSecurityHeaders");
    expect(middlewareSource).not.toContain("Content-Security-Policy");
    expect(middlewareSource).not.toContain("x-nonce");
  });

  it("keeps Next.js native headers as the security-header owner", () => {
    const nextConfigSource = read("next.config.ts");

    expect(nextConfigSource).toContain("const securityHeaders = getSecurityHeaders();");
    expect(nextConfigSource).toContain("headers: securityHeaders");
    expect(nextConfigSource).not.toContain("headersNoCSP");
    expect(nextConfigSource).not.toContain("Content-Security-Policy-Report-Only");
  });

  it("removes nonce helpers from the active security config API", () => {
    const securitySource = read("src/config/security.ts");

    expect(securitySource).not.toContain("export function generateNonce");
    expect(securitySource).not.toContain("export function isValidNonce");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run tests/architecture/middleware-boundary.test.ts
```

Expected: FAIL because `src/middleware.ts` still imports `@/config/security` and `next.config.ts` still filters CSP.

## Task 2: Move security headers to native Next config

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Implement the minimal config change**

Replace the existing `headers()` body section:

```ts
headers() {
  const securityHeaders = getSecurityHeaders();
  // Prefer CSP from middleware (with nonce). Remove CSP here to avoid duplication/conflicts.
  const headersNoCSP = securityHeaders.filter(
    (h) =>
      h.key !== "Content-Security-Policy" &&
      h.key !== "Content-Security-Policy-Report-Only",
  );
```

with:

```ts
headers() {
  const securityHeaders = getSecurityHeaders();
```

Then use `securityHeaders` directly in the header config:

```ts
...(securityHeaders.length > 0
  ? [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  : []),
```

- [ ] **Step 2: Run the architecture test**

Run:

```bash
pnpm exec vitest run tests/architecture/middleware-boundary.test.ts
```

Expected: still FAIL because middleware and security config have not been slimmed yet.

## Task 3: Remove nonce/security-header work from middleware

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Remove the security import and nonce plumbing**

Remove:

```ts
import { generateNonce, getSecurityHeaders } from "@/config/security";
```

Delete `applyCommonMiddlewareHeaders()` and `addSecurityHeaders()`.

Change pre-intl redirect helpers so they only call `removeLeakedMiddlewareCookieHeader(response)`.

Change the default export so it no longer calls `generateNonce()` and no longer passes a nonce to helpers.

- [ ] **Step 2: Run middleware tests**

Run:

```bash
pnpm exec vitest run tests/unit/middleware.test.ts src/__tests__/middleware-locale-cookie.test.ts
```

Expected: PASS. If a test fails because it still expects security-header mocks to be called, update the test to assert locale behavior rather than security-header internals.

## Task 4: Remove nonce helpers from active security config

**Files:**
- Modify: `src/config/security.ts`
- Modify: `src/config/__tests__/security.test.ts`

- [ ] **Step 1: Update `src/config/security.ts`**

Remove nonce-specific imports:

```ts
import { COUNT_TWO, HEX_RADIX } from "../constants/count";
```

Change:

```ts
export function generateCSP(nonce?: string): string {
```

to:

```ts
export function generateCSP(): string {
```

Remove nonce additions from `script-src` and `style-src`.

Change:

```ts
export function getSecurityHeaders(
  nonce?: string,
  testMode = false,
): SecurityHeader[] {
```

to:

```ts
export function getSecurityHeaders(testMode = false): SecurityHeader[] {
```

Change CSP construction to:

```ts
value: generateCSP(),
```

Delete `generateNonce()` and `isValidNonce()` from this file and its default export object.

- [ ] **Step 2: Update security tests**

Remove imports and tests for `generateNonce` and `isValidNonce`.

Replace nonce expectations with:

```ts
it("should generate static CSP without nonce directives", () => {
  vi.stubEnv("NODE_ENV", "production");

  const csp = generateCSP();
  expect(csp).not.toContain("'nonce-");
  expect(csp).toMatch(/script-src(?!-elem)[^;]*'self'/);
});
```

Update `getSecurityHeaders(undefined, true)` calls to `getSecurityHeaders(true)`.

- [ ] **Step 3: Run security tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/security.test.ts
```

Expected: PASS.

## Task 5: Update docs to match the new runtime truth

**Files:**
- Modify: `.claude/rules/security.md`
- Modify: `docs/technical/technical-debt.md`
- Modify: `docs/technical/project-architecture-diagram.svg`
- Modify: `docs/superpowers/current/starter-review-pro-reset-final-report.md`
- Modify: `docs/guides/QUALITY-PROOF-LEVELS.md`
- Modify: `docs/guides/RELEASE-PROOF-RUNBOOK.md`
- Modify: `docs/guides/TIER-A-OWNER-MAP.md`

- [ ] **Step 1: Replace current-runtime nonce claims**

Use these truths:

```text
Security header behavior lives in src/config/security.ts and Next.js native headers() in next.config.ts.
Middleware owns locale redirects, locale cookies, and leaked middleware cookie cleanup; it does not own CSP or generic security headers.
CSP is static by starter default. There is no active per-request nonce path.
```

- [ ] **Step 2: Run the source scan**

Run:

```bash
rg -n "middleware.*nonce|nonce.*middleware|CSP nonce|request nonce|headersNoCSP|generateNonce|getSecurityHeaders" src/middleware.ts next.config.ts src/config/security.ts docs .claude/rules tests/architecture/middleware-boundary.test.ts
```

Expected: no active runtime claim that middleware owns nonce/CSP. `getSecurityHeaders` may remain in `next.config.ts`, `src/config/security.ts`, and tests.

## Task 6: Final verification

**Files:**
- No new code files unless earlier tasks require fixes.

- [ ] **Step 1: Run focused tests**

```bash
pnpm exec vitest run \
  tests/architecture/middleware-boundary.test.ts \
  tests/unit/middleware.test.ts \
  src/__tests__/middleware-locale-cookie.test.ts \
  src/config/__tests__/security.test.ts
```

Expected: all listed test files pass.

- [ ] **Step 2: Run type and lint checks**

```bash
pnpm type-check
pnpm lint:check
```

Expected: both exit 0.

- [ ] **Step 3: Run deploy-facing build proof serially**

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all exit 0. Do not run `pnpm build` and `pnpm website:build:cf` in parallel.

## Self-review

- Spec coverage: all acceptance criteria from the design map to Tasks 1-6.
- Placeholder scan: no `TBD`, `TODO`, or "implement later" placeholders.
- Type consistency: `getSecurityHeaders(testMode?: boolean)` and `generateCSP()` are used consistently in the plan.
