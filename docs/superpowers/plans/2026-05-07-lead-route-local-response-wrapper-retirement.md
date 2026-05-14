# Lead Route Local Response Wrapper Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove single-use local response wrapper helpers from `/api/inquiry` and `/api/subscribe`.

**Architecture:** Keep shared lead-family behavior in `src/lib/api/lead-route-response.ts`, but inline route-local one-off response branches in the route handlers. Logs and response helpers remain; unnecessary helper names disappear.

**Tech Stack:** Next.js App Router route handlers, TypeScript strict mode, Vitest architecture and route tests.

---

## File structure

- Modify: `src/app/api/inquiry/route.ts`
  - Remove `InquiryResponseContext`.
  - Remove `createSuccessPayload()`.
  - Remove `createErrorResponse()`.
  - Inline success and failure branches after `processLead()`.
- Modify: `src/app/api/subscribe/route.ts`
  - Remove `createSuccessResponse()`.
  - Remove `createErrorResponse()`.
  - Inline success and failure branches after `processLead()`.
  - Remove unused `NextResponse` and `LeadResult` imports if they become unused.
- Modify: `tests/architecture/lib-facade-boundary.test.ts`
  - Add guard against reintroducing those wrappers.

## Task 1: Add architecture guard first

**Files:**
- Modify: `tests/architecture/lib-facade-boundary.test.ts`

- [ ] **Step 1: Write the failing guard**

Add this test inside `describe("legacy lib facade boundaries", () => { ... })`:

```ts
  it("keeps inquiry and subscribe response branches inline", () => {
    const inquirySource = read("src/app/api/inquiry/route.ts");
    const subscribeSource = read("src/app/api/subscribe/route.ts");

    expect(inquirySource).not.toContain("createSuccessPayload");
    expect(inquirySource).not.toContain("createErrorResponse");
    expect(inquirySource).toContain("createApiSuccessResponse");
    expect(inquirySource).toContain("createLeadFailureResponse");
    expect(inquirySource).toContain("requireLeadReferenceId");

    expect(subscribeSource).not.toContain("createSuccessResponse");
    expect(subscribeSource).not.toContain("createErrorResponse");
    expect(subscribeSource).toContain("createApiSuccessResponse");
    expect(subscribeSource).toContain("createLeadFailureResponse");
    expect(subscribeSource).toContain("requireLeadReferenceId");
  });
```

- [ ] **Step 2: Run the guard and confirm RED**

Run:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts
```

Expected: FAIL because `createSuccessPayload`, `createSuccessResponse`, and `createErrorResponse` still exist.

## Task 2: Inline inquiry success/error branches

**Files:**
- Modify: `src/app/api/inquiry/route.ts`

- [ ] **Step 1: Delete the local context interface and wrapper functions**

Delete:

```ts
interface InquiryResponseContext {
  clientIP: string;
  processingTime: number;
}
```

Delete the full `createSuccessPayload()` function.

Delete the full `createErrorResponse()` function.

- [ ] **Step 2: Inline result success branch**

Replace:

```ts
const responseContext = {
  clientIP,
  processingTime,
};

return result.success
  ? createSuccessPayload(result, responseContext)
  : createErrorResponse(result, responseContext);
```

with:

```ts
if (result.success) {
  if (!isRuntimeProduction()) {
    logger.info("Product inquiry submitted successfully", {
      referenceId: result.referenceId,
      ip: sanitizeIP(clientIP),
      processingTime,
      emailSent: result.emailSent,
      recordCreated: result.recordCreated,
    });
  }

  return createApiSuccessResponse({
    referenceId: requireLeadReferenceId(
      result,
      "referenceId missing on successful lead result",
    ),
  });
}

logger.warn("Product inquiry submission failed", {
  error: result.error,
  ip: sanitizeIP(clientIP),
  processingTime,
  referenceId: result.referenceId,
});

return createLeadFailureResponse({
  result,
  validationErrorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
  processingErrorCode: API_ERROR_CODES.INQUIRY_PROCESSING_ERROR,
});
```

- [ ] **Step 3: Check imports**

Keep:

```ts
import { NextRequest } from "next/server";
```

or keep `NextResponse` only if still used in the file. After removing `createErrorResponse()`, `NextResponse` should be unused and should be removed.

## Task 3: Inline subscribe success/error branches

**Files:**
- Modify: `src/app/api/subscribe/route.ts`

- [ ] **Step 1: Delete wrapper functions**

Delete the full `createSuccessResponse()` function.

Delete the full `createErrorResponse()` function.

- [ ] **Step 2: Inline result success branch**

Replace:

```ts
return result.success
  ? createSuccessResponse(result, leadValidation.data.email)
  : createErrorResponse(result);
```

with:

```ts
if (result.success) {
  if (!isRuntimeProduction()) {
    logger.info("Newsletter subscription successful", {
      referenceId: result.referenceId,
      email: sanitizeEmail(leadValidation.data.email),
    });
  }

  return createApiSuccessResponse({
    referenceId: requireLeadReferenceId(
      result,
      "referenceId missing on successful lead result",
    ),
  });
}

logger.warn("Newsletter subscription failed", {
  error: result.error,
  referenceId: result.referenceId,
});

return createLeadFailureResponse({
  result,
  validationErrorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_INVALID,
  processingErrorCode: API_ERROR_CODES.SUBSCRIBE_PROCESSING_ERROR,
});
```

- [ ] **Step 3: Check imports**

Remove unused imports:

```ts
NextResponse
type LeadResult
```

Keep `NextRequest`, `createApiSuccessResponse`, `createLeadFailureResponse`, `requireLeadReferenceId`, `isRuntimeProduction`, `logger`, and `sanitizeEmail`.

## Task 4: Run focused proof

**Files:**
- No additional production edits expected.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts \
  tests/integration/api/lead-family-protection.test.ts \
  tests/integration/api/subscribe.test.ts
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

- [ ] **Step 4: Run build proof**

Run:

```bash
pnpm build
```

Expected: exit 0. Existing local warnings about missing Resend key or Next middleware deprecation may appear.

- [ ] **Step 5: Run Cloudflare build proof**

Run only after `pnpm build` completes:

```bash
pnpm website:build:cf
```

Expected: exit 0. Existing OpenNext bundle warnings may appear.

## Self-review

- Spec coverage: The plan removes only single-use route-local response wrappers while preserving logs and response helpers.
- Placeholder scan: No TODO/TBD placeholders.
- Type consistency: After wrappers are removed, `NextResponse` and `LeadResult` imports must be removed if unused.
