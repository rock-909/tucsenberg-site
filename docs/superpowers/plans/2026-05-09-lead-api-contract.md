# Lead API Contract Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Return safe validation details from the lead-family APIs and preserve the buyer-entered contact subject through lead processing.

**Architecture:** Extend the shared API response helper first, then update each lead entrypoint to return safe `details` without changing success semantics. Keep the subject fix inside the canonical contact and lead pipeline boundary so Airtable and email receive the same owner-facing value.

**Tech Stack:** Next.js 16 App Router route handlers, React 19 hooks, TypeScript strict mode, Zod 4, Vitest, pnpm.

---

## Working rules

- Work only in `/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings`.
- Do not edit the main checkout at `/Users/Data/workspace/showcase-website-starter`.
- Do not permanently delete files.
- Use `apply_patch` for manual edits.
- Use TDD: write the failing test, run it, implement the smallest code change, run it again.
- Keep commits small. Commit after each task passes its focused tests.
- Run `pnpm build` and `pnpm website:build:cf` sequentially if they are used later; do not run them in parallel.

## File structure

- Modify: `src/lib/api/api-response.ts`
  - Owns the shared success/error response envelope.
- Create: `src/lib/api/__tests__/api-response.test.ts`
  - Proves optional `details` are included only when supplied.
- Create: `src/lib/api/validation-error-details.ts`
  - Maps Zod issues into safe field-level detail keys for lead API validation errors.
- Modify: `src/app/api/contact/route.ts`
  - Returns contact validation details from both the cheap payload validation path and canonical submission failure path.
- Modify: `src/components/forms/use-contact-form.ts`
  - Preserves API `details` in browser form state.
- Modify: `src/app/api/inquiry/route.ts`
  - Returns safe details for product inquiry validation failures.
- Modify: `src/app/api/subscribe/route.ts`
  - Returns safe details for missing and invalid newsletter email.
- Modify: `tests/integration/api/lead-family-contract.test.ts`
  - Updates the auxiliary lead-family response contract to include newsletter validation details.
- Modify: `src/constants/validation-limits.ts`
  - Adds lead subject length constants.
- Modify: `src/constants/index.ts`
  - Re-exports lead subject length constants.
- Modify: `src/lib/lead-pipeline/lead-schema.ts`
  - Changes contact `subject` from enum to sanitized free text.
- Modify: `src/lib/contact/submit-canonical-contact.ts`
  - Stops mapping buyer-entered contact subject to an enum.
- Modify: `src/lib/lead-pipeline/process-lead.ts`
  - Keeps original subject flowing to Airtable and owner email, while omitting the subject property when absent.
- Modify tests:
  - `src/app/api/contact/__tests__/route.test.ts`
  - `src/components/forms/__tests__/use-contact-form.test.tsx`
  - `src/app/api/inquiry/__tests__/route.test.ts`
  - `src/app/api/subscribe/__tests__/route.test.ts`
  - `src/lib/__tests__/contact-form-processing.test.ts`
  - `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`
  - `src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts`
  - `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
  - `src/lib/__tests__/airtable-create-operations.test.ts`

---

### Task 1: Confirm route-handler docs and extend the shared API response contract

**Files:**
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Modify: `src/lib/api/api-response.ts`
- Create: `src/lib/api/__tests__/api-response.test.ts`

- [ ] **Step 1: Re-read the installed Next.js route-handler docs**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
```

Expected: the local docs print route-handler guidance from the installed Next.js package.

- [ ] **Step 2: Write the failing API response tests**

Create `src/lib/api/__tests__/api-response.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { HTTP_BAD_REQUEST } from "@/constants";
import { createApiErrorResponse } from "../api-response";

describe("createApiErrorResponse", () => {
  it("keeps the existing public error shape when details are absent", async () => {
    const response = createApiErrorResponse(
      API_ERROR_CODES.INVALID_REQUEST,
      HTTP_BAD_REQUEST,
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.INVALID_REQUEST,
    });
  });

  it("includes safe validation details when details are supplied", async () => {
    const response = createApiErrorResponse(
      API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      HTTP_BAD_REQUEST,
      { details: ["errors.email.invalid"] },
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      details: ["errors.email.invalid"],
    });
  });

  it("omits empty validation details", async () => {
    const response = createApiErrorResponse(
      API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      HTTP_BAD_REQUEST,
      { details: [] },
    );

    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
    });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run src/lib/api/__tests__/api-response.test.ts
```

