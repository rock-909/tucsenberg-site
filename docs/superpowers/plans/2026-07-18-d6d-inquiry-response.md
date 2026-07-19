> Historical.
>
> This plan implements `docs/superpowers/specs/2026-07-18-d6d-inquiry-response-design.md`.

# D6d Inquiry Response Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the shared inquiry success behavior, collapse Turnstile to one action contract, align the production gate with the live form, and replace misleading quote-time promises with the approved 12-hour reply meaning.

**Architecture:** Keep DOM reset in the existing `InquiryForm`, keep request and Turnstile lifecycle in `useLeadFormSubmission`, and make `INQUIRY_TURNSTILE_ACTION` the single browser/server action value. Update distributed public copy at its owned sources and regenerate the content manifest.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.7, TypeScript 6 strict, next-intl 4, Vitest, Playwright, Cloudflare Turnstile, OpenNext.

---

## Global constraints

- Work only in `.worktrees/m3-d6d` on `feat/m3-d6d-inquiry-response`, based on D6c exact SHA `e67fb86a4ed8fcdbe50fa15ae313883506dc61cd`.
- Use TDD: record the focused RED result before production edits, then the matching GREEN result.
- Ponytail full: reuse `InquiryForm`, `InquiryFormStatus`, `useLeadFormSubmission` and current tests. Do not add a form controller, response facade, configurable action registry or retry timer.
- Do not permanently delete files. Move retired files to macOS Trash; D6d should normally edit in place and leave legacy-stack deletion to D6e.
- Do not touch the main worktree or PR #102.
- Do not restore buyer phone/WhatsApp or touch the five R'12 deferrals.
- Do not start D6e until D6d is independently reviewed and `READY_FOR_CLUSTER`.

## Task 1: Prove and implement successful field reset

**Files:**
- Modify: `src/components/forms/__tests__/inquiry-form.test.tsx`
- Modify: `src/components/forms/inquiry-form.tsx`
- Modify: `tests/e2e/contact-submit-journey.spec.ts`
- Modify: `tests/e2e/product-interest-rfq-handoff.spec.ts`

- [ ] Add component tests that submit valid Contact and catalog contexts, assert the reference ID remains visible, and assert `fullName`, `email` and `message` are empty after success. The catalog case must start with an estimator-style `initialMessage` so a plain `form.reset()` would fail the test.
- [ ] Add failure and 429 cases that fill all three fields, return a decoded error, and assert their values remain unchanged. Complete a fresh mocked Turnstile challenge and prove another submit is accepted without advancing timers or reading local/session storage.
- [ ] Run `pnpm exec vitest run src/components/forms/__tests__/inquiry-form.test.tsx` and record that the new success-reset tests fail against the current implementation while the preservation tests describe current behavior.
- [ ] In `InquiryFormLive`, add a form ref and pass an `onSuccess` callback to the existing `useLeadFormSubmission` config. The callback must call `form.reset()` and then explicitly set the three named visible controls to `""`; do not move DOM names into the hook.
- [ ] Attach the ref to the existing `<form>`. Keep the success state, reference ID, attribution, honeypot and analytics paths unchanged.
- [ ] Update the two Playwright journeys to assert the three visible fields are empty after success. In the product journey, preserve the catalog payload assertion before checking the cleared controls.
- [ ] Run the focused Vitest file and both Playwright specs. Expected: all pass, with no clock-based cooldown setup.
- [ ] Commit with `fix: clear inquiry fields after confirmed success`.

## Task 2: Make Turnstile action a leaf constant

**Files:**
- Modify: `src/constants/turnstile-constants.ts`
- Modify: `src/components/security/turnstile.tsx`
- Modify: `src/components/forms/lazy-turnstile.tsx`
- Modify: `src/components/forms/inquiry-form.tsx`
- Modify: `src/components/forms/contact-form-container-view.tsx`
- Modify: `src/app/[locale]/request-quote/request-quote-submit-controls.tsx`
- Modify: `src/app/api/inquiry/route.ts`
- Modify: `src/lib/contact/submit-canonical-contact.ts`
- Modify: `src/lib/security/lead-turnstile.ts`
- Modify: `src/lib/security/turnstile.ts`
- Modify: `src/lib/security/turnstile-config.ts`
- Modify: Turnstile component, lazy wrapper, lead verifier, low-level verifier and route tests under their existing `__tests__` directories

