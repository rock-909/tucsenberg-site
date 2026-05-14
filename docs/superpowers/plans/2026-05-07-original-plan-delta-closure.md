# Original Plan Delta Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining practical gaps against the external remediation plan while preserving showcase starter capabilities.

**Architecture:** Remove narrow helper/residue layers only where current code proves they are no longer needed. Keep starter proof surfaces, Storybook, component governance, Cloudflare/OpenNext, and website docs. Prefer focused tests and source guards before broad verification.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, next-intl, Vitest, Playwright, OpenNext Cloudflare.

---

### Task 1: API lead helper and contact helper slimming

**Files:**
- Modify: `tests/architecture/lib-facade-boundary.test.ts`
- Modify: `src/app/api/inquiry/route.ts`
- Modify: `src/app/api/subscribe/route.ts`
- Modify: `src/lib/contact/submit-canonical-contact.ts`
- Delete: `src/lib/api/lead-route-response.ts`
- Delete: `src/lib/contact-form-error-utils.ts`

- [ ] **Step 1: Extend architecture guard**

Add `src/lib/api/lead-route-response.ts` and `src/lib/contact-form-error-utils.ts` to removed helper checks.

- [ ] **Step 2: Run guard and observe failure**

Run:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts
```

Expected: fails while those helper files/imports still exist.

- [ ] **Step 3: Inline lead route helpers**

Move these behaviors into the consuming routes:

- lead processing failure maps validation errors to route validation code and other errors to route processing code;
- successful lead result must have `referenceId`;
- Turnstile token validation still distinguishes missing token, service failure, and invalid token.

- [ ] **Step 4: Inline contact Zod issue mapping**

Move `mapZodIssueToErrorKey` into `src/lib/contact/submit-canonical-contact.ts` and remove the old import.

- [ ] **Step 5: Delete retired helper files through Trash-safe git deletion**

Use `apply_patch` delete hunks for the two helper files so the removal is reviewable in git.

- [ ] **Step 6: Run focused API verification**

Run:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts src/app/api/contact/__tests__/route.test.ts
```

Expected: all selected tests pass.

