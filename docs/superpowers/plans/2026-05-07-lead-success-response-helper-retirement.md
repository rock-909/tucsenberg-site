# Lead Success Response Helper Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the thin lead success payload helper and use the generic API success helper in the lead-family routes.

**Architecture:** Keep `lead-route-response.ts` for real lead-family behavior: failure mapping, reference ID fail-closed logic, and shared Turnstile validation. Move success envelopes to `createApiSuccessResponse()` so the route response contract uses the generic API helper instead of a route-family wrapper.

**Tech Stack:** Next.js App Router route handlers, TypeScript strict mode, Vitest architecture and route tests.

---

## File structure

- Modify: `src/lib/api/lead-route-response.ts`
  - Remove only `createLeadSuccessPayload()`.
  - Keep `createLeadFailureResponse()`, `requireLeadReferenceId()`, and `validateLeadTurnstileToken()`.
- Modify: `src/app/api/contact/route.ts`
  - Replace `createLeadSuccessPayload(referenceId)` with `createApiSuccessResponse({ referenceId })`.
- Modify: `src/app/api/inquiry/route.ts`
  - Replace `NextResponse.json(createLeadSuccessPayload(...))` with `createApiSuccessResponse({ referenceId: ... })`.
- Modify: `src/app/api/subscribe/route.ts`
  - Replace `NextResponse.json(createLeadSuccessPayload(...))` with `createApiSuccessResponse({ referenceId: ... })`.
- Modify: `tests/architecture/lib-facade-boundary.test.ts`
  - Add a guard that blocks `createLeadSuccessPayload` imports/exports and requires lead routes to use `createApiSuccessResponse`.

## Task 1: Add architecture guard first

**Files:**
- Modify: `tests/architecture/lib-facade-boundary.test.ts`

- [ ] **Step 1: Write the failing architecture test**

Add this test inside `describe("legacy lib facade boundaries", () => { ... })`:

```ts
  it("keeps lead success responses on the generic API success helper", () => {
    const helperSource = read("src/lib/api/lead-route-response.ts");
    const leadRoutes = [
      "src/app/api/contact/route.ts",
      "src/app/api/inquiry/route.ts",
      "src/app/api/subscribe/route.ts",
    ];

    expect(helperSource).not.toContain("createLeadSuccessPayload");

    for (const routePath of leadRoutes) {
      const source = read(routePath);
      expect(source).toContain("@/lib/api/api-response");
      expect(source).toContain("createApiSuccessResponse");
      expect(source).not.toContain("createLeadSuccessPayload");
    }
  });
```

- [ ] **Step 2: Run the guard and confirm RED**

Run:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts
```

Expected: FAIL because `createLeadSuccessPayload` still exists and lead routes still import it.

## Task 2: Replace lead success helper usage

**Files:**
- Modify: `src/lib/api/lead-route-response.ts`
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/app/api/inquiry/route.ts`
- Modify: `src/app/api/subscribe/route.ts`

- [ ] **Step 1: Remove the thin helper export**

In `src/lib/api/lead-route-response.ts`, delete:

```ts
export function createLeadSuccessPayload(referenceId: string) {
  return {
    success: true as const,
    data: {
      referenceId,
    },
  };
}
```

- [ ] **Step 2: Update contact route imports**

Change:

```ts
import { createApiErrorResponse } from "@/lib/api/api-response";
import { createLeadSuccessPayload } from "@/lib/api/lead-route-response";
```

to:

```ts
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
```

- [ ] **Step 3: Update contact route success response**

Change:

```ts
return NextResponse.json(createLeadSuccessPayload(referenceId));
```

to:

```ts
return createApiSuccessResponse({ referenceId });
```

- [ ] **Step 4: Update inquiry route imports**

Change:

```ts
import { createApiErrorResponse } from "@/lib/api/api-response";
```

to:

```ts
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
```

Remove `createLeadSuccessPayload` from the `@/lib/api/lead-route-response` named import.

- [ ] **Step 5: Update inquiry route success response**

Change:

```ts
return NextResponse.json(
  createLeadSuccessPayload(
    requireLeadReferenceId(
      result,
      "referenceId missing on successful lead result",
    ),
  ),
);
```

to:

```ts
return createApiSuccessResponse({
  referenceId: requireLeadReferenceId(
    result,
    "referenceId missing on successful lead result",
  ),
});
```

- [ ] **Step 6: Update subscribe route imports**

Change:

```ts
import { createApiErrorResponse } from "@/lib/api/api-response";
```

to:

```ts
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
```

Remove `createLeadSuccessPayload` from the `@/lib/api/lead-route-response` named import.

- [ ] **Step 7: Update subscribe route success response**

Change:

```ts
return NextResponse.json(
  createLeadSuccessPayload(
    requireLeadReferenceId(
      result,
      "referenceId missing on successful lead result",
    ),
  ),
);
```

to:

```ts
return createApiSuccessResponse({
  referenceId: requireLeadReferenceId(
    result,
    "referenceId missing on successful lead result",
  ),
});
```

- [ ] **Step 8: Run focused route and guard proof**

Run:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/contact/__tests__/route.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts \
  tests/integration/api/lead-family-protection.test.ts
```

Expected: PASS. Success response JSON must stay unchanged.

## Task 3: Type/lint verification

**Files:**
- No additional production edits expected.

- [ ] **Step 1: Run type check**

Run:

```bash
pnpm type-check
```

Expected: exit 0.

- [ ] **Step 2: Run lint check**

Run:

```bash
pnpm lint:check
```

Expected: exit 0.

- [ ] **Step 3: Optional broader build proof**

If no unrelated failure is present, run:

```bash
pnpm build
```

Expected: exit 0. Existing local warnings about missing Resend key or Next middleware deprecation may appear and are not caused by this change.

## Self-review

- Spec coverage: This plan removes only the thin success helper and preserves lead-family protection helpers.
- Placeholder scan: No TODO/TBD placeholders.
- Type consistency: `createApiSuccessResponse({ referenceId })` returns the same `{ success: true, data: { referenceId } }` envelope asserted by route tests.
