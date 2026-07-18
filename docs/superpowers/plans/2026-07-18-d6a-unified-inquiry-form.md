> Historical.
>
> This plan implements `docs/superpowers/specs/2026-07-18-d6a-unified-inquiry-form-design.md`. Stable product truth remains in current project docs and runtime code.

# D6a Unified Three-Field Inquiry Form Implementation Plan

**Spec:** `docs/superpowers/specs/2026-07-18-d6a-unified-inquiry-form-design.md`

**Goal:** Put one fixed, low-friction, three-field inquiry form on Contact and Request Quote without creating a universal form engine or prematurely deleting the legacy stack reserved for D6e.

**Base:** `origin/main` merge `747fd8d`; branch `feat/m3-d6a-inquiry-form`; worktree `.worktrees/m3-d6a`.

## Global constraints

- Use Superpowers execution order and TDD: observe focused RED, implement the smallest behavior, rerun GREEN.
- Ponytail full: prefer direct fixed JSX and existing helpers; no new dependencies, flags, descriptors, generic schema/render engines, or speculative extension points.
- Never permanently delete files. D6a should not retire legacy form files; D6e owns that later.
- Do not modify PR #102 or the main worktree.
- Do not remove or weaken public company phone config, Contact panel, JSON-LD, or strict launch checks.
- Do not start D5a, D6b, or D6c in this PR.

## Task 1: Record the new live state and add failing contract tests

**Modify:**
- `docs/技术难题/整库审查2026-07/执行计划.md`
- `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`
- new shared form/page tests under `src/components/forms/__tests__` and the Contact/Request Quote page test folders

- [x] Update accounting to C2 merged/ACCEPTED, M3 `24/33`, D6a active, D5a waiting. Do not claim public launch readiness.
- [x] Add RED tests for both page modes rendering exactly `fullName`, `email`, `message`; the first two required and message optional.
- [x] Assert no `phone`, no `type=tel`, and no company/subject/product selector/quantity/dimensions/country/port/budget/upload/multi-step controls.
- [x] Assert identical labels and autocomplete attributes in both page modes.
- [x] Assert the static fallback contains the security/JavaScript explanation and public email, with no `<form>` and no submit button.
- [x] Run only the new/focused tests and capture the expected RED before production edits.

## Task 2: Create the single copy and response contracts

**Create or modify as runtime truth requires:**
- `messages/profiles/b2b-lead/en/messages.json`
- a small typed inquiry copy reader near the shared form
- a shared inquiry response decoder/result type near the shared form
- relevant message/type tests

- [x] Add one `inquiry.form` namespace for shared labels, optional marker, submit/status text, privacy text, no-JS explanation, context label, and three error-class summaries.
- [x] Derive one typed `InquiryFormCopy` from that namespace; both pages must consume it rather than copy values into separate constants.
- [x] Decode API outcomes into `success`, `field`, `security`, or `server` states using stable response fields/error codes, not English message matching.
- [x] Preserve returned field-detail keys for D5a, but do not implement D5a field-level rendering here.
- [x] Run message and decoder tests; run `pnpm content:check` after the physical pack change.

## Task 3: Implement the fixed InquiryForm and truthful static fallback

**Create:**
- `src/components/forms/inquiry-form.tsx`
- `src/components/forms/inquiry-form-static-fallback.tsx`
- `src/components/forms/__tests__/inquiry-form.test.tsx`

- [x] Implement explicit JSX for the three controls. Do not map a field descriptor array and do not read `CONTACT_FORM_CONFIG`.
- [x] Keep the endpoint hard-coded to `/api/inquiry`; use `useLeadFormSubmission` only for its existing lifecycle behavior.
- [x] Build the canonical body with `productInquiryKind: "general-rfq"`, `fullName`, `email`, optional normalized `message`, the verified Turnstile token, capped buyer-interest context when present, and existing attribution appended by the hook.
- [x] Use the inquiry Turnstile action required by `/api/inquiry`; do not perform the later D6d env/constant retirement.
- [x] Support one explicit `source` union for analytics (`contact` vs `rfq`) and page-specific surrounding content only. Endpoint, fields, validation behavior, decoder, success/error UI, and Turnstile lifecycle stay shared.
- [x] Render `InquiryFormStaticFallback` before hydration so no-JS users never see a fake disabled form. The fallback is an informational Card with the real public email alternative, not a `<form>`.
- [x] Add component tests for blank optional message, Enter submission, token guard, duplicate-submit guard preservation, response classes, success reference ID, and reset behavior already owned by the hook.

## Task 4: Preserve and expose URL handoff context safely

**Modify:** shared InquiryForm tests and the current Request Quote handoff tests/E2E.

- [x] Read `?interest=` only in Request Quote mode. Cap it using the canonical buyer-interest limit, display the capped value as untrusted context, and submit it only as `buyerInterest`; never turn it into `catalogProductId` or an internal selector.
- [x] Read `?config=` only in Request Quote mode. Cap it, set it as the initial visible textarea value, and let the buyer edit or clear it.
- [x] Ensure normal Contact and Request Quote submissions work with no URL context.
- [x] Add tests for overlong interest/config, visible estimator summary, buyer edits, and absence of forged product identity.

## Task 5: Wire both pages to the same active component

**Modify:**
- Contact page composition (`contact-page-sections.tsx` and its focused tests)
- Request Quote page composition and focused tests
- Contact/RFQ smoke and handoff E2E specs
- client message selection only if the chosen copy delivery genuinely needs it

- [x] Contact renders `InquiryForm` in `contact` mode and no longer loads the legacy `ContactFormContainer` active path.
- [x] Request Quote renders the same `InquiryForm` in `request-quote` mode and no longer renders the legacy `RequestQuoteForm` active path.
- [x] Keep page-specific heading, SEO, contact card, response guidance, and request-quote explanatory content outside the form.
- [x] Update active E2E routes/selectors from `/api/contact` and old company/subject fields to `/api/inquiry` and the three-field contract.
- [x] Preserve public company phone surfaces byte-for-byte where practical; explicitly inspect their diff before handoff.
- [x] Do not move legacy source/tests to Trash in this task. Record them as D6e retirement candidates only.

## Task 6: Verification, PR, and stop point

- [x] Run focused Vitest for the shared form, Contact page, Request Quote page, response decoder, submission hook, and URL handoffs.
- [x] Run focused Playwright for Contact submit, Request Quote, product-interest handoff, estimator handoff, no-JS, mobile/autofill/keyboard behavior.
- [x] Run `pnpm content:check` and `pnpm component:check`.
- [x] Run `pnpm website:check`, then `pnpm build`; do not run build variants in parallel.
- [x] Run `git diff --check`, inspect `git status -sb`, and confirm no public company phone production surface was removed.
- [x] Review follow-up: keep InquiryForm source import checks in Vitest; run `node scripts/starter-checks.js inquiry-form-client-chunk` only after a fresh `pnpm build` (CI Cloudflare build lane + pre-push build-check).
- [x] Commit `feat: use one low-friction inquiry form across contact and request quote`.
- [x] Push, open one PR, wait for exact-SHA CI, and leave `READY_FOR_CLUSTER` with changed files, test evidence, screenshots/DOM evidence, known concerns, and explicit statement that M3 stays `24/33` until D6a merges.
- [ ] Stop. Do not merge and do not start D5a; Codex performs independent task-level acceptance first.
