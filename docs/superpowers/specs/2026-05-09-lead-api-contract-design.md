# Lead API Contract and Contact Subject Preservation Design

## Context

The AI smell audit found two related lead-submission contract problems:

1. `/api/contact` computes field-level validation details but drops them before the response reaches the browser.
2. Contact form `subject` is buyer-entered free text, but the canonical contact path maps it into an internal enum before lead processing. Airtable and owner email can therefore receive a system category instead of the buyer's actual wording.

The user selected the broader repair option: unify the lead-family API error contract for `contact`, `inquiry`, and `subscribe`, instead of applying a narrow `/api/contact` patch.

This work happens in the isolated Superpowers worktree:

`/Users/Data/.config/superpowers/worktrees/showcase-website-starter/contact-audit-findings`

## Goal

Make lead submission failures easier for visitors to correct and make submitted lead data more truthful for the site owner.

The target result:

- Contact, product inquiry, and newsletter subscription APIs can return safe field-level validation details.
- The contact form browser state preserves those details so the existing feedback UI can render them.
- Buyer-entered contact `subject` remains the original safe text through lead processing, Airtable, and owner email.
- Existing security, rate limit, Turnstile, Airtable-first success, and email-failure behavior remain unchanged.

## Non-goals

- Do not rebuild the full lead pipeline.
- Do not change Cloudflare, OpenNext, preview, deploy, or build configuration.
- Do not change the market-page contact handoff behavior.
- Do not introduce a new form framework.
- Do not change all API routes in the project; this round is limited to the lead-family write endpoints: `/api/contact`, `/api/inquiry`, and `/api/subscribe`.
- Do not expose raw Zod messages, raw user input, Turnstile provider details, stack traces, or internal processing logs to the browser.
- Do not add a new Airtable field unless the existing Airtable mapping already supports it safely.

## Current behavior

### Contact validation details

`src/lib/contact/submit-canonical-contact.ts` maps validation issues into safe translation keys such as:

- `errors.email.invalid`
- `errors.message.tooShort`
- `errors.acceptPrivacy.required`

The contact API route calls `validateContactSubmissionPayload()`, but returns through `createApiErrorResponse(errorCode, status)`, whose current response shape is only:

```json
{
  "success": false,
  "errorCode": "CONTACT_VALIDATION_FAILED"
}
```

The browser hook `src/components/forms/use-contact-form.ts` also models API errors without `details`, so even if the API returned details, they would not reach `contact-form-feedback.tsx`.

### Product inquiry and subscription validation

`/api/inquiry` and `/api/subscribe` validate request bodies before Turnstile and lead processing, but their validation failures return only an error code. This creates three slightly different lead API contracts for the same family of visitor-facing write endpoints.

### Contact subject

`src/lib/contact/submit-canonical-contact.ts` currently maps free-text contact subjects into `CONTACT_SUBJECTS` before calling `processLead()`.

That means a buyer's original wording can be replaced with values such as:

- `product_inquiry`
- `distributor`
- `custom_project`
- `other`

This loses sales context.

## Proposed design

### 1. Extend the shared API error response shape

Update `src/lib/api/api-response.ts` so `ApiErrorResponse` supports optional validation details:

```ts
interface ApiErrorResponse {
  success: false;
  errorCode: ApiErrorCode;
  details?: string[];
}
```

Update `createApiErrorResponse()` to accept optional details. The function should omit the `details` property when no safe details exist. With `exactOptionalPropertyTypes`, callers should not pass or serialize `details: undefined`.

The public contract becomes:

```json
{
  "success": false,
  "errorCode": "CONTACT_VALIDATION_FAILED",
  "details": ["errors.email.invalid"]
}
```

### 2. Return details only for safe validation failures

Lead-family APIs should return details only when the failure is a visitor-correctable validation issue.

Allowed examples:

- missing required field
- invalid email
- message too short
- subject length invalid
- invalid product inquiry shape

Not allowed:

