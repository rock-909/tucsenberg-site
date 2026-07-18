> Historical.
>
> This plan implements `docs/superpowers/specs/2026-07-18-d5a-a11y-correctness-design.md`. Current product truth remains in stable project docs and runtime code.

# D5a Accessibility Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining buyer-visible accessibility and contrast defects on the fixed three-field InquiryForm without changing the inquiry contract or expanding the legacy form stack.

**Architecture:** Reuse the existing server detail codes and client `fieldDetails` state, then map only recognized visible-field errors into the shared form DOM. Keep color truth in CSS, non-CSS color snapshots in the static bridge, and accessible labels in the `accessibility` message namespace. Prefer direct props and existing component boundaries over new abstractions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6 strict, Tailwind CSS 4, next-intl 4, Radix Primitives, Vitest, Testing Library, Playwright, axe, Cloudflare OpenNext.

---

## 0. Execution contract

- Worktree: `/Users/Data/code/tucsenberg-site/.worktrees/m3-d5a`
- Branch: `feat/m3-d5a-a11y`
- Exact base: `a23f30ca457f65aa0bcab008147fb8039e6e1f14`
- Task: D5a
- Cluster: 3A
- Commit: `fix: a11y correctness batch with field-level form errors`
- PR state after green CI: `READY_FOR_CLUSTER`
- Do not merge. Codex performs Cluster 3A acceptance on the exact tip.

Read before editing:

```text
docs/项目基础/行为合约.md
.claude/rules/coding-standards.md
.claude/rules/code-quality.md
.claude/rules/i18n.md
.claude/rules/security.md
.claude/rules/ui.md
.claude/rules/testing.md
DESIGN.md
docs/design/设计真相.md
docs/design/色彩系统.md
docs/项目基础/维护规则.md
```

Hard boundaries:

- Keep `fullName` and `email` required; keep `message` optional.
- No buyer phone/WhatsApp or `input[type="tel"]`.
- Do not modify inquiry routes, schemas, rate limits, legacy Contact retirement, or D7a fallback cleanup.
- Do not add a form engine, new state layer, general field-error abstraction, or browser import of `STATIC_THEME_COLORS`.
- Move removed files to Trash; do not use permanent deletion commands. This task should not need file deletion.
- `pnpm build` and `pnpm website:build:cf` must run serially.

## 1. File map

### Form behavior

- Modify: `src/components/forms/inquiry-form.tsx`
- Modify: `src/components/forms/inquiry-form-fields.tsx`
- Modify: `src/components/forms/inquiry-form-copy.ts`
- Modify: `src/components/forms/__tests__/inquiry-form.test.tsx`
- Modify: `src/components/forms/__tests__/inquiry-form-copy.test.ts`
- Modify: `src/test/inquiry-test-messages.ts`
- Modify: `messages/profiles/b2b-lead/en/messages.json`
- Modify: `docs/项目基础/行为合约.md`

### Color and button behavior

- Modify: `src/app/globals.css`
- Modify: `tests/architecture/design-token-contract.test.ts`
- Modify: `src/config/static-theme-colors.ts`
- Modify: `src/config/__tests__/static-theme-colors.test.ts`
- Modify: `src/emails/theme.ts`
- Modify/Test if present: `src/emails/__tests__/theme.test.ts`
- Modify: `src/components/ui/button-variants.ts`
- Modify: `src/components/ui/__tests__/button.test.tsx`

### Theme and accessible names

