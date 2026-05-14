# Turnstile Error Wrapper Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the single-use Turnstile verification error wrapper from `/api/verify-turnstile`.

**Architecture:** Keep route-local helpers only when they encode branching, logging, or reusable route behavior. Use the generic API response helper directly for a single fixed error response.

**Tech Stack:** Next.js App Router route handlers, TypeScript strict mode, Vitest route and architecture tests.

---

## File structure

- Modify: `src/app/api/verify-turnstile/route.ts`
  - Remove `createVerificationErrorResponse()`.
  - Inline the fixed verification-failure error response.
- Modify: `tests/architecture/lib-facade-boundary.test.ts`
  - Add a guard that prevents the wrapper from returning.

## Task 1: Add architecture guard first

**Files:**
- Modify: `tests/architecture/lib-facade-boundary.test.ts`

- [ ] **Step 1: Write the failing guard**

Add this test inside `describe("legacy lib facade boundaries", () => { ... })`:

```ts
  it("keeps verify-turnstile fixed verification failures inline", () => {
    const source = read("src/app/api/verify-turnstile/route.ts");

    expect(source).not.toContain("createVerificationErrorResponse");
    expect(source).toContain("API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED");
    expect(source).toContain("HTTP_BAD_REQUEST");
  });
```

- [ ] **Step 2: Run the guard and confirm RED**

Run:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts
```

Expected: FAIL because `createVerificationErrorResponse` still exists.

## Task 2: Remove the wrapper

**Files:**
- Modify: `src/app/api/verify-turnstile/route.ts`

- [ ] **Step 1: Delete the wrapper**

Delete:

```ts
function createVerificationErrorResponse() {
  return createApiErrorResponse(
    API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
    HTTP_BAD_REQUEST,
  );
}
```

- [ ] **Step 2: Inline the fixed response**

Change:

```ts
return createVerificationErrorResponse();
```

to:

```ts
return createApiErrorResponse(
  API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
  HTTP_BAD_REQUEST,
);
```

## Task 3: Verify behavior

**Files:**
- No additional production edits expected.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/verify-turnstile/__tests__/route.test.ts \
  src/app/api/verify-turnstile/__tests__/route-core.test.ts \
  tests/integration/api/verify-turnstile.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type check**

Run:

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 3: Run lint check**

Run:

```bash
pnpm lint:check
```

Expected: exit 0.

## Self-review

- Spec coverage: The plan removes one single-use wrapper only.
- Placeholder scan: No TODO/TBD placeholders.
- Type consistency: No exported types change.
