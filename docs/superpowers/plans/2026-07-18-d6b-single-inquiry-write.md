> Historical.
>
> Historical implementation plan.
>
> This plan implements `docs/superpowers/specs/2026-07-18-d6b-single-inquiry-write-design.md`.

# D6b Single Inquiry Write Path Implementation Plan

**Goal:** Make `/api/inquiry` the only lead-writing endpoint, validate each request once, preserve the active security chain, and retire the old Contact route business implementation without pulling D6c-D6e forward.

**Base:** `origin/main` merge `96af3549`; branch `feat/m3-d6b-single-write`; worktree `.worktrees/m3-d6a`.

**Status (2026-07-18):** Implementation complete locally on `feat/m3-d6b-single-write`. Focused suites and `pnpm website:check` green. Not pushed; not `READY_FOR_CLUSTER`.

## Global constraints

- Use behavior-first/TDD execution: add focused failing behavior tests before production changes, then implement the smallest root fix.
- Ponytail full: no new dependency, framework, repository layer, handler registry, endpoint configuration, or permanent adapter.
- Do not permanently delete files. Move retired files to macOS Trash; do not use `rm`, `git rm`, `git clean`, or equivalents.
- Do not modify the main worktree or PR #102.
- Do not start D6c, D6d, or D6e.
- Do not restore buyer phone/WhatsApp. Do not touch the five R'12 owner deferrals.

## Task 1: Record live status and lock the single-writer contract

**Modify:**
- `docs/superpowers/plans/2026-07-17-m3-clustered-execution.md`
- `docs/技术难题/整库审查2026-07/执行计划.md`
- architecture tests for lead write endpoints

- [x] Record D5a PR #137 merged at `96af3549`, M3 `26/33`, Cluster 3A `CLOSED`, Cluster 3B `ACTIVE`, D6b `ACTIVE`.
- [x] Add a positive architecture test that discovers production form endpoints and proves they all resolve to `/api/inquiry`.
- [x] Add a contract proving `/api/contact` cannot import or call JSON parsing, Turnstile, rate-limit lead presets, contact submission, `processLead`, email, or Airtable.
- [x] Keep this as a live positive ownership check, not a list of old deleted names.

## Task 2: Add RED tests for parse-once and structural validation

**Modify:** inquiry route tests, inquiry integration tests, validation-detail tests, pipeline tests.

- [x] Add a real-service-mocked route test proving one `safeParseJson`, one `productLeadSchema.safeParse`, and one `processValidatedInquiry` call for a valid request.
- [x] Prove invalid requests return 400 details before Turnstile/delivery and can never become a downstream 500 validation error.
- [x] Add mapper tests where code/path/limits/reason stay equal but English `message` changes; detail output must remain equal.
- [x] Prove emitted detail keys equal `PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS` in both directions and exist under `inquiry.form`, not `contact.form`.
- [x] Add a rate-limit integration assertion that the surviving route uses the `inquiry` preset.
- [x] Run the focused tests and preserve the expected RED evidence before implementation.

## Task 3: Introduce the typed pipeline entry without duplicating delivery

**Modify:**
- `src/lib/lead-pipeline/process-lead.ts`
- relevant pipeline tests

- [x] Extract the already-valid processing core so it owns reference ID generation, logging, delivery dispatch, and processing-error containment once.
- [x] Export `processValidatedInquiry(input: ProductLeadInput, options?)` and route it directly to the shared core without Zod.
- [x] Keep `processLead(rawInput, options?)` as the temporary validating legacy boundary for D6e-owned callers/tests.
- [x] Do not export a generic interface or add a wrapper that only forwards arguments.
- [x] Prove typed inquiry processing never calls `leadSchema.safeParse` while raw `processLead` still rejects invalid input.

## Task 4: Make the inquiry route the single secure boundary

**Modify:**
- `src/app/api/inquiry/route.ts`
- `src/components/forms/inquiry-form.tsx`
- `src/components/forms/inquiry-payload.ts`
- `src/lib/api/inquiry-validation-details.ts`
- `src/lib/api/validation-error-details.ts`
- inquiry route/integration tests

- [x] Parse JSON once and adapt the legacy RFQ field shape once.
- [x] Add one accessible-safe hidden `website` honeypot to the shared InquiryForm and include it in the inquiry payload. It must not be focusable or announced as a buyer field.
- [x] Extract `website` before schema input construction. A non-empty honeypot returns a success-shaped synthetic reference and skips Turnstile and delivery.
- [x] Validate the canonical product/general inquiry once and pass the typed value to `processValidatedInquiry`.
- [x] Normalize missing/required reasons into structured issue data at the boundary; remove every validation mapping read of `issue.message`.
- [x] Preserve Turnstile, attribution, sanitized logs, response envelopes, and delivery failure behavior.
- [x] Delete the now-unreachable `VALIDATION_ERROR` response branch from the typed route path.

## Task 5: Retire the Contact route business branch safely

**Modify/move to Trash as proven:**
- `src/app/api/contact/route.ts`
- Contact route-only tests
- Contact-specific rate-limit preset/tests
- security/cloudflare/behavior/maintenance docs

- [x] Confirm again that active Contact and Request Quote production paths post `/api/inquiry`; legacy `useContactForm` is not production-reachable.
- [x] Move the old Contact business route implementation and route-only tests to Trash.
- [x] Replace it only with a minimal temporary `410 Gone` tombstone because historical Cloudflare access logs are unavailable. The tombstone returns one stable machine error and performs no parsing, Turnstile, rate limiting, or delivery.
- [x] Remove the Contact-specific distributed rate-limit preset and tests that claim it is an active writer.
- [x] Update live docs/rules to say `/api/inquiry` is the only writer and `/api/contact` is a temporary non-writing tombstone owned for final removal by D6e.
- [x] Do not remove the duplicate Contact frontend/config files; D6e owns that proof-backed retirement.

## Task 6: Focused behavior and browser verification

- [x] Run inquiry route, integration, mapper, pipeline, lead-family, architecture, rate-limit, and affected docs tests.
- [x] Run Contact and Request Quote browser submission journeys and prove both network requests target `/api/inquiry`. *(Playwright `contact-submit-journey.spec.ts` + `product-interest-rfq-handoff.spec.ts`: 4/4 passed via repo `playwright.config.ts` webServer `pnpm build && pnpm start`.)*
- [x] Run `pnpm website:check`.
- [x] Run `git diff --check`, inspect the final diff, and verify no phone/WhatsApp field or R'12 owner item was added.
- [x] Commit `refactor: make api inquiry the single validated lead write path`.
- [ ] Push, open one PR, wait for exact-SHA CI, perform Cursor self-review, and mark `READY_FOR_CLUSTER` with evidence.
- [ ] Continue to D6c only after D6b is integrated into the Cluster 3B stack; do not request task-level Codex acceptance.
