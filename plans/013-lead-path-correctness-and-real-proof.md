# Plan 013: Lead-path correctness — closed error union, one Turnstile classifier, and a real end-to-end integration proof

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. On
> any STOP condition, stop and report. When done, update `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 338df844..HEAD -- src/lib/lead-pipeline/process-lead.ts src/app/api/verify-turnstile/route.ts src/lib/security/turnstile-errors.ts tests/integration/api/`
> On any in-scope change since `338df844`, compare "Current state" excerpts
> against live code; on mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / tests
- **Planned at**: commit `338df844`, 2026-07-01

## Why this matters

The lead pipeline (public form → validation → rate limit → Turnstile → CRM +
email) is the feature this starter exists for, and it has three defects:

1. **Type-safety hole on a routing branch.** `LeadResult.error` is typed
   `"VALIDATION_ERROR" | "PROCESSING_FAILED" | string` — the `| string`
   widens the whole union to `string`, so the API routes' branch
   `result.error === "VALIDATION_ERROR"` (which decides 400 vs 500) has zero
   compiler protection against a typo'd or renamed sentinel.
2. **Two Turnstile failure classifiers.** `/api/verify-turnstile` has a
   route-local classifier that maps "secret missing" to 500, while the shared
   classifier used by contact/inquiry/subscribe maps the same condition to
   503. The repo's own rule (`.claude/rules/security.md`: "Keep Turnstile
   failure handling centralized") forbids exactly this divergence. The route
   also carries an unreachable network-error catch branch
   (`verifyTurnstileDetailed` never throws — it catches internally and
   returns structured results).