- raw submitted text
- raw Zod issue text
- Turnstile vendor error codes
- internal exception messages
- Airtable or email provider failure details
- stack traces

### 3. Contact route details

In `src/app/api/contact/route.ts`:

- When `validateContactSubmissionPayload()` fails, return its `details`.
- When `submitCanonicalContactSubmission()` returns a failure with details, return those details.
- Preserve existing status code selection and error code mapping.
- Keep JSON body parsing, rate limiting, CORS, and unexpected-error handling unchanged.

### 4. Inquiry route details

In `src/app/api/inquiry/route.ts`:

- Replace the current boolean/null validation helper with a result that can carry safe details.
- Continue validating before Turnstile.
- Validation failures return `INQUIRY_VALIDATION_FAILED` plus safe details.
- Processing failures still return either `INQUIRY_VALIDATION_FAILED` or `INQUIRY_PROCESSING_ERROR` according to the existing `LeadResult` mapping.

The details can be field-level keys such as:

- `errors.fullName.required`
- `errors.email.invalid`
- `errors.productName.required`
- `errors.quantity.invalid`

The exact key list should be implemented in a small route/helper mapper and covered by tests. Unknown Zod issues should fall back to `errors.generic`.

### 5. Subscribe route details

In `src/app/api/subscribe/route.ts`:

- Missing email returns `SUBSCRIBE_VALIDATION_EMAIL_REQUIRED` plus `["errors.email.required"]`.
- Invalid email returns `SUBSCRIBE_VALIDATION_EMAIL_INVALID` plus `["errors.email.invalid"]`.
- Turnstile remains checked only after email validation passes.
- Processing failures keep the existing public error code behavior.

### 6. Browser contact form state

In `src/components/forms/use-contact-form.ts`:

- Add `details?: string[]` to `ContactApiErrorResponse`.
- Pass `payload.details` into the returned `ServerActionResult`.
- Keep network failure behavior as `FORM_NETWORK_ERROR` without details.

`src/components/forms/contact-form-feedback.tsx` already knows how to render `state.details`; this change should make the existing UI path work instead of creating a new UI.

### 7. Preserve buyer-entered contact subject

Change the contact lead contract so `subject` is the buyer-entered safe text, not the derived enum.

Implementation direction:

- In `src/lib/lead-pipeline/lead-schema.ts`, make contact `subject` a sanitized optional or bounded string instead of `CONTACT_SUBJECTS` enum.
- If a derived category remains useful, introduce `subjectCategory?: ContactSubjectCategory`.
- In `src/lib/contact/submit-canonical-contact.ts`, pass `formData.subject` through as `subject`.
- Do not call `mapSubjectToEnum()` to populate the public `subject` value.
- If `mapSubjectToEnum()` remains, use it only to populate `subjectCategory`; otherwise remove it.

Downstream behavior:

- `src/lib/lead-pipeline/process-lead.ts` sends the original subject to owner email.
- `src/lib/airtable/service-internal/lead-records.ts` writes the original subject to Airtable `Subject`.
- `src/lib/email/email-data-schema.ts` continues accepting `subject` as string.

This preserves the owner's sales context without requiring Airtable schema changes.

## Acceptance criteria

### Contact validation details

Given a visitor submits `/api/contact` with an invalid email, when the API responds, then the response is HTTP 400 with:

```json
{
  "success": false,
  "errorCode": "CONTACT_VALIDATION_FAILED",
  "details": ["errors.email.invalid"]
}
```

Given `/api/contact` rejects a body for missing or invalid visitor fields, when the browser hook receives the API response, then `state.details` contains the safe validation keys.

Given the contact feedback component renders a validation failure with details, then the visitor sees translated field-level messages instead of a generic-only failure.

### Contact subject preservation

Given a visitor enters `Need custom distributor website quote` as contact subject, when the contact lead is processed, then Airtable and owner email receive `Need custom distributor website quote` as the subject.

