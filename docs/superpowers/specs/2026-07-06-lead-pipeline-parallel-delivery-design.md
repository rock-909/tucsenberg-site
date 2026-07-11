> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Lead Pipeline Parallel Delivery Design

## Context

The structural repair plan identifies S5 as an independent P3 change:
`processContact()` and `processProduct()` currently await owner email and
Airtable record creation in sequence, even though both delivery functions catch
their own errors and return booleans.

Documented S5 intent from `docs/audits/结构性修复计划-2026-07-05.md`:

- Keep `LEAD_DELIVERY_POLICY = "email-first-storage-optional"`.
- Treat either owner email success or Airtable record creation success as a
  successful user submission.
- Return failure only when both channels fail.
- Keep contact confirmation email scheduling after contact delivery succeeds.
- Preserve `ownerNotified` and `recordCreated` result fields.

Stable docs note: `.claude/rules/security.md` describes a future target behavior
where Airtable is the business success condition. Existing runtime code,
existing tests, and this S5 plan still use the current
`email-first-storage-optional` policy. This change does not resolve that broader
contract mismatch; it only removes unnecessary serial waiting while preserving
current behavior.

## Goal

Run the independent owner-email and Airtable delivery attempts in parallel for
contact and product leads without changing lead validation, logging, return
shape, or user-facing success semantics.

## Non-goals

- Do not change `/api/inquiry`, `/api/contact`, or route handler contracts.
- Do not change newsletter processing.
- Do not change the current `email-first-storage-optional` success policy.
- Do not introduce retries, queues, timeouts, or new delivery abstractions.

## Design

### Contact leads

`processContact()` will start these two promises together:

- `sendContactOwnerEmail(lead, context)`
- `createContactLeadRecord(lead, context)`

It will await both with `Promise.all()`, then keep the current decision:

- both false -> `PROCESSING_FAILED`
- either true -> success with `emailSent`, `ownerNotified`, and `recordCreated`
  reflecting each channel

`scheduleContactConfirmationEmail()` remains after the success decision, so
confirmation email is not scheduled when both primary channels fail.

### Product leads

`processProduct()` will do the same parallel `Promise.all()` for:

- `sendProductOwnerEmail(lead, context)`
- `createProductLeadRecord(lead, context)`

It keeps the existing success/failure decision and return shape.

## Test strategy

Add behavior tests that fail under serial awaiting and pass with parallel
delivery:

- contact owner email and Airtable record creation both start before either
  channel resolves;
- product owner email and Airtable record creation both start before either
  channel resolves.

Existing tests already cover:

- email success + Airtable failure -> user success;
- Airtable success + email failure -> user success;
- both fail -> controlled failure;
- contact confirmation email is scheduled only after contact success.

## Acceptance criteria

- Contact delivery starts both primary channels before waiting for either to
  finish.
- Product delivery starts both primary channels before waiting for either to
  finish.
- Existing result fields and success semantics are unchanged.
- `src/lib/lead-pipeline/__tests__/process-lead.test.ts` passes.
- Full `pnpm test` passes before merge.