3. **No real end-to-end proof.** The suite that names itself the contract —
   `tests/integration/api/lead-family-contract.test.ts` — mocks
   `distributed-rate-limit`, `turnstile`, `process-lead`, AND `lead-schema`
   (its own comment: "This suite intentionally mocks the core protection and
   submission pipeline"), which violates the repo's testing rule
   (`.claude/rules/testing.md` lines 82-83: tests named integration/contract
   "must not mock away the core proof path while presenting themselves as
   primary proof"). A drift between the real schema output and what
   `process-lead` consumes passes green today.

## Current state

Verified at commit `338df844`:

- `src/lib/lead-pipeline/process-lead.ts:43`:

  ```ts
  error?: "VALIDATION_ERROR" | "PROCESSING_FAILED" | string | undefined;
  ```

- Consumers branching on the sentinel:
  `src/app/api/subscribe/route.ts:106` and
  `src/app/api/inquiry/route.ts:168` — `result.error === "VALIDATION_ERROR"`
  chooses the 400-vs-500 path.
- `src/app/api/verify-turnstile/route.ts:84-111` — route-local
  `isTurnstileNetworkError` (treats only `"network-error"`/`"timeout"` as
  service failure) + a config pre-check mapping missing secret to
  `TURNSTILE_NOT_CONFIGURED` (500). The shared classifier is
  `src/lib/security/turnstile-errors.ts:11` —
  `hasTurnstileServiceFailure(codes)` treats `not-configured`,
  `network-error`, and `timeout` as service-unavailable; lead routes consume
  it via `src/lib/security/lead-turnstile.ts` (~lines 65-72) → 503.
- `src/lib/security/turnstile.ts` (~lines 203-217) —
  `verifyTurnstileDetailed` catches network/timeout internally and always
  resolves `{ success: false, errorCodes }`; the route's `try/catch` →
  `createNetworkErrorResponse` (~lines 59-68, 113-129) is unreachable.
- `tests/integration/api/lead-family-contract.test.ts:11-44` — `vi.mock` of
  the four core modules listed above.
- Real-wire reference tests that already exist and show the stubbing
  pattern to follow:
  `src/lib/email/__tests__/resend-http-client.test.ts` (stubs `fetch`,
  asserts real HTTP request shape).
- Existing route tests: `src/app/api/inquiry/__tests__/route.test.ts`
  (652 lines), `src/app/api/verify-turnstile/__tests__/route.test.ts`
  (541 lines) — the latter asserts today's 500-on-not-configured behavior
  and must be updated when the classifier is unified.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm type-check` | exit 0 |
| Targeted tests | `pnpm exec vitest run src/app/api tests/integration/api src/lib/lead-pipeline` | all pass |
| Full tests | `pnpm test` | all pass |
| Lint | `pnpm lint:check` | exit 0 |

## Scope

**In scope**:
- EDIT: `src/lib/lead-pipeline/process-lead.ts` (type narrowing only — no
  behavior change)
- EDIT: any file the compiler flags after narrowing (expected: none or a
  couple of assignment sites; fix by using the union members, never by
  re-widening)
- EDIT: `src/app/api/verify-turnstile/route.ts`
- EDIT: `src/app/api/verify-turnstile/__tests__/route.test.ts`
- CREATE: `tests/integration/api/lead-pipeline-real.test.ts`

**Out of scope**:
- `tests/integration/api/lead-family-contract.test.ts` — keep it (it tests
  route branching cheaply); this plan ADDS the missing real proof beside it.
  Optionally rename its describe string to drop the word "contract" — a
  one-line change; do not restructure it.
- `src/lib/security/turnstile.ts`, `lead-turnstile.ts`,
  `distributed-rate-limit.ts` — behavior unchanged.
- `process-lead.ts` orchestration logic — only the type at line 43 changes.
- Airtable/Resend service internals.

## Git workflow

- Branch: `fix/lead-path-correctness`
- Commits: `fix: close LeadResult.error union`, `fix: unify turnstile failure
  classification`, `test: add real lead-pipeline integration proof`.

## Steps

### Step 1: Close the error union

In `process-lead.ts:43` change to:

```ts
error?: "VALIDATION_ERROR" | "PROCESSING_FAILED";
```

(with `exactOptionalPropertyTypes`, omit the property instead of assigning
`undefined` — repo convention per `.claude/rules/coding-standards.md`). Fix
whatever the compiler then flags; every fix must use a union member. If a
call site genuinely assigns a third value, STOP (see STOP conditions).

**Verify**: `pnpm type-check` → exit 0;
`pnpm exec vitest run src/lib/lead-pipeline src/app/api/inquiry src/app/api/subscribe` → all pass.

### Step 2: Unify Turnstile failure classification in verify-turnstile

In `src/app/api/verify-turnstile/route.ts`:
- Replace `isTurnstileNetworkError` and the config pre-check with the shared
  `hasTurnstileServiceFailure` from `@/lib/security/turnstile-errors`,
  mirroring how `lead-turnstile.ts` maps service failure → 503 with its
  stable error code.
- Delete the unreachable `try/catch` → `createNetworkErrorResponse` branch
  (and `createNetworkErrorResponse` itself if now unused).

Update `src/app/api/verify-turnstile/__tests__/route.test.ts`: the
missing-config case now expects 503 (service-unavailable semantics aligned
with the lead routes), network-error/timeout codes also 503 via the shared
classifier. Do not delete cases — retarget expected statuses/codes.

**Verify**: `pnpm exec vitest run src/app/api/verify-turnstile` → all pass.

### Step 3: Add the real integration proof

Create `tests/integration/api/lead-pipeline-real.test.ts`. Requirements:

- NO `vi.mock` of `lead-schema`, `process-lead`, `distributed-rate-limit`
  internals, or `turnstile` logic. Stub ONLY at the wire:
  - `global.fetch` (Turnstile siteverify + Resend HTTP) — follow the
    stubbing pattern in `src/lib/email/__tests__/resend-http-client.test.ts`;
  - the Airtable SDK boundary (`vi.mock("airtable", …)` capturing the create
    payload) — the SDK is the wire here;
  - rate-limit store: use the in-memory store the code already selects in
    test env (do not mock the limiter logic).
- Cases (minimum):
  1. Valid inquiry POST → 200-family response; assert the CAPTURED Airtable
     record field names/values and the Resend HTTP payload (to/subject/html
     or text presence) for the submitted lead.
  2. Invalid payload (e.g. bad email) → 400-family with the validation error
     code; assert NO Airtable/Resend calls happened.
  3. Turnstile siteverify replying failure → the route's documented rejection
     status; assert NO Airtable/Resend calls.
- Env: use the same env bootstrap the existing integration tests under
  `tests/integration/api/` use (copy their setup helper imports).

**Verify**: `pnpm exec vitest run tests/integration/api/lead-pipeline-real.test.ts` → all pass (3+ tests).

### Step 4: Full proof

**Verify**: `pnpm test` → all pass; `pnpm type-check && pnpm lint:check` → exit 0.

## Test plan

Step 3 IS the test plan's core. Also: Step 1 and 2 changes are covered by
retargeted existing suites. New test file models its structure on
`tests/integration/api/lead-family-contract.test.ts` (request construction)
but inverts the mocking philosophy (wire-only stubs).

## Done criteria

- [ ] `grep -n "| string" src/lib/lead-pipeline/process-lead.ts` → no match on the `error` field
- [ ] `grep -n "isTurnstileNetworkError\|createNetworkErrorResponse" src/app/api/verify-turnstile/route.ts` → no matches
- [ ] `tests/integration/api/lead-pipeline-real.test.ts` exists, ≥3 tests, no `vi.mock` of lead-schema/process-lead/turnstile/distributed-rate-limit
- [ ] `pnpm test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- Step 1 reveals a call site assigning an error value outside the two
  sentinels — that's a real hidden state; report it with the file:line, do
  not invent a third union member without maintainer signoff.
- Step 2's 503 alignment breaks a consumer that specifically distinguishes
  the widget route's 500 (search `TURNSTILE_NOT_CONFIGURED` consumers first;
  expected: tests only).
- Step 3 cannot run the real rate limiter in test env without Upstash
  credentials — check how `rate-limit-store` selects its in-memory/test store
  first; if a real network store is genuinely mandatory, STOP and report
  (do not mock the limiter to force it through).

## Maintenance notes

- The new real integration test becomes the primary lead-path proof; the
  mocked contract test stays as fast branch coverage. If the lead schema or
  Airtable field mapping changes, the real test is the one that should fail.
- Reviewer: scrutinize that Step 3's Airtable payload assertion checks FIELD
  NAMES (mapping regressions), not just call counts.
- Deferred (backlog): consolidating the three client-IP helpers is handled by
  Plan 010; Airtable email-field formula-sanitization gap (CORR-06,
  LOW-confidence) needs its own investigation.
