# Radix Governed Full Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all suitable standardized UI surfaces to Radix-backed local wrappers while keeping Tailwind/project tokens in charge of brand narrative and page layout.

**Architecture:** Use `src/components/ui/*` as the only Radix entry point. Each vertical slice includes wrapper tests, consumer migration, governance proof, and focused behavior proof. Narrative/layout surfaces are explicitly excluded unless they carry control, state, form, interaction, or data/spec semantics.

**Tech Stack:** Next.js 16.2.6, React 19.2.6, TypeScript 6.0.3, Tailwind CSS 4.3.0, Radix Themes 3.3.0, Radix Primitives, next-intl, Vitest, component governance, OpenNext Cloudflare build.

---

## Risk ordering

1. Low-risk wrapper generalization and public markers.
2. Generic form wrappers with native FormData tests.
3. Status and badge wrappers.
4. Data/spec card wrappers and product/ops/contact data migrations.
5. DropdownMenu + desktop language menu.
6. Checkbox and cookie/dialog/collapsible/theme switcher only after focused
   behavior proof.
7. Final broad governance, React Doctor, Next build, and Cloudflare build.

## Slice 1: Theme, Input, Textarea

**Files:**
- Modify: `src/components/ui/radix-theme.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/__tests__/radix-theme.test.tsx`
- Modify: `src/components/ui/__tests__/input.test.tsx`
- Create/modify: `src/components/ui/__tests__/textarea.test.tsx`
- Modify: `scripts/starter-checks.js`

- [ ] Write failing tests for named Radix theme surfaces and generic
  Input/Textarea FormData/defaultValue/native exception behavior.
- [ ] Run focused tests and confirm expected RED.
- [ ] Implement named `RadixThemePilot` surfaces.
- [ ] Migrate textual `Input` to Radix Themes `TextField.Root`, keeping file,
  hidden, checkbox, radio, submit, reset, button, image, range, and color native.
- [ ] Migrate `Textarea` to Radix Themes `TextArea`.
- [ ] Run focused tests.
- [ ] Run `pnpm component:governance`, client-boundary check, lint, and
  type-check.

## Slice 2: Field and StatusCallout

**Files:**
- Create: `src/components/ui/field.tsx`
- Create: `src/components/ui/status-callout.tsx`
- Create: `src/components/ui/__tests__/field.test.tsx`
- Create: `src/components/ui/__tests__/status-callout.test.tsx`
- Modify: `src/components/forms/contact-form-feedback.tsx`
- Modify: `src/components/contact/product-family-context-notice.tsx`
- Modify: `src/components/security/turnstile.tsx`
- Modify: `src/components/forms/lazy-turnstile.tsx`
- Modify related tests.

- [ ] Write failing wrapper and consumer tests.
- [ ] Implement local `Field`, `FieldLabel`, `FieldControl`, `FieldHint`,
  `FieldError`, and `ErrorSummary` wrapper contract.
- [ ] Implement `StatusCallout` with `tone`, `live`, public marker, and no
  per-instance Theme scope.
- [ ] Migrate contact status/error feedback, static product-family notice, and
  Turnstile fallback states.
- [ ] Run focused tests and governance.

## Slice 3: Badge and data/spec wrappers

**Files:**
- Modify: `src/components/ui/badge.tsx`
- Create: `src/components/ui/data-card.tsx`
- Create: `src/components/ui/metric-card.tsx`
- Create: `src/components/ui/spec-card.tsx`
- Add tests/stories for new wrappers.
- Modify: `src/components/products/product-specs.tsx`
- Modify: `src/components/products/spec-table.tsx`
- Modify: `src/components/products/market-series-card.tsx`
- Modify: `src/app/ops/traffic/page.tsx`
- Modify: `src/app/[locale]/contact/contact-page-sections.tsx`
- Modify: `src/components/content/about-page-shell.tsx` only for metrics.

- [ ] Write failing tests that assert public markers/slots and no `.rt-*`.
- [ ] Implement Radix-backed Badge/DataCard/MetricCard/SpecCard wrappers.
- [ ] Migrate product specs/trade info/spec table/market metadata cards.
- [ ] Migrate contact metadata cards, ops traffic metrics, and about stats.
- [ ] Keep hero/story/proof/footer narrative cards unchanged.
- [ ] Run focused product/contact/content/ops tests and governance.

## Slice 4: DropdownMenu and language menu

**Files:**
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/__tests__/dropdown-menu.test.tsx`
- Modify: `src/components/layout/header-language-menu.tsx`
- Modify: `src/components/layout/__tests__/header-language-menu.test.tsx`
- Modify: `docs/quality/client-boundary-budget.json`

- [ ] Write failing DropdownMenu wrapper tests.
- [ ] Write language menu tests for open, activation close, Escape, outside
  click, keyboard/focus, and real href preservation.
- [ ] Implement Radix DropdownMenu wrapper.
- [ ] Migrate desktop language menu without global `preventDefault`.
- [ ] Add new client boundary budget entry.
- [ ] Run focused menu tests, client-boundary, and governance.

## Slice 5: Checkbox proof and contact form adoption

**Files:**
- Add dependency if needed: `@radix-ui/react-checkbox`
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/__tests__/checkbox.test.tsx`
- Modify: `src/components/forms/contact-form-fields.tsx`
- Modify related form tests.

- [ ] Write failing Checkbox tests for FormData, label click, required,
  disabled, checked/unchecked behavior, and ref forwarding.
- [ ] Implement wrapper only if tests can preserve native semantics.
- [ ] Migrate client Contact checkboxes if tests pass.
- [ ] Keep `contact-form-static-fallback.tsx` native unless separate no-JS proof
  shows wrapper does not alter fallback semantics.

## Slice 6: Remaining interaction surfaces

**Files:**
- Candidate: `src/components/cookie/cookie-banner.tsx`
- Candidate: `src/components/layout/mobile-navigation-interactive.tsx`
- Candidate: `src/components/ui/theme-switcher.tsx`

- [ ] Audit cookie banner Dialog/Checkbox migration with behavior tests.
- [ ] Audit mobile language disclosure Collapsible/Accordion migration without
  adding extra client boundary.
- [ ] Audit theme switcher RadioGroup/Tabs migration.
- [ ] Defer only with concrete stop-line evidence.

## Final verification

Run in order:

```bash
pnpm exec vitest run \
  src/components/ui/__tests__/input.test.tsx \
  src/components/ui/__tests__/textarea.test.tsx \
  src/components/ui/__tests__/status-callout.test.tsx \
  src/components/ui/__tests__/data-card.test.tsx \
  src/components/ui/__tests__/metric-card.test.tsx \
  src/components/ui/__tests__/spec-card.test.tsx \
  src/components/ui/__tests__/badge.test.tsx \
  src/components/ui/__tests__/dropdown-menu.test.tsx \
  src/components/layout/__tests__/header-language-menu.test.tsx
pnpm component:governance
node scripts/starter-checks.js client-boundary
pnpm lint:check
pnpm type-check
pnpm react:doctor
pnpm component:check
pnpm test
pnpm build
pnpm website:build:cf
```

Do not run `pnpm build` and `pnpm website:build:cf` in parallel.

## Final report requirements

The final report must include:

- all adopted components;
- already-compliant components;
- deferred components with stop-line evidence;
- not-applicable components and reasons;
- new/modified wrappers;
- new/modified tests;
- governance proof;
- Next build and Cloudflare build results;
- remaining risks and next-round recommendation.
