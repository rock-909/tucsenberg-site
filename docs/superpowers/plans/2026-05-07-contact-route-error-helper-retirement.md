# Contact Route Error Helper Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the route-local contact error helper by typing canonical contact failure error codes as `ApiErrorCode`.

**Architecture:** The canonical contact module owns contact validation and submission result typing. The API route should call the generic API response helper directly without casting string error codes.

**Tech Stack:** Next.js App Router route handlers, TypeScript strict mode, Vitest architecture and route tests.

---

## File structure

- Modify: `src/lib/contact/submit-canonical-contact.ts`
  - Type contact failure `errorCode` fields as `ApiErrorCode`.
  - Remove unused `submissionResult.errorCode`.
- Modify: `src/app/api/contact/route.ts`
  - Remove `createSubmissionErrorResponse()`.
  - Call `createApiErrorResponse()` directly.
- Modify: `tests/architecture/lib-facade-boundary.test.ts`
  - Add a guard that prevents the route-local cast helper from returning.

## Task 1: Add architecture guard first

**Files:**
- Modify: `tests/architecture/lib-facade-boundary.test.ts`

- [ ] **Step 1: Write the failing guard**

Add this test inside `describe("legacy lib facade boundaries", () => { ... })`:

```ts
  it("keeps contact route error responses on typed canonical error codes", () => {
    const source = read("src/app/api/contact/route.ts");

    expect(source).not.toContain("createSubmissionErrorResponse");
    expect(source).not.toContain("as (typeof API_ERROR_CODES)");
    expect(source).toContain("createApiErrorResponse(");
    expect(source).toContain("payloadValidation.errorCode");
    expect(source).toContain("submission.errorCode");
  });
```

- [ ] **Step 2: Run the guard and confirm RED**

Run:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts
```

Expected: FAIL because the helper and cast still exist.

## Task 2: Tighten canonical contact error-code types

**Files:**
- Modify: `src/lib/contact/submit-canonical-contact.ts`

- [ ] **Step 1: Import the API error-code type**

Change:

```ts
import { API_ERROR_CODES } from "@/constants/api-error-codes";
```

to:

```ts
import {
  API_ERROR_CODES,
  type ApiErrorCode,
} from "@/constants/api-error-codes";
```

- [ ] **Step 2: Type contact validation failure error codes**

Change:

```ts
interface ContactValidationFailure {
  success: false;
  errorCode: string;
```

to:

```ts
interface ContactValidationFailure {
  success: false;
  errorCode: ApiErrorCode;
```

- [ ] **Step 3: Type canonical contact failure error codes**

Change:

```ts
export interface CanonicalContactSubmissionFailure {
  success: false;
  errorCode: string;
```

to:

```ts
export interface CanonicalContactSubmissionFailure {
  success: false;
  errorCode: ApiErrorCode;
```

- [ ] **Step 4: Remove unused success-side errorCode**

Delete this line from `CanonicalContactSubmissionSuccess["submissionResult"]`:

```ts
    errorCode?: string | undefined;
```

## Task 3: Remove route-local contact error helper

**Files:**
- Modify: `src/app/api/contact/route.ts`

- [ ] **Step 1: Delete the helper**

Delete:

```ts
function createSubmissionErrorResponse(errorCode: string, status?: number) {
  return createApiErrorResponse(
    errorCode as (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES],
    status ?? HTTP_BAD_REQUEST,
  );
}
```

- [ ] **Step 2: Keep required imports only**

Keep `API_ERROR_CODES`, `HTTP_BAD_REQUEST`, and `HTTP_INTERNAL_ERROR`, because the route still needs the contact processing fallback and default bad-request status.

- [ ] **Step 3: Inline payload validation error response**

Change:

```ts
return createSubmissionErrorResponse(
  payloadValidation.errorCode,
  payloadValidation.statusCode,
);
```

to:

```ts
return createApiErrorResponse(
  payloadValidation.errorCode,
  payloadValidation.statusCode ?? HTTP_BAD_REQUEST,
);
```

- [ ] **Step 4: Inline canonical submission error response**

Change:

```ts
return createSubmissionErrorResponse(
  submission.errorCode,
  submission.statusCode,
);
```

to:

```ts
return createApiErrorResponse(
  submission.errorCode,
  submission.statusCode ?? HTTP_BAD_REQUEST,
);
```

## Task 4: Verify contact route behavior

**Files:**
- No additional production edits expected.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm exec vitest run \
  tests/architecture/lib-facade-boundary.test.ts \
  src/app/api/contact/__tests__/route.test.ts \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/app/__tests__/actions.test.ts \
  src/app/__tests__/contact-integration.test.ts
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

- Spec coverage: The plan removes only the route-local cast helper and preserves behavior.
- Placeholder scan: No TODO/TBD placeholders.
- Type consistency: The canonical module already assigns only `API_ERROR_CODES.*` values to the tightened `ApiErrorCode` fields.