Expected: FAIL because `createApiErrorResponse()` does not accept the third argument yet.

- [ ] **Step 4: Implement optional details in the shared helper**

Update `src/lib/api/api-response.ts` with this shape:

```ts
export interface ApiErrorResponse {
  success: false;
  errorCode: ApiErrorCode;
  details?: string[];
}

export interface ApiErrorResponseOptions {
  details?: string[];
}

function createApiErrorBody(
  errorCode: ApiErrorCode,
  options?: ApiErrorResponseOptions,
): ApiErrorResponse {
  const body: ApiErrorResponse = { success: false, errorCode };

  if (options?.details && options.details.length > 0) {
    body.details = options.details;
  }

  return body;
}

export function createApiErrorResponse(
  errorCode: ApiErrorCode,
  status: number,
  options?: ApiErrorResponseOptions,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(createApiErrorBody(errorCode, options), { status });
}
```

Keep the existing imports and `createApiSuccessResponse()` unchanged.

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run src/lib/api/__tests__/api-response.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/api/api-response.ts src/lib/api/__tests__/api-response.test.ts
git commit -m "feat: support api validation details"
```

---

### Task 2: Return contact validation details and preserve them in browser state

**Files:**
- Modify: `src/app/api/contact/__tests__/route.test.ts`
- Modify: `src/components/forms/__tests__/use-contact-form.test.tsx`
- Modify: `src/app/api/contact/route.ts`
- Modify: `src/components/forms/use-contact-form.ts`

- [ ] **Step 1: Add failing contact route tests**

In `src/app/api/contact/__tests__/route.test.ts`, update the existing invalid payload test so it expects details:

```ts
  it("rejects invalid payload before canonical contact submission", async () => {
    const response = await POST(
      createContactRequest({
        ...createValidContactBody(),
        email: "not-an-email",
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      details: ["errors.email.invalid"],
    });
    expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
  });
```

Add this test after the Turnstile failure test:

```ts
  it("returns canonical contact validation details when canonical submission fails with details", async () => {
    vi.mocked(submitCanonicalContactSubmission).mockResolvedValueOnce({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      error: "Validation failed",
      details: ["errors.message.tooShort"],
      data: null,
    });

    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      details: ["errors.message.tooShort"],
    });
  });
```

- [ ] **Step 2: Add the failing browser hook test**

In `src/components/forms/__tests__/use-contact-form.test.tsx`, add this test after the success-state test:

```ts
  it("preserves validation details returned by the contact API", async () => {
    global.fetch = vi.fn(async () =>
      Response.json(
        {
          success: false,
          errorCode: "CONTACT_VALIDATION_FAILED",
          details: ["errors.email.invalid"],
        },
        { status: 400 },
      ),
    );

    const { result } = renderHook(() => useContactForm());

    act(() => {
      result.current.setTurnstileToken("valid-token");
    });

    await act(async () => {
      await result.current.formAction(createValidFormData());
    });

    await waitFor(() => {
      expect(result.current.state).toMatchObject({
        success: false,
        errorCode: "CONTACT_VALIDATION_FAILED",
        details: ["errors.email.invalid"],
      });
    });
    expect(result.current.submitStatus).toBe("error");
  });
```

- [ ] **Step 3: Run the contact tests to verify they fail**

Run:

```bash
pnpm exec vitest run \
  src/app/api/contact/__tests__/route.test.ts \
  src/components/forms/__tests__/use-contact-form.test.tsx
```

Expected: FAIL because route and hook do not propagate details yet.

- [ ] **Step 4: Update the contact route**

In `src/app/api/contact/route.ts`, add this local helper near the imports:

```ts
function createValidationDetailOptions(
  details: string[] | null,
): { details: string[] } | undefined {
  return details && details.length > 0 ? { details } : undefined;
}
```

Update the payload validation failure branch:

```ts
    return createApiErrorResponse(
      payloadValidation.errorCode,
      payloadValidation.statusCode ?? HTTP_BAD_REQUEST,
      createValidationDetailOptions(payloadValidation.details),
    );