### Task 2: Middleware final slimming

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/__tests__/middleware-locale-cookie.test.ts`
- Modify: `tests/unit/middleware.test.ts`
- Modify: `tests/architecture/middleware-boundary.test.ts`

- [ ] **Step 1: Update tests for next-intl-only middleware**

Change middleware tests to assert:

- middleware delegates to next-intl;
- localized paths do not manually set `NEXT_LOCALE`;
- middleware does not emit `x-middleware-set-cookie`;
- matcher still excludes API/admin/ops/static paths;
- no request overrides, CSP, nonce, health, or security header ownership exists in middleware.

- [ ] **Step 2: Run tests and observe failure**

Run:

```bash
pnpm exec vitest run src/__tests__/middleware-locale-cookie.test.ts tests/unit/middleware.test.ts tests/architecture/middleware-boundary.test.ts
```

Expected: fails because middleware still has manual cookie logic.

- [ ] **Step 3: Simplify `src/middleware.ts`**

Remove locale extraction, secure cookie helper, manual cookie setting, and leaked middleware cookie cleanup. Keep only next-intl middleware plus existing matcher.

- [ ] **Step 4: Re-run focused middleware verification**

Run:

```bash
pnpm exec vitest run src/__tests__/middleware-locale-cookie.test.ts tests/unit/middleware.test.ts tests/architecture/middleware-boundary.test.ts
```

Expected: all selected tests pass.

### Task 3: Non-starter test residue cleanup

**Files:**
- Modify: `playwright.config.ts`
- Modify: `docs/specs/behavioral-contracts.md`
- Modify: `docs/guides/PROOF-BOUNDARY-MAP.md`
- Modify: `docs/guides/CANONICAL-TRUTH-REGISTRY.md`
- Modify: `tests/unit/scripts/proof-lane-contract.test.ts`
- Delete: `tests/semgrep/**`
- Delete: visual, Firefox diagnosis, bbox, and performance E2E specs/snapshots.

- [ ] **Step 1: Add/adjust proof guard**

Update `tests/unit/scripts/proof-lane-contract.test.ts` so active repo proof rejects the retired E2E and Semgrep paths.

- [ ] **Step 2: Run guard and observe failure**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts
```

Expected: fails while retired paths still exist or docs still reference them as active proof.

- [ ] **Step 3: Remove retired tests and active references**

Delete the retired paths and update docs to point at retained behavior tests:

- navigation/locale: `tests/e2e/navigation.spec.ts`, `tests/e2e/i18n.spec.ts`, `tests/e2e/no-js-html-contract.spec.ts`;
- lead/contact: `tests/e2e/contact-form-smoke.spec.ts`, `tests/e2e/smoke/post-deploy-form.spec.ts`;
- component governance: retained architecture/component tests.

- [ ] **Step 4: Simplify Playwright snapshot config if no visual snapshots remain**

Remove visual snapshot-specific config from `playwright.config.ts` if no remaining test uses `toHaveScreenshot` or `toMatchSnapshot`.

- [ ] **Step 5: Re-run proof guard**

Run:

```bash
pnpm exec vitest run tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
```

Expected: both pass.

### Task 4: CSP tightening

**Files:**
- Modify: `src/config/security.ts`
- Modify: `src/config/__tests__/security.test.ts`

- [ ] **Step 1: Add/adjust CSP tests**

Assert production `script-src` does not include generic `'unsafe-inline'`, production `script-src-elem` keeps the static App Router/RSC bootstrap allowance, `script-src-attr` is `'none'`, and style directives intentionally still keep inline allowances.

- [ ] **Step 2: Run security tests and observe failure**

Run:

```bash
pnpm exec vitest run src/config/__tests__/security.test.ts
```

Expected: fails while production `script-src` allows generic inline scripts or `script-src-attr` does not block inline event handlers.

- [ ] **Step 3: Tighten production script policy**

Keep development inline/eval behavior for dev tooling. Keep production `script-src` strict, retain `script-src-elem 'unsafe-inline'` for static Next.js App Router/RSC bootstrap payloads, and add `script-src-attr 'none'`.

- [ ] **Step 4: Re-run security tests**

Run:

```bash
pnpm exec vitest run src/config/__tests__/security.test.ts
```

Expected: pass.

### Task 5: Root i18n provider payload narrowing

**Files:**
- Modify: `src/lib/load-messages.ts`
- Modify: `src/lib/i18n/client-messages.ts`
- Modify: `src/app/[locale]/layout.tsx`
- Add or modify focused tests under `src/lib/i18n/__tests__/` or existing layout tests.

- [ ] **Step 1: Add a focused test**

Assert the layout/client-message path can load only the client namespaces without calling the complete message merge path.

- [ ] **Step 2: Run focused test and observe failure**

Run the relevant focused test.

- [ ] **Step 3: Implement client namespace message loading**

Add a helper that loads critical/deferred messages and returns only `getClientMessageNamespaces()` via `pickMessages`.

- [ ] **Step 4: Update layout**

Replace `loadCompleteMessages(locale)` plus `pickClientMessages(messages)` with the narrower client-message loader.

- [ ] **Step 5: Re-run focused i18n/layout tests**

Run the relevant focused tests and then `pnpm type-check`.

### Task 6: Broad verification

**Files:**
- No direct code changes expected.

- [ ] **Step 1: Run focused bundle**

Run:

```bash
pnpm exec vitest run tests/architecture/lib-facade-boundary.test.ts tests/architecture/middleware-boundary.test.ts tests/architecture/env-boundary.test.ts
pnpm exec vitest run src/app/api/inquiry/__tests__/route.test.ts tests/integration/api/subscribe.test.ts src/app/api/contact/__tests__/route.test.ts
pnpm exec vitest run src/config/__tests__/security.test.ts tests/unit/scripts/proof-lane-contract.test.ts tests/unit/scripts/current-truth-docs.test.ts
```

- [ ] **Step 2: Run broad local proof**

Run:

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm build
pnpm website:build:cf
```

- [ ] **Step 3: Update current report**

Update `docs/superpowers/current/starter-review-pro-reset-final-report.md` with this wave's exact changes and verification results.