- [ ] Add failing tests that assert the rendered widget receives `INQUIRY_TURNSTILE_ACTION`, the inquiry route does not supply an action argument, `verifyLeadTurnstile` forwards no configurable action, and a successful Cloudflare response is accepted only when its action equals the constant.
- [ ] Add a mismatch test using another action string and prove it returns `invalid-action`.
- [ ] Run the focused Turnstile suites and record RED against the current env/default/action-argument design.
- [ ] Export `INQUIRY_TURNSTILE_ACTION = "product_inquiry"` from `src/constants/turnstile-constants.ts`.
- [ ] Remove the optional `action` prop from the local Turnstile wrapper and lazy wrapper. Pass the constant to `@marsidev/react-turnstile` inside `TurnstileWidget`.
- [ ] Remove action arguments and action union types from `verifyLeadTurnstile`. Make `verifyTurnstileDetailed` validate the returned action directly against the constant; remove its one-use options object.
- [ ] Delete action parsing, allowed-action sets and expected-action fallback from `turnstile-config.ts`. Keep hostname configuration unchanged.
- [ ] Update the active and legacy callers to the smaller signatures. Do not create a compatibility overload.
- [ ] Run `pnpm exec vitest run src/components/security/__tests__/turnstile.test.tsx src/components/forms/__tests__/lazy-turnstile.test.tsx src/lib/security/__tests__/turnstile-config.test.ts src/lib/security/__tests__/lead-turnstile.test.ts src/lib/security/__tests__/turnstile-errors.test.ts src/app/api/inquiry/__tests__/route.test.ts src/lib/__tests__/cloudflare-runtime-env.test.ts`.
- [ ] Commit with `refactor: make inquiry turnstile action a single constant`.

## Task 3: Remove action env configuration and fix the production gate

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `src/lib/public-runtime-env.ts`
- Modify: `.env.example`
- Modify: `wrangler.jsonc`
- Modify: `playwright.config.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/cloudflare-deploy.yml`
- Modify: `.github/workflows/daily-e2e.yml`
- Modify: `scripts/quality/checks/production-config.js`
- Modify: `src/lib/__tests__/env.real-contract.test.ts`
- Modify: `src/lib/__tests__/public-runtime-env.test.ts`
- Modify: `tests/architecture/env-example-parity.test.ts`
- Modify: `tests/unit/scripts/validate-production-config.test.ts`
- Modify: `tests/unit/workflows/ci-preview-env.test.ts`
- Modify: `docs/项目基础/部署.md`
- Modify: `docs/项目基础/上线验证.md`