```

Update the canonical submission failure branch:

```ts
      return createApiErrorResponse(
        submission.errorCode,
        submission.statusCode ?? HTTP_BAD_REQUEST,
        createValidationDetailOptions(submission.details),
      );
```

- [ ] **Step 5: Update the browser hook**

In `src/components/forms/use-contact-form.ts`, update `ContactApiErrorResponse`:

```ts
interface ContactApiErrorResponse {
  success: false;
  errorCode?: string;
  details?: string[];
}
```

Add this helper near `createContactStateFromResponse()`:

```ts
function createContactErrorState(
  payload: ContactApiErrorResponse,
  timestamp: string,
): ServerActionResult<ContactFormResult> {
  const errorState: ServerActionResult<ContactFormResult> = {
    success: false,
    errorCode: payload.errorCode,
    timestamp,
  };

  if (payload.details && payload.details.length > 0) {
    errorState.details = payload.details;
  }

  return errorState;
}
```

Update the failure return in `createContactStateFromResponse()`:

```ts
  return createContactErrorState(payload, timestamp);
```

- [ ] **Step 6: Run the focused contact tests**

Run:

```bash
pnpm exec vitest run \
  src/app/api/contact/__tests__/route.test.ts \
  src/components/forms/__tests__/use-contact-form.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add \
  src/app/api/contact/route.ts \
  src/app/api/contact/__tests__/route.test.ts \
  src/components/forms/use-contact-form.ts \
  src/components/forms/__tests__/use-contact-form.test.tsx
git commit -m "fix: preserve contact validation details"
```

---

### Task 3: Return newsletter validation details

**Files:**
- Modify: `src/app/api/subscribe/__tests__/route.test.ts`
- Modify: `tests/integration/api/lead-family-contract.test.ts`
- Modify: `src/app/api/subscribe/route.ts`

- [ ] **Step 1: Update failing subscribe route tests**

In `src/app/api/subscribe/__tests__/route.test.ts`, update the missing email expected body:

```ts
    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_REQUIRED,
      details: ["errors.email.required"],
    });
```

Update the invalid email expected body:

```ts
    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_INVALID,
      details: ["errors.email.invalid"],
    });
```

- [ ] **Step 2: Update the auxiliary family contract test**

In `tests/integration/api/lead-family-contract.test.ts`, update the subscribe missing email expected body:

```ts
    expect(body).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_REQUIRED,
      details: ["errors.email.required"],
    });
```

- [ ] **Step 3: Run the newsletter tests to verify they fail**

Run:

```bash
pnpm exec vitest run \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
```

Expected: FAIL because `/api/subscribe` still omits details.

- [ ] **Step 4: Add newsletter details in the route**

In `src/app/api/subscribe/route.ts`, add constants near the Turnstile service failure constants:

```ts
const SUBSCRIBE_EMAIL_REQUIRED_DETAILS = ["errors.email.required"];
const SUBSCRIBE_EMAIL_INVALID_DETAILS = ["errors.email.invalid"];
```

Update the missing email branch:

```ts
      return createApiErrorResponse(
        API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_REQUIRED,
        HTTP_BAD_REQUEST,
        { details: SUBSCRIBE_EMAIL_REQUIRED_DETAILS },
      );
```

Update the invalid email branch:

```ts
      return createApiErrorResponse(
        API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_INVALID,
        HTTP_BAD_REQUEST,
        { details: SUBSCRIBE_EMAIL_INVALID_DETAILS },
      );
```

Do not add details to Turnstile failures or processing failures.

- [ ] **Step 5: Run the focused newsletter tests**

Run:

```bash
pnpm exec vitest run \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add \
  src/app/api/subscribe/route.ts \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
git commit -m "fix: return subscribe validation details"
```

---

### Task 4: Return product inquiry validation details

**Files:**
- Create: `src/lib/api/validation-error-details.ts`
- Modify: `src/app/api/inquiry/__tests__/route.test.ts`
- Modify: `src/app/api/inquiry/route.ts`

- [ ] **Step 1: Add failing inquiry validation assertions**

In `src/app/api/inquiry/__tests__/route.test.ts`, update the invalid email test body assertion:

```ts
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        details: ["errors.email.invalid"],
      });