Given a contact subject happens to include words such as `custom`, `project`, or `distributor`, when the lead is processed, then those words must not cause the submitted subject to be replaced by an enum.

### Product inquiry validation details

Given a visitor submits `/api/inquiry` with an invalid request body, when the API responds, then the response is HTTP 400 with `INQUIRY_VALIDATION_FAILED` and safe field-level details.

Given `/api/inquiry` receives invalid field data, when validation fails, then Turnstile verification and lead processing are not called.

### Newsletter validation details

Given a visitor submits `/api/subscribe` without email, when the API responds, then the response is HTTP 400 with `SUBSCRIBE_VALIDATION_EMAIL_REQUIRED` and `["errors.email.required"]`.

Given a visitor submits `/api/subscribe` with an invalid email, when the API responds, then the response is HTTP 400 with `SUBSCRIBE_VALIDATION_EMAIL_INVALID` and `["errors.email.invalid"]`.

Given `/api/subscribe` receives invalid email data, when validation fails, then Turnstile verification and lead processing are not called.

### Unchanged lead safety and success rules

Given Airtable record creation succeeds and owner email fails, when a lead endpoint responds, then the visitor still receives success.

Given Airtable record creation fails, when a lead endpoint responds, then the visitor receives a processing failure and owner email is not sent.

Given Turnstile fails, when a lead endpoint responds, then no validation details expose Turnstile provider internals.

## Test plan

Use TDD during implementation. Add or update failing tests before each implementation change.

Focused tests:

- `src/app/api/contact/__tests__/route.test.ts`
  - invalid payload includes `details`
  - canonical failure with details returns them
- `src/components/forms/__tests__/use-contact-form.test.tsx`
  - API error details are preserved in hook state
- `src/lib/__tests__/contact-form-processing.test.ts`
  - buyer-entered subject reaches `processLead()` unchanged
- `src/lib/lead-pipeline/__tests__/lead-schema.test.ts`
  - contact subject accepts safe free text and rejects invalid bounds
- `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
  - Airtable and owner email receive original subject
- `src/app/api/inquiry/__tests__/route.test.ts`
  - invalid product inquiry returns safe details and skips Turnstile/processLead
- `src/app/api/subscribe/__tests__/route.test.ts`
  - missing/invalid email return details and skip Turnstile/processLead

Validation commands after implementation:

```bash
pnpm exec vitest run \
  src/app/api/contact/__tests__/route.test.ts \
  src/components/forms/__tests__/use-contact-form.test.tsx \
  src/lib/__tests__/contact-form-processing.test.ts \
  src/lib/lead-pipeline/__tests__/lead-schema.test.ts \
  src/lib/lead-pipeline/__tests__/process-lead.test.ts \
  src/app/api/inquiry/__tests__/route.test.ts \
  src/app/api/subscribe/__tests__/route.test.ts
```

Then:

```bash
pnpm type-check
pnpm lint:check
pnpm test
```

If implementation touches Next.js route-handler semantics beyond ordinary response payload shape, read the installed Next.js route-handler docs again before editing.

## Rollout notes

This is a source-compatible public response extension: existing clients that only read `success` and `errorCode` keep working. New clients can read `details`.

The highest-risk change is the contact lead schema changing `subject` from enum to safe free text. Tests must prove the contact form path, lead pipeline, Airtable mapping, and email data path agree on the new meaning.

## Spec self-review

### Placeholder scan

No placeholder markers or incomplete sections remain.

### Internal consistency

The design keeps `errorCode` as the stable public error contract and adds `details` only as an optional extension. The subject design is consistent across contact submission, lead schema, processLead, Airtable, and email.

### Scope check

The scope is one implementation plan: lead-family API validation details plus contact subject preservation. It excludes unrelated Cloudflare, deployment, all-API, and UI redesign work.

### Ambiguity check

The main ambiguity is whether to persist a derived subject category. The chosen rule is explicit: preserve buyer-entered `subject` as the owner-facing value; `subjectCategory` is optional and must not require Airtable schema changes.