- Modify: `messages/base/en/messages.json`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/components/layout/header.tsx`
- Modify: `src/components/layout/mobile-navigation.tsx`
- Modify: `src/components/layout/mobile-navigation-interactive.tsx`
- Modify: `src/components/layout/header-mobile-navigation-fallback.tsx`
- Modify: `src/components/footer/Footer.tsx`
- Modify: `src/components/products/catalog-breadcrumb.tsx`
- Modify: `src/components/products/catalog-breadcrumb-view.tsx`
- Modify: `src/components/ui/breadcrumb.tsx`
- Modify: `src/components/ui/theme-switcher.tsx`
- Modify: focused tests paired with the files above
- Modify: `src/lib/navigation.ts`
- Modify: `src/lib/__tests__/navigation.test.ts`

### Browser proof

- Modify the narrowest existing Playwright spec that owns full-page accessibility and theme behavior; prefer `tests/e2e/core-page-visual-calibration.spec.ts` for full-page axe coverage.
- Do not create a broad new E2E framework. Add a focused spec only if no existing test can prove actual theme activation without mixing unrelated behavior.

## 2. Task 1: lock the shared field-error contract with failing tests

- [ ] **Step 1: Add the field-copy contract first**

Extend `InquiryFormCopy.errors` and its test fixture with exactly these leaves:

```text
fullName.required
fullName.invalid
fullName.tooLong
email.required
email.invalid
email.tooLong
message.invalid
message.tooLong
```

Do not add phone or a required message error.

- [ ] **Step 2: Write failing copy tests**

In `src/components/forms/__tests__/inquiry-form-copy.test.ts`, prove all eight leaves are read from `inquiry.form.errors`.

- [ ] **Step 3: Write failing end-to-end component-state tests**

In `src/components/forms/__tests__/inquiry-form.test.tsx`, mock one real `/api/inquiry` error response containing fullName, email and message details. Prove:

- form-level field summary remains visible;
- the first recognized translated error for each visible field is rendered below that field;
- each matching control has `aria-invalid="true"`;
- each `aria-describedby` ID exists;
- message describes both hint and error;
- unrecognized or hidden detail codes are not rendered raw and create no controls;
- the three-field/no-phone contract remains unchanged.

- [ ] **Step 4: Run the failing tests**

```bash
pnpm exec vitest run \
  src/components/forms/__tests__/inquiry-form-copy.test.ts \
  src/components/forms/__tests__/inquiry-form.test.tsx
```

Expected: failure because field copy and field DOM rendering do not yet exist.

## 3. Task 2: implement the minimum field-error path

- [ ] **Step 1: Add the eight inquiry message leaves**

Add them under `inquiry.form.errors` in `messages/profiles/b2b-lead/en/messages.json`. Reuse approved existing English wording; do not make the shared form call `contact.form`.

- [ ] **Step 2: Extend `createInquiryFormCopy`**

Read the eight literal keys. Keep the type local to the existing copy structure; do not add another message registry.

- [ ] **Step 3: Pass field details only for field failures**

From `InquiryForm`, pass `fieldDetails` to `InquiryFormFields` only when the current display state is an error with `errorKind === "field"`.

- [ ] **Step 4: Render recognized visible-field errors**

Inside `inquiry-form-fields.tsx`, use a small literal map or direct prefix checks. For each field, select the first recognized code in service order. Do not create a new utility file.

Required DOM behavior:

```text
fullName error id: inquiry-full-name-error
email error id: inquiry-email-error
message error id: inquiry-message-error
message describedby on error: inquiry-message-hint inquiry-message-error
```

Use the existing semantic destructive/error styling. Unknown details are ignored at field level.

- [ ] **Step 5: Run focused tests until green**

```bash
pnpm exec vitest run \
  src/components/forms/__tests__/inquiry-form-copy.test.ts \
  src/components/forms/__tests__/inquiry-response.test.ts \
  src/components/forms/__tests__/inquiry-form.test.tsx \
  src/app/api/inquiry/__tests__/route.test.ts \
  tests/unit/inquiry-validation-details.test.ts
```

- [ ] **Step 6: Update the stable behavior contract**

Extend the existing inquiry behavior entry in `docs/项目基础/行为合约.md`; do not add a duplicate contract ID. State that recognized visible-field errors render below controls while the summary remains, unknown details stay summary-only, and the public path has no phone field.

## 4. Task 3: correct contrast and static color ownership

- [ ] **Step 1: Write failing contrast assertions**

Extend `tests/architecture/design-token-contract.test.ts` to calculate `--muted-foreground` against `--background`, `--card`, and `--muted` for light and dark themes, each `>= 4.5`.

Add a calculated ghost foreground/accent assertion only if the existing helper can express the actual pair without duplicating test infrastructure. Otherwise keep the ghost behavior proof in the Button class test.

- [ ] **Step 2: Run the contrast test and confirm current failure**

```bash
pnpm exec vitest run tests/architecture/design-token-contract.test.ts
```

Expected: dark muted foreground fails the 4.5 threshold.

- [ ] **Step 3: Change only owning CSS tokens**

Set light and dark `--muted-foreground` to `var(--neutral-9)`.

- [ ] **Step 4: Prove and remove dead bridge keys**

Run a live search excluding the declaration and exact-key test. If still zero production consumers, remove `primaryHover`, `warning`, `warningLight`, and `error`.

- [ ] **Step 5: Rename the static bridge key**

Rename `STATIC_THEME_COLORS.primary` to `primaryText`. In `src/emails/theme.ts`, keep the existing email-facing `COLORS.primary` API but derive it from `STATIC_THEME_COLORS.primaryText`.

Do not change `runtime-email-content.ts` unless a test proves the internal email alias itself is misleading and the extra edits reduce rather than increase concepts.

- [ ] **Step 6: Update bridge tests**

Update the exact exported-key test and add or update an email theme test proving:

- `COLORS.primary === STATIC_THEME_COLORS.primaryText`;
- value remains `#005993`;
- every bridge value is a full hex color;
- browser UI import prohibition remains green.