```

Update the missing product identity test body assertion:

```ts
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        details: ["errors.productSlug.required", "errors.productName.required"],
      });
```

Update the non-positive numeric quantity test body assertion:

```ts
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        details: ["errors.quantity.invalid"],
      });
```

- [ ] **Step 2: Run the inquiry route test to verify it fails**

Run:

```bash
pnpm exec vitest run src/app/api/inquiry/__tests__/route.test.ts
```

Expected: FAIL because `/api/inquiry` still returns only `errorCode`.

- [ ] **Step 3: Create the validation detail mapper**

Create `src/lib/api/validation-error-details.ts`:

```ts
import { type ZodIssue } from "zod";

export type ValidationFieldErrorKeys = Partial<Record<string, string>>;

const FALLBACK_VALIDATION_DETAIL = "errors.generic";

function getBaseValidationKey(
  issue: ZodIssue,
  fieldKeys: ValidationFieldErrorKeys,
): string {
  const [rawField] = issue.path;
  if (typeof rawField !== "string") {
    return FALLBACK_VALIDATION_DETAIL;
  }

  return fieldKeys[rawField] ?? FALLBACK_VALIDATION_DETAIL;
}

function isRequiredMinimum(issue: ZodIssue): boolean {
  return (
    "minimum" in issue &&
    typeof issue.minimum === "number" &&
    issue.minimum <= 1
  );
}

export function mapZodIssueToValidationDetail(
  issue: ZodIssue,
  fieldKeys: ValidationFieldErrorKeys,
): string {
  const baseKey = getBaseValidationKey(issue, fieldKeys);

  switch (issue.code) {
    case "too_small":
      return isRequiredMinimum(issue)
        ? `${baseKey}.required`
        : `${baseKey}.tooShort`;
    case "too_big":
      return `${baseKey}.tooLong`;
    case "invalid_type":
      return `${baseKey}.invalid`;
    case "custom":
      return `${baseKey}.invalid`;
    default:
      return baseKey === FALLBACK_VALIDATION_DETAIL
        ? FALLBACK_VALIDATION_DETAIL
        : `${baseKey}.invalid`;
  }
}

export function mapZodIssuesToValidationDetails(
  issues: readonly ZodIssue[],
  fieldKeys: ValidationFieldErrorKeys,
): string[] {
  return Array.from(
    new Set(
      issues.map((issue) => mapZodIssueToValidationDetail(issue, fieldKeys)),
    ),
  );
}
```

- [ ] **Step 4: Update the inquiry route validation result**

In `src/app/api/inquiry/route.ts`, import the mapper:

```ts
import {
  mapZodIssuesToValidationDetails,
  type ValidationFieldErrorKeys,
} from "@/lib/api/validation-error-details";
```

Add these types and constants near the Turnstile constants:

```ts
interface ProductLeadValidationSuccess {
  success: true;
  data: ProductLeadInput;
}

interface ProductLeadValidationFailure {
  success: false;
  details: string[];
}

type ProductLeadValidationResult =
  | ProductLeadValidationSuccess
  | ProductLeadValidationFailure;

const PRODUCT_INQUIRY_FIELD_ERROR_KEYS: ValidationFieldErrorKeys = {
  fullName: "errors.fullName",
  email: "errors.email",
  company: "errors.company",
  productSlug: "errors.productSlug",
  productName: "errors.productName",
  quantity: "errors.quantity",
  requirements: "errors.requirements",
};
```

Replace `validateLeadData()` with:

```ts
function validateLeadData(data: Record<string, unknown>): ProductLeadValidationResult {
  const parsed = productLeadSchema.safeParse({
    type: LEAD_TYPES.PRODUCT,
    fullName: data.fullName,
    productSlug: data.productSlug,
    productName: data.productName,
    quantity: data.quantity,
    requirements: data.requirements,
    email: data.email,
    company: data.company,
    marketingConsent: data.marketingConsent,
  });

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
    };
  }

  return {
    success: false,
    details: mapZodIssuesToValidationDetails(
      parsed.error.issues,
      PRODUCT_INQUIRY_FIELD_ERROR_KEYS,
    ),
  };
}
```

Update the POST handler validation branch:

```ts
      const leadValidation = validateLeadData(data);
      if (!leadValidation.success) {
        return createApiErrorResponse(
          API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
          HTTP_BAD_REQUEST,
          { details: leadValidation.details },
        );
      }
