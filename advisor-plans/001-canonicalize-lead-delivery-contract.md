# Plan 001: Canonicalize the email-first lead delivery contract in docs and lock it with a real failure-branch test

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a35dee1..HEAD -- src/lib/lead-pipeline/process-lead.ts .claude/rules/security.md docs/项目基础/行为合约.md tests/integration/api/lead-pipeline-real.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (docs + one additive test; no runtime code change)
- **Depends on**: none
- **Category**: bug (decision drift on the money path)
- **Planned at**: commit `a35dee1`, 2026-07-07

## Why this matters

This is a B2B lead-generation site; the inquiry/contact pipeline is the money
path. Three sources currently disagree about what "submission success" means
when the Airtable CRM write fails but the owner email succeeds:

- **Runtime code** (deliberate, reaffirmed 2026-07-06 in PR #26): success if
  *either* channel succeeds ("email-first-storage-optional").
- **`.claude/rules/security.md`** ("Lead-family behavior"): describes
  Airtable-first as the *target* contract ("Airtable failure returns failure
  and must not send email").
- **`docs/项目基础/行为合约.md`** BC-012A: claims "Lead sink handling remains
  Airtable-first" as *current proven behavior* — which is factually wrong today.

**The owner decided on 2026-07-07 that email-first is the canonical business
contract** (rationale: when the CRM is degraded, the lead must still reach the
owner's inbox rather than showing the buyer a failure). This plan aligns the two
stale documents to that decision and adds the missing highest-fidelity test:
the real end-to-end integration suite never exercises the Airtable-failure
branch, so the now-official contract is unproven at the route level.

## Current state

- `src/lib/lead-pipeline/process-lead.ts` — the shared lead pipeline. **Do not
  modify it.** Key excerpts confirming current behavior:

  ```ts
  // process-lead.ts:47
  const LEAD_DELIVERY_POLICY = "email-first-storage-optional" as const;

  // process-lead.ts:192-199 (processContact; processProduct at :293-300 is identical in shape)
  const [emailSent, recordCreated] = await Promise.all([
    sendContactOwnerEmail(lead, context),
    createContactLeadRecord(lead, context),
  ]);

  if (!emailSent && !recordCreated) {
    return createProcessingFailureResult(referenceId);
  }
  ```

  Newsletter (`processNewsletter`, :311-339) is Airtable-only and returns
  failure when the record write fails — that stays as is.

- `.claude/rules/security.md`, section "## Lead-family behavior" — currently
  reads (verbatim):

  ```text
  Target behavior for contact, inquiry, and subscribe:

  browser form -> route handler -> Zod -> Turnstile -> process lead -> Airtable first -> optional email

  - Airtable record creation is the business success condition.
  - Email failure after record creation returns user success and logs internally.
  - Airtable failure returns failure and must not send email.
  - User-facing `partialSuccess` is not part of the target contract.

  Until Phase 2/3 finishes, existing routes may still carry old wrappers. Do not
  copy those wrappers into new code.
  ```

  The two paragraphs after it (formula-injection neutralization; "update
  focused lead-family tests when changing behavior") are correct and must be
  kept unchanged.

- `docs/项目基础/行为合约.md`:
  - Line 26, row BC-012A: `| BC-012A | Lead sink handling remains
    Airtable-first; email failure after record creation is non-blocking. |
    lead pipeline and Airtable tests |`
  - Lines 58-68, section "## Lead pipeline policy": states the starter default
    is `storage-before-email`, then explicitly allows this exact change:
    "A derived project may deliberately change this to an email-best-effort
    policy, but that is a business decision. If changed, update the lead
    pipeline tests, operator docs, and replacement docs together."

- `tests/integration/api/lead-pipeline-real.test.ts` — the highest-fidelity
  money-path proof (real Zod, real `processLead`, real rate limiter; only
  `fetch` and the Airtable SDK are stubbed). Its `beforeEach` (:148-156)
  configures `airtableCreateMock` to always **succeed**; no test ever calls
  `airtableCreateMock.mockRejectedValue(...)`. Existing cases: valid inquiry
  (:173), invalid payload (:216), failed Turnstile (:230).

- The unit suite `src/lib/lead-pipeline/__tests__/process-lead.test.ts`
  already asserts email-first behavior (e.g. :248 "returns user success when
  contact owner email is sent and Airtable fails"). It matches the canonical
  decision — leave it alone.

- Historical design record (context only, do not edit):
  `docs/superpowers/specs/2026-07-06-lead-pipeline-parallel-delivery-design.md`
  explicitly noted "This change does not resolve that broader contract
  mismatch" — this plan is what resolves it.

- Error-code mapping for the inquiry route: `src/app/api/inquiry/route.ts`
  maps a failed `processLead` result to `API_ERROR_CODES.INQUIRY_VALIDATION_FAILED`
  when `error === "VALIDATION_ERROR"`, otherwise
  `API_ERROR_CODES.INQUIRY_PROCESSING_ERROR` (route.ts:173-174). Error codes
  are defined in `src/constants/api-error-codes.ts:98-102`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Focused lead proof | `pnpm exec vitest run tests/integration/api/lead-pipeline-real.test.ts` | all pass |
| Lead-family contract suite | `pnpm exec vitest run tests/integration/api/lead-family-contract.test.ts tests/integration/api/lead-family-protection.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts` | all pass |
| Full unit/integration | `pnpm test` | all pass |
| Prettier on docs | `pnpm exec prettier --check .claude/rules/security.md docs/项目基础/行为合约.md` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `.claude/rules/security.md` (the "Lead-family behavior" section only)
- `docs/项目基础/行为合约.md` (BC-012A row + "Lead pipeline policy" section only)
- `tests/integration/api/lead-pipeline-real.test.ts` (additive test cases only)
- `advisor-plans/README.md` (status row)

**Out of scope** (do NOT touch, even though they look related):
- `src/lib/lead-pipeline/process-lead.ts` — the code already implements the
  canonical contract; any code change here is a scope violation.
- `src/app/api/inquiry/route.ts`, `contact`, `subscribe` routes — unchanged.
- `src/lib/lead-pipeline/__tests__/process-lead.test.ts` — already correct.
- `docs/superpowers/**` — historical run records, never edited retroactively.

## Git workflow

- Branch from `main`: `advisor/001-lead-delivery-contract`
- Commit style: conventional commits, matching `git log` (e.g.
  `docs: canonicalize email-first lead delivery contract`,
  `test: prove airtable-failure branch in real lead pipeline proof`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rewrite the "Lead-family behavior" section in `.claude/rules/security.md`

Replace the quoted block shown in "Current state" (from "Target behavior for
contact, inquiry, and subscribe:" through "Do not copy those wrappers into new
code.") with:

```text
Canonical behavior for contact and inquiry (owner decision, 2026-07-07):

browser form -> route handler -> Zod -> Turnstile -> process lead -> parallel owner email + Airtable record

- Owner email and Airtable record creation start in parallel; either channel
  succeeding is the user-facing success condition (email-best-effort policy:
  a lead must never be rejected while at least one delivery channel works).
- When Airtable fails but email succeeds, the route returns success and the
  failure is logged as an error for manual CRM backfill.
- Both channels failing returns failure with a stable error code.
- Newsletter subscribe remains Airtable-only: record failure returns failure.
- User-facing `partialSuccess` is not part of the contract.
```

Keep the following two paragraphs (formula injection; focused lead-family
tests) exactly as they are.

**Verify**: `grep -n "Airtable failure returns failure and must not send email" .claude/rules/security.md` → no matches; `grep -n "email-best-effort" .claude/rules/security.md` → one match.

### Step 2: Update `docs/项目基础/行为合约.md`

1. Replace the BC-012A row text with:
   `| BC-012A | Lead delivery for contact and inquiry is parallel owner email + Airtable with either-channel success (email-best-effort); both channels failing returns failure. Newsletter remains Airtable-only. | src/lib/lead-pipeline/__tests__/process-lead.test.ts, tests/integration/api/lead-pipeline-real.test.ts |`
2. In "## Lead pipeline policy" (lines 58-68): keep the sentence describing the
   starter default, then replace the "A derived project may deliberately
   change..." paragraph with a record that this project **did** make that
   business decision: owner decision 2026-07-07, policy is
   `email-first-storage-optional` as implemented in
   `src/lib/lead-pipeline/process-lead.ts` (`LEAD_DELIVERY_POLICY`), design
   record `docs/superpowers/specs/2026-07-06-lead-pipeline-parallel-delivery-design.md`,
   rationale: CRM degradation must not lose buyer submissions; Airtable gaps
   are backfilled from the owner email using the logged `referenceId`.

**Verify**: `grep -n "remains Airtable-first" docs/项目基础/行为合约.md` → no matches.

### Step 3: Add the Airtable-failure case to the real integration proof

In `tests/integration/api/lead-pipeline-real.test.ts`, after the "failed
Turnstile" case, add (modeled on the valid-inquiry test at :173):

```ts
it("airtable failure: still succeeds and delivers the owner email", async () => {
  airtableCreateMock.mockRejectedValue(new Error("airtable down"));

  const response = await inquiryRoute.POST(
    makeInquiryRequest(VALID_INQUIRY_BODY),
  );
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.success).toBe(true);
  expect(body.data.referenceId).toMatch(/^PRO-/);
  expect(getResendCalls()).toHaveLength(1);
});
```

### Step 4: Add the both-channels-fail case

Also make the Resend call fail by overriding the fetch mock for
`RESEND_EMAILS_URL` (return `jsonResponse({...}, 500)` or throw — read the
`jsonResponse` helper at the top of the file and match its signature), keep
`airtableCreateMock.mockRejectedValue(...)`, then assert the route returns a
non-200 status with `body.success === false` and
`body.errorCode === API_ERROR_CODES.INQUIRY_PROCESSING_ERROR`. Read
`src/app/api/inquiry/route.ts:160-240` first to confirm the exact HTTP status
the route maps `PROCESSING_FAILED` to, and assert that status.

**Verify (steps 3-4)**: `pnpm exec vitest run tests/integration/api/lead-pipeline-real.test.ts` → all pass, including 2 new tests.

### Step 5: Run the full proof chain

**Verify**: the "Lead-family contract suite" command, then `pnpm test` → all pass; `pnpm exec prettier --check .claude/rules/security.md docs/项目基础/行为合约.md` → exit 0.

## Test plan

Covered by steps 3-4: the two missing failure-branch cases in
`tests/integration/api/lead-pipeline-real.test.ts`, modeled on the existing
valid-inquiry test in the same file. No other new tests.

## Done criteria

- [ ] `grep -rn "remains Airtable-first" docs/ .claude/` → no matches
- [ ] `grep -c "email-best-effort" .claude/rules/security.md` → ≥1
- [ ] `pnpm exec vitest run tests/integration/api/lead-pipeline-real.test.ts` exits 0 with 2 new tests
- [ ] `pnpm test` exits 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `process-lead.ts:47` no longer says `"email-first-storage-optional"`, or the
  `Promise.all` + either-success shape at :192-199/:293-300 is gone — the code
  drifted and the canonical decision must be re-confirmed with the owner.
- The new step-3 test fails because the route returns non-200 on Airtable
  failure — behavior differs from what this plan assumes; report the actual
  response instead of "fixing" either side.
- You find yourself wanting to edit `process-lead.ts` or a route handler.

## Maintenance notes

- Any future proposal to flip to Airtable-first is a business decision for the
  owner; it now requires updating security.md, 行为合约.md BC-012A, the unit
  suite, and the two integration tests added here — in the same branch.
- Reviewer should scrutinize: the security.md wording must not weaken the
  formula-injection or focused-test rules that follow the replaced block.
- Deferred: an operational "CRM backfill" checklist for the owner (finding the
  logged `referenceId` when Airtable was down) — docs-only, separate change.