- [ ] Add failing env/workflow tests proving the three action env names are not part of the public/server schema, sample env, workflows, Wrangler or Playwright setup.
- [ ] Change production-config tests so missing `TURNSTILE_SECRET_KEY` or `NEXT_PUBLIC_TURNSTILE_SITE_KEY` fails production validation regardless of `CONTACT_FORM_CONFIG.features.enableTurnstile`.
- [ ] Run the env, workflow and production-config tests and record RED.
- [ ] Remove `NEXT_PUBLIC_TURNSTILE_ACTION`, `TURNSTILE_ALLOWED_ACTIONS` and `TURNSTILE_EXPECTED_ACTION` from code, test setup, workflows, Wrangler and live deployment docs. Keep allowed hosts and both Turnstile keys.
- [ ] Remove the production-config import/mock/branch on `CONTACT_FORM_CONFIG`; require the two live keys unconditionally in production. Leave the legacy `enableTurnstile` field itself for D6e, where the whole config engine is retired.
- [ ] Update build examples so they set only `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the public widget; do not replace the removed action env with another switch.
- [ ] Run `pnpm exec vitest run src/lib/__tests__/env.test.ts src/lib/__tests__/env.real-contract.test.ts src/lib/__tests__/public-runtime-env.test.ts src/lib/__tests__/cloudflare-runtime-env.test.ts tests/architecture/env-example-parity.test.ts tests/unit/scripts/validate-production-config.test.ts tests/unit/workflows/ci-preview-env.test.ts`.
- [ ] Commit with `refactor: remove turnstile action configuration`.

## Task 4: Align all public response promises

**Files:**
- Modify: `messages/profiles/b2b-lead/en/messages.json`
- Modify: `messages/profiles/catalog/en/messages.json`
- Modify: `content/pages/en/about.mdx`
- Modify: `content/pages/en/contact.mdx`
- Modify: `content/pages/en/flood-barrier-materials-guide.mdx`
- Modify: `content/pages/en/flood-barrier-specifications.mdx`
- Modify: `content/pages/en/oem-wholesale.mdx`
- Modify: `content/pages/en/terms.mdx`
- Modify: `src/config/single-site.ts`
- Modify: `src/constants/tucsenberg-product-meta.ts`
- Modify: `src/constants/tucsenberg-product-page-abs-flood-barriers.ts`
- Modify: `src/constants/tucsenberg-product-page-absorbent-flood-bags.ts`
- Modify: `src/constants/tucsenberg-product-page-aluminum-flood-gates.ts`
- Modify: `src/constants/tucsenberg-product-page-flood-tube-dams.ts`
- Modify: `src/constants/tucsenberg-product-page-frp-flood-barriers.ts`
- Modify: `src/components/security/turnstile-rescue-line.tsx`
- Modify: `src/lib/contact/getContactCopy.ts`
- Modify: `src/app/[locale]/request-quote/page.tsx`
- Modify: affected copy/render tests, including `tests/architecture/tucsenberg-site-contract.test.ts`
- Generate: `src/lib/content-manifest.generated.ts` from the content sources

- [ ] Add a live contract test limited to current runtime owners and message paths. Its failing fixtures must cover both word orders and hyphenated forms: `quote ... 12 hours`, `quoted ... within 12 hours`, `12-hour ... quote`, plus the corresponding forward/reverse `48-hour` custom-quote forms. Do not scan the disabled confirmation-email copy or unreferenced `requestQuote.form` subtree that D6e removes.
- [ ] Add positive assertions for the shared inquiry success message and key Contact/catalog surfaces using the approved meaning: reply within 12 hours; quote when details are sufficient; otherwise ask only for missing essentials.
- [ ] Run the focused contract/copy tests and record RED with the current misleading phrases.
- [ ] Rewrite the owned source copy. Use `Reply within 12 hours` for compact labels and the complete approved meaning where a sentence fits. Remove the separate standard/custom response-time split rather than renaming it.
- [ ] Update contact panel labels and fallbacks to describe response/next step, not a 12/48 quote table. Keep the public company phone panel untouched.
- [ ] Remove the two Request Quote hour constants and interpolation arguments that only served the retired 12/48 wording; read the new message directly.
- [ ] Update affected fixtures and render assertions to the new business meaning. Do not change unrelated product specifications, shipping times or quotation mechanics.
- [ ] Run `node scripts/starter-checks.js content-manifest` to regenerate `src/lib/content-manifest.generated.ts`; do not edit that file directly.
- [ ] Run `pnpm content:check` plus the affected page, product, metadata, structured-data and contract tests.
- [ ] Commit with `fix: align inquiry copy with the 12-hour reply promise`.

## Task 5: Record the live contract and verify D6d

**Files:**
- Modify: `docs/项目基础/行为合约.md`
- Modify: `docs/技术难题/整库审查2026-07/执行计划.md`
- Modify: `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`
- Modify: `docs/项目基础/文档清单.md`

- [ ] Update the behavior contract with successful field clearing, failure preservation, one Turnstile action and server-only rate-limit authority. Point each row at behavior tests, not implementation-shape assertions alone.
- [ ] Record D6b #138 and D6c #139 as `READY_FOR_CLUSTER`, D6d as the active branch, M3 merged still `26/33`, and D6e blocked until D6d reaches `READY_FOR_CLUSTER`.
- [ ] Add the D6d spec and plan to the document inventory as historical implementation records.
- [ ] Run the complete task evidence set:

```bash
pnpm exec vitest run \
  src/components/forms/__tests__/inquiry-form.test.tsx \
  src/lib/forms/__tests__/use-lead-form-submission.test.tsx \
  src/lib/forms/__tests__/lead-response.test.ts \
  src/components/security/__tests__/turnstile.test.tsx \
  src/components/forms/__tests__/lazy-turnstile.test.tsx \
  src/lib/security/__tests__/turnstile-config.test.ts \
  src/lib/security/__tests__/lead-turnstile.test.ts \
  src/lib/__tests__/env.test.ts \
  src/lib/__tests__/env.real-contract.test.ts \
  tests/architecture/env-example-parity.test.ts \
  tests/architecture/tucsenberg-site-contract.test.ts
CI=1 pnpm exec playwright test \
  tests/e2e/contact-submit-journey.spec.ts \
  tests/e2e/product-interest-rfq-handoff.spec.ts \
  --project=chromium
pnpm content:check
pnpm website:check
pnpm react:doctor
git diff --check e67fb86a4ed8fcdbe50fa15ae313883506dc61cd...HEAD
```

- [ ] Commit the contract/status update with `docs: record d6d inquiry response contract`.
- [ ] Return `DONE` or `DONE_WITH_CONCERNS` to Codex. Do not push, open a PR, merge or start D6e; Codex performs independent spec and quality review first.

## Plan self-review

- [x] Every behavior requirement has a RED/GREEN proof.
- [x] DOM reset stays in the form; the request hook remains DOM-agnostic.
- [x] Turnstile action has one constant and no replacement config switch.
- [x] The production gate follows the live always-protected form.
- [x] Active no-cooldown behavior is proved without refactoring D6e-owned dead code.
- [x] Distributed public copy is updated at source and the generated manifest is refreshed.
- [x] Disabled email copy and the unreferenced `requestQuote.form` subtree remain for D6e deletion rather than receiving throwaway edits.
- [x] D6e legacy-stack deletion, buyer phone/WhatsApp and owner-deferred launch items remain out of scope.