```

Update the `processLead` call:

```ts
      const result = await processLead({
        ...leadValidation.data,
      });
```

- [ ] **Step 5: Run the focused inquiry test**

Run:

```bash
pnpm exec vitest run src/app/api/inquiry/__tests__/route.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run the API helper and family contract tests**

Run:

```bash
pnpm exec vitest run \
  src/lib/api/__tests__/api-response.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add \
  src/lib/api/validation-error-details.ts \
  src/app/api/inquiry/route.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
git commit -m "fix: return inquiry validation details"
```

---

### Task 5: Change contact lead subject from enum to safe free text

**Files:**
- Modify: `src/constants/validation-limits.ts`
- Modify: `src/constants/index.ts`
- Modify: `src/lib/lead-pipeline/lead-schema.ts`
- Modify: `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts`

- [ ] **Step 1: Update lead schema tests for free-text subject**

In `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`, remove `CONTACT_SUBJECTS` from the import list.

Set `validContactLead.subject` to:

```ts
      subject: "Product inquiry",
```

Set the minimal contact lead subject to:

```ts
        subject: "General question",
```

Replace the invalid-subject test with:

```ts
    it("should reject contact lead with too-short subject", () => {
      const invalidLead = { ...validContactLead, subject: "Hey" };
      const result = contactLeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });
```

Replace the valid subject enum test with:

```ts
    it("should accept buyer-entered subject text", () => {
      const lead = {
        ...validContactLead,
        subject: "Need custom distributor website quote",
      };

      const result = contactLeadSchema.safeParse(lead);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subject).toBe(
          "Need custom distributor website quote",
        );
      }
    });
```

Update remaining contact lead fixtures in this file so every `subject` is a human-readable string:

```ts
        subject: "General question",
```

- [ ] **Step 2: Update lead schema property tests**

In `src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts`, remove `CONTACT_SUBJECTS` from the import list.

Add this arbitrary near the date constants:

```ts
const contactSubjectArb = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9 .,'-]{4,79}$/);
```

Update `contactLeadArb`:

```ts
    subject: contactSubjectArb,
```

Update the invalid email test contact subject:

```ts
          subject: "General question",
```

- [ ] **Step 3: Run the lead schema tests to verify they fail**

Run:

```bash
pnpm exec vitest run \
  src/lib/lead-pipeline/__tests__/lead-schema.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts
```

Expected: FAIL because `contactLeadSchema` still expects enum values.

- [ ] **Step 4: Add subject length constants**

In `src/constants/validation-limits.ts`, add:

```ts
export const MIN_LEAD_SUBJECT_LENGTH = 5 as const;
export const MAX_LEAD_SUBJECT_LENGTH = 100 as const;
```

In `src/constants/index.ts`, add these exports to the validation-limits export list:

```ts
  MIN_LEAD_SUBJECT_LENGTH,
  MAX_LEAD_SUBJECT_LENGTH,
```

- [ ] **Step 5: Update the contact lead schema**

In `src/lib/lead-pipeline/lead-schema.ts`, update the constants import:

```ts
  MAX_LEAD_SUBJECT_LENGTH,
  MIN_LEAD_SUBJECT_LENGTH,
```

Replace the contact `subject` schema with:

```ts
  subject: sanitizedString()
    .min(MIN_LEAD_SUBJECT_LENGTH)
    .max(MAX_LEAD_SUBJECT_LENGTH)
    .optional(),
```

Keep `CONTACT_SUBJECTS` exported. It remains available for category-like consumers, but it no longer defines the owner-facing contact `subject`.

- [ ] **Step 6: Run the focused lead schema tests**

Run:

