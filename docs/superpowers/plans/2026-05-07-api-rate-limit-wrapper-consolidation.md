# API Rate Limit Wrapper Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate route-local rate-limit orchestration from `/api/verify-turnstile` and use the shared `withRateLimit()` wrapper.

**Architecture:** Keep `/api/verify-turnstile` as a security-sensitive route, but make rate limiting a wrapper concern like contact, inquiry, subscribe, and CSP report. The route handler receives `clientIP` from `RateLimitContext` and continues to verify Turnstile with a server-derived IP.

**Tech Stack:** Next.js 16 Route Handlers, TypeScript, Vitest, shared API helpers under `src/lib/api`.

---

## File structure

- Modify `tests/architecture/lib-facade-boundary.test.ts`
  - Add a route-source guard that fails while `/api/verify-turnstile` manually imports or calls distributed rate-limit primitives.
- Modify `src/app/api/verify-turnstile/route.ts`
  - Replace manual `checkDistributedRateLimit` / `createRateLimitHeaders` / `getIPKey` flow with `withRateLimit("turnstile", handlePost)`.
- Modify `src/app/api/verify-turnstile/__tests__/route.test.ts`
  - Mock `withRateLimit` instead of distributed rate-limit internals, while preserving tests for rate-limit rejection and infrastructure failure.
- Modify `src/app/api/verify-turnstile/__tests__/route-core.test.ts`
  - Mock `withRateLimit` for the basic route tests.
- Modify `tests/integration/api/verify-turnstile.test.ts`
  - Mock `withRateLimit` for the focused integration tests.

## Task 1: Add failing architecture guard

**Files:**
- Modify: `tests/architecture/lib-facade-boundary.test.ts`

- [ ] **Step 1: Add a source guard**

Add this test inside the existing `describe("legacy lib facade boundaries", ...)` block:

```ts
it("keeps verify-turnstile on the shared rate-limit wrapper", () => {
  const source = read("src/app/api/verify-turnstile/route.ts");

  expect(source).toContain("@/lib/api/with-rate-limit");
  expect(source).toContain('withRateLimit("turnstile"');
  expect(source).not.toContain("@/lib/security/distributed-rate-limit");
  expect(source).not.toContain("@/lib/security/rate-limit-key-strategies");
  expect(source).not.toContain("checkDistributedRateLimit");
  expect(source).not.toContain("createRateLimitHeaders");
  expect(source).not.toContain("getIPKey");
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts
```

Expected: FAIL because `src/app/api/verify-turnstile/route.ts` still manually imports the distributed rate-limit primitives.

## Task 2: Refactor `/api/verify-turnstile` to `withRateLimit`

**Files:**
- Modify: `src/app/api/verify-turnstile/route.ts`

- [ ] **Step 1: Replace rate-limit imports**

Remove these imports:

```ts
import {
  checkDistributedRateLimit,
  createRateLimitHeaders,
} from "@/lib/security/distributed-rate-limit";
import { getIPKey } from "@/lib/security/rate-limit-key-strategies";
```

Add:

```ts
import {
  withRateLimit,
  type RateLimitContext,
} from "@/lib/api/with-rate-limit";
```

- [ ] **Step 2: Change `handlePost` signature**

Change:

```ts
async function handlePost(request: NextRequest) {
```

to:

```ts
async function handlePost(
  request: NextRequest,
  { clientIP }: RateLimitContext,
) {
```

- [ ] **Step 3: Delete the manual rate-limit block**

Delete the local `let rateLimitResult...`, `getIPKey`, `checkDistributedRateLimit`, and `!rateLimitResult.allowed` block.

Keep the later validation and verification flow.

- [ ] **Step 4: Use wrapper in POST**

Add:

```ts
const POST_RATE_LIMITED = withRateLimit("turnstile", handlePost);
```

Change POST to:

```ts
export async function POST(request: NextRequest) {
  const response = await POST_RATE_LIMITED(request);
  return applyCorsHeaders({ request, response });
}
```

- [ ] **Step 5: Remove redundant client IP extraction**

Delete this line from inside `handlePost`:

```ts
const clientIP = getClientIP(request);
```

`clientIP` now comes from `RateLimitContext`.

## Task 3: Update verify-turnstile tests to mock the wrapper seam

**Files:**
- Modify: `src/app/api/verify-turnstile/__tests__/route.test.ts`
- Modify: `src/app/api/verify-turnstile/__tests__/route-core.test.ts`
- Modify: `tests/integration/api/verify-turnstile.test.ts`

- [ ] **Step 1: Replace distributed-rate-limit mocks with withRateLimit mock**

Use a hoisted wrapper mode:

```ts
const mockRateLimitMode = vi.hoisted(() => ({
  value: "allow" as "allow" | "limited" | "failure",
}));

vi.mock("@/lib/api/with-rate-limit", () => ({
  withRateLimit:
    (_preset: string, handler: Function) => async (request: NextRequest) => {
      if (mockRateLimitMode.value === "limited") {
        return Response.json(
          { success: false, errorCode: API_ERROR_CODES.RATE_LIMIT_EXCEEDED },
          { status: 429 },
        );
      }
      if (mockRateLimitMode.value === "failure") {
        return Response.json(
          { success: false, errorCode: API_ERROR_CODES.SERVICE_UNAVAILABLE },
          { status: 503 },
        );
      }
      return handler(request, { clientIP: "192.168.1.1" });
    },
}));
```

Use `NextResponse.json(...)` instead of `Response.json(...)` if the test file already imports `NextResponse`.

- [ ] **Step 2: Reset wrapper mode before each test**

```ts
beforeEach(() => {
  mockRateLimitMode.value = "allow";
});
```

- [ ] **Step 3: Update rate-limit tests**

Replace direct `checkDistributedRateLimit` mock changes with:

```ts
mockRateLimitMode.value = "limited";
```

and:

```ts
mockRateLimitMode.value = "failure";
```

Keep response assertions unchanged:

```ts
expect(response.status).toBe(429);
```

and:

```ts
expect(response.status).toBe(503);
expect(data.errorCode).toBe(API_ERROR_CODES.SERVICE_UNAVAILABLE);
```

## Task 4: Focused verification

**Files:**
- No additional files unless tests reveal small fixes.

- [ ] **Step 1: Run architecture and route tests**

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/verify-turnstile/__tests__/route.test.ts \
  src/app/api/verify-turnstile/__tests__/route-core.test.ts \
  tests/integration/api/verify-turnstile.test.ts \
  src/lib/api/__tests__/with-rate-limit.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run type and lint**

```bash
pnpm type-check
pnpm lint:check
```

Expected: both pass.

- [ ] **Step 3: Run build and Cloudflare proof**

```bash
pnpm build
pnpm website:build:cf
pnpm exec wrangler deploy --dry-run --env preview
```

Expected: all pass. Do not run `pnpm build` and `pnpm website:build:cf` in parallel.

## Self-review

- Spec coverage: every acceptance criterion maps to Task 1-4.
- Placeholder scan: no TBD/TODO/incomplete steps.
- Type consistency: wrapper seam uses the existing `withRateLimit("turnstile", handler)` pattern and `RateLimitContext`.