- [ ] **Step 7: Fix ghost hover with the existing token**

Change the ghost variant to `hover:bg-accent hover:text-foreground` and update its paired Button test. Do not add a new token or per-call override.

- [ ] **Step 8: Run focused color tests**

```bash
pnpm exec vitest run \
  tests/architecture/design-token-contract.test.ts \
  src/config/__tests__/static-theme-colors.test.ts \
  src/emails/__tests__/theme.test.ts \
  src/components/ui/__tests__/button.test.tsx
```

If `src/emails/__tests__/theme.test.ts` does not exist, add the smallest direct test or place the assertion in the existing closest email theme test; do not create a large new suite.

Record the fresh calculated ratios in the PR evidence packet.

## 5. Task 4: add ThemeSwitcher selection semantics

- [ ] **Step 1: Write failing ThemeSwitcher tests**

In `src/components/ui/__tests__/theme-switcher.test.tsx`, prove:

- a translated `role="group"` exists;
- hydrated active button has `aria-pressed="true"` and the other two are false;
- when stored `theme` is unavailable, `resolvedTheme` determines the selected button;
- disabled SSR/hydration skeleton has no false selected claim;
- clicking an option still calls `setTheme`.

- [ ] **Step 2: Run the test and confirm failure**

```bash
pnpm exec vitest run src/components/ui/__tests__/theme-switcher.test.tsx
```

- [ ] **Step 3: Implement with existing component structure**

Read `accessibility.themeSelector`, add group semantics to both rendered shells, and add `aria-pressed` only to hydrated option buttons. Do not add a new ThemeSwitcher context or hook.

- [ ] **Step 4: Run focused tests**

```bash
pnpm exec vitest run \
  src/components/ui/__tests__/theme-switcher.test.tsx \
  src/components/ui/__tests__/lazy-theme-switcher.test.tsx
```

## 6. Task 5: move active accessible names into i18n and remove duplicate ARIA

- [ ] **Step 1: Add failing message and component tests**

Use deliberately non-default test strings so tests prove injection rather than accidentally matching old English constants.

Cover:

- desktop main navigation landmark;
- mobile navigation landmark;
- mobile Sheet dialog title;
- Footer navigation landmark;
- catalog breadcrumb landmark;
- fallback summary accessible name without `aria-label`;
- standalone MobileMenuButton accessible name without `aria-label`;
- integrated Sheet dialog name from `SheetTitle` without `SheetContent aria-label`.

- [ ] **Step 2: Run the focused tests and confirm failure**

Use the actual existing test filenames discovered by `rg`, including:

```bash
pnpm exec vitest run \
  src/components/layout/__tests__/header-client.test.tsx \
  src/components/layout/__tests__/mobile-menu-button.test.tsx \
  src/components/layout/__tests__/mobile-navigation.test.tsx \
  src/components/layout/__tests__/mobile-navigation-links.test.tsx \
  src/components/footer/__tests__/Footer.test.tsx \
  src/components/products/__tests__/catalog-breadcrumb.test.tsx \
  src/lib/__tests__/navigation.test.ts
```

If a listed path differs in the current tree, locate the paired existing test; do not create a duplicate file only to match this plan.

- [ ] **Step 3: Add only live accessibility message keys**

Add to `messages/base/en/messages.json`:

```text
mainNavigation
mobileNavigation
themeSelector
footerNavigation
breadcrumb
```

- [ ] **Step 4: Wire server-owned labels through props**

- Layout -> Header: `mainNavigation`.
- Footer: root translator -> `accessibility.footerNavigation`.
- CatalogBreadcrumb server component -> view `ariaLabel` prop -> `Breadcrumb`.

Do not make the breadcrumb primitive call next-intl.

- [ ] **Step 5: Wire active client labels without widening islands**

- `MobileNavigationLinks` reads `accessibility.mobileNavigation`.
- `MobileNavigationInteractive` uses the same translated label for `SheetTitle`.
- ThemeSwitcher uses `accessibility.themeSelector` from Task 4.

- [ ] **Step 6: Remove obsolete constant and duplicate attributes**

- Delete `NAVIGATION_ARIA` from `src/lib/navigation.ts` and its constant-only tests.
- Remove project-written `aria-haspopup="dialog"` from fallback summary and standalone `MobileMenuButton`.
- Remove `aria-label` from fallback summary, `MobileMenuButton`, and `SheetContent`.