```bash
pnpm exec vitest run \
  src/lib/lead-pipeline/__tests__/lead-schema.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add \
  src/constants/validation-limits.ts \
  src/constants/index.ts \
  src/lib/lead-pipeline/lead-schema.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts
git commit -m "fix: accept contact subject text"
```

---

### Task 6: Preserve contact subject through canonical submission, lead processing, Airtable, and email

**Files:**
- Modify: `src/lib/__tests__/contact-form-processing.test.ts`
- Modify: `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
- Modify: `src/lib/__tests__/airtable-create-operations.test.ts`
- Modify: `src/lib/contact/submit-canonical-contact.ts`
- Modify: `src/lib/lead-pipeline/process-lead.ts`

- [ ] **Step 1: Update canonical contact tests**

In `src/lib/__tests__/contact-form-processing.test.ts`, remove `CONTACT_SUBJECTS` from the imports.

Replace the first test with:

```ts
  it("passes buyer-entered subject text to the lead pipeline", async () => {
    mockProcessLead.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-custom",
    });

    await submitCanonicalContactSubmission(
      createContactFormData("Custom project setup"),
      { clientIP: "203.0.113.10" },
    );

    expect(mockProcessLead).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Custom project setup",
      }),
      {},
    );
  });
```

Update the legacy abbreviation test assertion:

```ts
    expect(mockProcessLead).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `${legacyManufacturingTerm} packaging`,
      }),
      {},
    );
```

- [ ] **Step 2: Add lead processing subject test**

In `src/lib/lead-pipeline/__tests__/process-lead.test.ts`, remove `CONTACT_SUBJECTS` from the import and set `validContactLead.subject` to:

```ts
    subject: "Product inquiry",
```

Add this test after the contact owner email failure test:

```ts
  it("passes buyer-entered contact subject to Airtable and owner email", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-subject" });
    mockSendContactFormEmail.mockResolvedValue("email-subject");
    const buyerSubject = "Need custom distributor website quote";

    const result = await processLead({
      ...validContactLead,
      subject: buyerSubject,
    });

    expect(result.success).toBe(true);
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.CONTACT,
      expect.objectContaining({
        subject: buyerSubject,
      }),
    );
    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: buyerSubject,
      }),
    );
  });
```

- [ ] **Step 3: Add Airtable subject mapping test**

In `src/lib/__tests__/airtable-create-operations.test.ts`, add this test inside `describe("创建 Lead 记录 (contact type)", () => {` after the successful creation test:

```ts
    it("should write buyer-entered contact subject to Airtable Subject", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);
      const buyerSubject = "Need custom distributor website quote";
      const leadDataWithSubject = {
        ...validLeadData,
        subject: buyerSubject,
      };
      const mockRecordData = {
        id: "rec-subject",
        fields: leadDataWithSubject,
        createdTime: "2023-01-01T00:00:00Z",
      };
      mockCreate.mockResolvedValue([createMockRecord(mockRecordData)]);

      await service.createLead("contact", leadDataWithSubject);

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            Subject: buyerSubject,
          }),
        },
      ]);
    });
```

- [ ] **Step 4: Run subject-flow tests to verify they fail**

Run:

```bash
pnpm exec vitest run \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/lib/lead-pipeline/__tests__/process-lead.test.ts \
  src/lib/__tests__/airtable-create-operations.test.ts
```

Expected: FAIL because canonical contact submission still maps subject to enum.

- [ ] **Step 5: Update canonical contact submission**

In `src/lib/contact/submit-canonical-contact.ts`, remove `CONTACT_SUBJECTS` from the import:

```ts
import { LEAD_TYPES } from "@/lib/lead-pipeline/lead-schema";
```

Delete `mapSubjectToEnum()`.

Add this helper near `isCanonicalContactFailure()`:

```ts
function createSubjectInput(
  subject: string | undefined,
): { subject: string } | Record<string, never> {
  const trimmedSubject = subject?.trim();
  return trimmedSubject ? { subject: trimmedSubject } : {};
}
```

Update `leadInput` inside `processValidatedContactSubmission()`:

```ts
  const leadInput = {
    type: LEAD_TYPES.CONTACT,
    fullName: formData.fullName || "Unknown",
    email: formData.email,
    company: formData.company,
    ...createSubjectInput(formData.subject),
    message: formData.message,
    turnstileToken: formData.turnstileToken,
    submittedAt: formData.submittedAt,
    marketingConsent: formData.marketingConsent ?? false,
  };
```

- [ ] **Step 6: Update processLead to omit absent optional subject**

In `src/lib/lead-pipeline/process-lead.ts`, add this helper near `createContactEmailData()`:

```ts
function createOptionalSubject(
  subject: string | undefined,
): { subject: string } | Record<string, never> {
  return subject ? { subject } : {};
}
```

Update `createContactEmailData()` so subject is conditionally included:

```ts
  return {
    firstName,
    lastName,
    email: lead.email,
    ...(company ? { company } : {}),
    ...createOptionalSubject(lead.subject),
    message: lead.message,
    submittedAt: lead.submittedAt || new Date().toISOString(),
    marketingConsent: lead.marketingConsent,
  };
```

Update the contact Airtable payload in `processContact()` so subject is conditionally included:

```ts
    await airtableService.createLead(LEAD_TYPES.CONTACT, {
      firstName,
      lastName,
      email: lead.email,
      company: lead.company,
      ...createOptionalSubject(lead.subject),
      message: lead.message,
      marketingConsent: lead.marketingConsent,
      referenceId,
    });
```

- [ ] **Step 7: Run focused subject-flow tests**

Run:

```bash
pnpm exec vitest run \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/lib/lead-pipeline/__tests__/process-lead.test.ts \
  src/lib/__tests__/airtable-create-operations.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add \
  src/lib/contact/submit-canonical-contact.ts \
  src/lib/lead-pipeline/process-lead.ts \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/lib/lead-pipeline/__tests__/process-lead.test.ts \
  src/lib/__tests__/airtable-create-operations.test.ts
git commit -m "fix: preserve contact subject text"
```

---

### Task 7: Final verification and branch readiness

**Files:**
- No source files added in this task unless a verification failure exposes a real defect from the previous tasks.

- [ ] **Step 1: Run all focused tests from the spec**

Run:

```bash
pnpm exec vitest run \
  src/lib/api/__tests__/api-response.test.ts \
  src/app/api/contact/__tests__/route.test.ts \
  src/components/forms/__tests__/use-contact-form.test.tsx \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.property.test.ts \
  src/lib/lead-pipeline/__tests__/process-lead.test.ts \
  src/lib/__tests__/airtable-create-operations.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/subscribe/__tests__/route.test.ts \
  tests/integration/api/lead-family-contract.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type-check**

Run:

```bash
pnpm type-check
```

Expected: PASS with Next route types generated and TypeScript reporting no errors.

- [ ] **Step 3: Run lint**

Run:

```bash
pnpm lint:check
```

Expected: PASS with zero warnings.

- [ ] **Step 4: Run the full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 5: Check git status**

Run:

```bash
git status --short --branch
```

Expected: branch is `superpowers/contact-audit-findings`; no unstaged or uncommitted implementation changes remain.

- [ ] **Step 6: Stop if final verification exposes a new defect**

If Step 1 through Step 4 exposes a new defect, stop and report:

- the failing command;
- the exact failure;
- the files likely responsible;
- whether the fix belongs to one of Tasks 1-6 or needs a plan update.

Expected: no unplanned code change is made from this final verification task without a fresh decision.

---

## Plan self-review

### Spec coverage

- Contact validation details are covered by Task 2.
- Browser state details are covered by Task 2.
- Subscribe validation details are covered by Task 3.
- Inquiry validation details are covered by Task 4.
- Contact subject free-text schema is covered by Task 5.
- Contact subject flow to canonical submission, lead processing, Airtable, and email is covered by Task 6.
- Existing Airtable-first success and email-failure behavior are protected by existing tests rerun in Tasks 4, 6, and 7.

### Open-marker scan

No open work markers or incomplete sections remain.

### Type consistency

The plan uses one shared response extension: `ApiErrorResponse.details?: string[]` and `createApiErrorResponse(errorCode, status, options?)`. Route-level validation details stay as `string[]`, and optional response fields are omitted when empty.