Do not assert that Radix's final integrated trigger DOM lacks `aria-haspopup`; assert correct dialog behavior instead.

- [ ] **Step 7: Run i18n and component checks**

```bash
pnpm content:check
pnpm exec vitest run \
  src/components/ui/__tests__/theme-switcher.test.tsx \
  src/components/layout/__tests__/header-client.test.tsx \
  src/components/layout/__tests__/mobile-menu-button.test.tsx \
  src/components/layout/__tests__/mobile-navigation.test.tsx \
  src/components/layout/__tests__/mobile-navigation-links.test.tsx \
  src/components/footer/__tests__/Footer.test.tsx \
  src/components/products/__tests__/catalog-breadcrumb.test.tsx \
  src/lib/__tests__/navigation.test.ts
```

## 7. Task 6: browser proof and full D5a gates

- [ ] **Step 1: Expand axe to the surfaces actually changed**

Update the narrowest existing Playwright coverage so the accessibility scan includes header, main, Footer, ThemeSwitcher, Contact and Request Quote. Do not cite the old `main#main-content`-only scan as proof for navigation/Footer/theme UI.

- [ ] **Step 2: Add or reuse a focused theme browser proof**

Using role/name locators and keyboard activation, prove selecting light/dark changes the actual page theme and keeps focus. Reuse an existing spec if one exists after live search.

- [ ] **Step 3: Run focused browser journeys**

```bash
pnpm exec playwright test \
  tests/e2e/core-page-visual-calibration.spec.ts \
  tests/e2e/contact-form-smoke.spec.ts \
  tests/e2e/contact-submit-journey.spec.ts \
  tests/e2e/product-interest-rfq-handoff.spec.ts
```

Include the actual focused theme spec if separate. If filenames changed, use the current owning specs and record the exact commands.

- [ ] **Step 4: Run React and project gates**

```bash
pnpm react:doctor
pnpm component:check
pnpm content:check
pnpm website:check
pnpm build
```

Run `pnpm build` only after `website:check` has completed. Do not start OpenNext in parallel.

- [ ] **Step 5: Run the Cloudflare build serially**

```bash
pnpm website:build:cf
```

- [ ] **Step 6: Verify the D6a client boundary remains intact**

Against the fresh build artifacts:

```bash
node scripts/starter-checks.js client-boundary --build-artifacts
```

Record current raw/gzip bytes as evidence only; do not turn a point-in-time hash or byte count into a permanent truth assertion.

## 8. Task 7: self-review, PR and Cluster 3A handoff

- [ ] **Step 1: Run final diff checks**

```bash
git diff --check
git status -sb
git diff --stat origin/main...HEAD
```

Search explicitly for:

```bash
rg -n 'input\[type="tel"\]|type="tel"|name="phone"|NAVIGATION_ARIA|STATIC_THEME_COLORS\.primary\b' src tests
```

Interpret hits; do not demand global zero for legacy files outside D5a unless the contract says so.

- [ ] **Step 2: Self-review the complete diff**

Review correctness, privacy, accessibility, i18n ownership, browser/server boundaries, dead keys, duplicate truth, test behavior, docs truth and scope containment. Fix confirmed problems and rerun affected tests.

- [ ] **Step 3: Commit and push**

```bash
git add <reviewed D5a files>
git commit -m "fix: a11y correctness batch with field-level form errors"
git push -u origin feat/m3-d5a-a11y
```

- [ ] **Step 4: Open the PR and wait for exact-SHA CI**

The PR targets `main`. Do not merge. Comment an evidence packet containing:

```text
Task: D5a
Cluster: 3A tip
Head SHA:
Base SHA: a23f30ca457f65aa0bcab008147fb8039e6e1f14
Field-error behavior:
Three-field/no-phone proof:
ThemeSwitcher proof:
Translated landmark proof:
Contrast ratios:
Static bridge keys removed:
Focused tests:
Browser tests:
React Doctor/component/content/website gates:
Next build:
OpenNext build:
Client boundary bytes/dependencies:
GitHub CI:
Scope deviations: none or exact evidence
State: READY_FOR_CLUSTER / READY_FOR_ACCEPTANCE (Cluster 3A)
```

- [ ] **Step 5: Stop for Codex Cluster 3A acceptance**

Codex reviews `origin/main a23f30c...D5a-tip` as one cluster and independently reruns the decisive evidence. D6b must not start until Cluster 3A is ACCEPTED, D5a is merged, final main is reverified, and the cluster is marked CLOSED.
