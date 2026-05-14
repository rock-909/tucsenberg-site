# Business Component Storybook Coverage Implementation Plan

> Historical snapshot: this plan keeps the dependency versions that were true when it was written. For current versions, use `docs/technical/tech-stack.md` and `package.json`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear the current business-component Storybook backlog by adding reviewable stories for contact/form/footer, product, and section components across three review batches.

**Architecture:** Keep the existing component governance scanner unchanged. Add matching `.stories.tsx` files for every current `business-component-missing-story` warning, and extract small synchronous view components only where Storybook cannot safely render an async Server Component or a hook-heavy client container. Server wrappers keep translation loading, JSON-LD, Server Actions, and runtime wiring.

**Tech Stack:** Next.js 16.2.4 App Router, React 19.2.5, TypeScript 6.0.3, Tailwind CSS 4.2.4, next-intl 4.11.0, Storybook 10.3.6, Vitest.

---

## Fixed scope

This plan implements the design in:

- `docs/superpowers/specs/2026-05-06-business-component-storybook-coverage-design.md`

The original risk-control sequence is three review batches:

1. Batch 1: Contact / forms / footer.
2. Batch 2: Products.
3. Batch 3: Sections.

If the owner explicitly asks for one-PR closure, ship the batches together but keep the PR body grouped by these surfaces so review stays manageable.

Do not change scanner behavior to hide warnings. The goal is real Storybook coverage.

## Current warning inventory

Baseline command:

```bash
pnpm component:governance
```

Baseline output:

```text
[component-governance] passed: 0 error(s), 33 warning(s)
```

Exact files to cover:

| PR | Component | Story file |
| --- | --- | --- |
| 1 | `src/components/contact/contact-form-island.tsx` | `src/components/contact/contact-form-island.stories.tsx` |
| 1 | `src/components/contact/contact-form.tsx` | `src/components/contact/contact-form.stories.tsx` |
| 1 | `src/components/contact/product-family-context-notice.tsx` | `src/components/contact/product-family-context-notice.stories.tsx` |
| 1 | `src/components/footer/Footer.tsx` | `src/components/footer/Footer.stories.tsx` |
| 1 | `src/components/forms/contact-form-container.tsx` | `src/components/forms/contact-form-container.stories.tsx` |
| 1 | `src/components/forms/contact-form-feedback.tsx` | `src/components/forms/contact-form-feedback.stories.tsx` |
| 1 | `src/components/forms/contact-form-fields.tsx` | `src/components/forms/contact-form-fields.stories.tsx` |
| 1 | `src/components/forms/contact-form.tsx` | `src/components/forms/contact-form.stories.tsx` |
| 1 | `src/components/forms/fields/additional-fields.tsx` | `src/components/forms/fields/additional-fields.stories.tsx` |
| 1 | `src/components/forms/fields/checkbox-fields.tsx` | `src/components/forms/fields/checkbox-fields.stories.tsx` |
| 1 | `src/components/forms/fields/contact-fields.tsx` | `src/components/forms/fields/contact-fields.stories.tsx` |
| 1 | `src/components/forms/fields/message-field.tsx` | `src/components/forms/fields/message-field.stories.tsx` |
| 1 | `src/components/forms/fields/name-fields.tsx` | `src/components/forms/fields/name-fields.stories.tsx` |
| 1 | `src/components/forms/lazy-turnstile.tsx` | `src/components/forms/lazy-turnstile.stories.tsx` |
| 2 | `src/components/products/catalog-breadcrumb.tsx` | `src/components/products/catalog-breadcrumb.stories.tsx` |
| 2 | `src/components/products/family-section.tsx` | `src/components/products/family-section.stories.tsx` |
| 2 | `src/components/products/market-series-card.tsx` | `src/components/products/market-series-card.stories.tsx` |
| 2 | `src/components/products/product-specs.tsx` | `src/components/products/product-specs.stories.tsx` |
| 2 | `src/components/products/spec-table.tsx` | `src/components/products/spec-table.stories.tsx` |
| 2 | `src/components/products/sticky-family-nav.tsx` | `src/components/products/sticky-family-nav.stories.tsx` |
| 3 | `src/components/sections/chain-section.tsx` | `src/components/sections/chain-section.stories.tsx` |
| 3 | `src/components/sections/faq-accordion.tsx` | `src/components/sections/faq-accordion.stories.tsx` |
| 3 | `src/components/sections/faq-section.tsx` | `src/components/sections/faq-section.stories.tsx` |
| 3 | `src/components/sections/final-cta-view.tsx` | `src/components/sections/final-cta-view.stories.tsx` |
| 3 | `src/components/sections/hero-section-view.tsx` | `src/components/sections/hero-section-view.stories.tsx` |
| 3 | `src/components/sections/homepage-section-shell.tsx` | `src/components/sections/homepage-section-shell.stories.tsx` |
| 3 | `src/components/sections/products-section-view.tsx` | `src/components/sections/products-section-view.stories.tsx` |
| 3 | `src/components/sections/quality-section-view.tsx` | `src/components/sections/quality-section-view.stories.tsx` |
| 3 | `src/components/sections/resources-section.tsx` | `src/components/sections/resources-section.stories.tsx` |
| 3 | `src/components/sections/sample-cta.tsx` | `src/components/sections/sample-cta.stories.tsx` |
| 3 | `src/components/sections/scenarios-section-view.tsx` | `src/components/sections/scenarios-section-view.stories.tsx` |
| 3 | `src/components/sections/starter-boundary-section-view.tsx` | `src/components/sections/starter-boundary-section-view.stories.tsx` |
| 3 | `src/components/sections/starter-boundary-section.tsx` | `src/components/sections/starter-boundary-section.stories.tsx` |

## Shared implementation rules

- [ ] Start from latest `main` when shipping in one PR, or from the previous merged PR when splitting the sequence.
- [ ] Read `AGENTS.md`, `.claude/rules/ui.md`, `.claude/rules/testing.md`, `docs/impeccable/system/COMPONENT-GOVERNANCE.md`, and `docs/impeccable/system/STORYBOOK-COVERAGE-MAP.md`.
- [ ] For any Next.js server/client boundary change, read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`.
- [ ] Do not use `rm`, `rmdir`, `unlink`, `find -delete`, `git clean`, or equivalent permanent deletion commands.
- [ ] Story files must import production components or production view components.
- [ ] Story fixtures must use generic starter examples.
- [ ] Do not add raw Tailwind palette classes such as `text-blue-600`, `bg-gray-50`, or raw hex colors in production UI.
- [ ] Do not directly import Radix outside `src/components/ui/`.
- [ ] Do not add `"use client"` to a large server wrapper just to make Storybook work.

---

## PR 1: Contact / forms / footer stories

**Goal:** Reduce governance warnings from 33 to 19 by adding reviewable Storybook coverage for the inquiry and footer surface.

**Branch:** `feat/contact-form-footer-stories`

**Files:**

- Create: `src/components/contact/contact-form-island.stories.tsx`
- Create: `src/components/contact/contact-form.stories.tsx`
- Create: `src/components/contact/product-family-context-notice.stories.tsx`
- Create: `src/components/footer/Footer.stories.tsx`
- Create: `src/components/forms/contact-form-container.stories.tsx`
- Create: `src/components/forms/contact-form-feedback.stories.tsx`
- Create: `src/components/forms/contact-form-fields.stories.tsx`
- Create: `src/components/forms/contact-form.stories.tsx`
- Create: `src/components/forms/fields/additional-fields.stories.tsx`
- Create: `src/components/forms/fields/checkbox-fields.stories.tsx`
- Create: `src/components/forms/fields/contact-fields.stories.tsx`
- Create: `src/components/forms/fields/message-field.stories.tsx`
- Create: `src/components/forms/fields/name-fields.stories.tsx`
- Create: `src/components/forms/lazy-turnstile.stories.tsx`
- Modify if needed: `src/components/forms/contact-form-container.tsx`
- Create if needed: `src/components/forms/contact-form-container-view.tsx`
- Create if needed: `src/components/forms/contact-form-story-fixtures.ts`

### Task 1.1: Branch and baseline

- [ ] Create the branch.

```bash
git switch -c feat/contact-form-footer-stories
```

- [ ] Confirm baseline warnings.

```bash
pnpm component:governance
```

Expected:

```text
[component-governance] passed: 0 error(s), 33 warning(s)
```

- [ ] Save the baseline output in the PR notes or `.context` if another agent will continue the work.

### Task 1.2: Add contact/form story fixtures

Create `src/components/forms/contact-form-story-fixtures.ts` if more than two form story files need the same translation and error-state data.

Required exports:

- `contactFormStoryTranslate`
- `contactFormApiStoryTranslate`
- `contactFormLongEnglishTranslate`
- `contactFormLongChineseTranslate`
- `contactFormValidationErrorState`
- `contactFormProcessingErrorState`

Expected behavior:

- `contactFormStoryTranslate("fullName")` returns `Full name`.
- `contactFormStoryTranslate("optional")` returns `optional`.
- Missing keys return the key, not an empty string.
- Error-state fixtures use the same `ServerActionResult<ContactFormResult>` shape as `ErrorDisplay`.

### Task 1.3: Make the full form container storyable

If `ContactFormContainer` pulls Server Action behavior into Storybook, split view from container:

- `ContactFormContainer` keeps `useContactForm`, `useTranslations`, `LazyTurnstile`, and submit action wiring.
- `ContactFormContainerView` receives serializable props for Storybook states:
  - `state`
  - `isPending`
  - `submitStatus`
  - `turnstileToken`
  - `isRateLimited`
  - `translateForm`
  - `translateApi`
  - `onTurnstileSuccess`
  - `onTurnstileError`
  - `onTurnstileExpire`
  - `onTurnstileLoad`
  - `formAction`

Required stories in `src/components/forms/contact-form-container.stories.tsx`:

- `Default`
- `Pending`
- `ValidationError`
- `SubmitSuccess`
- `ProcessingError`
- `RateLimited`

Acceptance criteria:

- `Pending` disables visible fields and shows the pending submit label.
- `ValidationError` renders the error display with validation details.
- `ProcessingError` renders a translated API error without validation details.
- Storybook does not call the real `contactFormAction`.

### Task 1.4: Add lower-level form field stories

Create stories for:

- `contact-form-fields`
- `name-fields`
- `contact-fields`
- `additional-fields`
- `message-field`
- `checkbox-fields`

Required shared states:

- `Default`
- `Pending`
- `LongEnglishCopy`
- `LongChineseCopy`

Per-file acceptance:

- `name-fields.stories.tsx` shows `fullName` with `autoComplete="name"` through the production component.
- `contact-fields.stories.tsx` shows required email and optional company.
- `additional-fields.stories.tsx` shows phone and subject disabled in pending state.
- `message-field.stories.tsx` shows a long placeholder and disabled state.
- `checkbox-fields.stories.tsx` shows required privacy and optional marketing consent.
- `contact-form-fields.stories.tsx` shows the full configured field set, including honeypot as visually hidden.

### Task 1.5: Add feedback and Turnstile stories

Create `src/components/forms/contact-form-feedback.stories.tsx`.

Required stories:

- `SuccessStatus`
- `SubmittingStatus`
- `ValidationError`
- `RawError`
- `ProcessingError`

Create `src/components/forms/lazy-turnstile.stories.tsx`.

Required stories:

- `Placeholder`
- `Compact`
- `DarkTheme`
- `StorybookFallback`

For `StorybookFallback`, use a controlled wrapper if needed. Do not force a real dynamic import failure by deleting or renaming files.

### Task 1.6: Add contact wrapper stories

Create:

- `src/components/contact/contact-form-island.stories.tsx`
- `src/components/contact/contact-form.stories.tsx`
- `src/components/contact/product-family-context-notice.stories.tsx`

Required states:

- `contact-form-island`: `LoadingFallback`, `Loaded`, `LoadFailed`
- `contact-form`: `Default`, `Pending`, `ValidationError`
- `product-family-context-notice`: `Default`, `LongFamilyName`, `ChineseCopy`

If `ContactFormIsland` cannot expose loaded/failed states without real dynamic import behavior, extract a small view component such as `ContactFormIslandView` and keep `ContactFormIsland` as the runtime loader.

### Task 1.7: Add footer story

Create `src/components/footer/Footer.stories.tsx`.

Required stories:

- `Default`
- `WithStatusSlot`
- `WithThemeToggleSlot`
- `CustomColumns`
- `LongLinks`
- `DarkSurface`

Acceptance criteria:

- The story uses `Footer` from `src/components/footer/Footer.tsx`.
- The story does not duplicate footer layout.
- Custom columns use generic starter labels.
- Links remain semantic links.

### Task 1.8: PR 1 verification

Run:

```bash
pnpm component:governance:test
pnpm component:governance
pnpm storybook:build
pnpm component:check
```

Expected after `pnpm component:governance`:

```text
[component-governance] passed: 0 error(s), 19 warning(s)
```

If production `.tsx` files were changed, also run:

```bash
pnpm type-check
pnpm lint:check
```

Commit:

```bash
git add src/components/contact src/components/forms src/components/footer
git commit -m "test: add contact form and footer stories"
```

---

## PR 2: Products stories

**Goal:** Reduce governance warnings from 19 to 13 by adding product component Storybook coverage.

**Branch:** `feat/product-component-stories`

**Files:**

- Create: `src/components/products/catalog-breadcrumb.stories.tsx`
- Create: `src/components/products/family-section.stories.tsx`
- Create: `src/components/products/market-series-card.stories.tsx`
- Create: `src/components/products/product-specs.stories.tsx`
- Create: `src/components/products/spec-table.stories.tsx`
- Create: `src/components/products/sticky-family-nav.stories.tsx`
- Modify if needed: `src/components/products/catalog-breadcrumb.tsx`
- Create if needed: `src/components/products/catalog-breadcrumb-view.tsx`
- Create if needed: `src/components/products/product-story-fixtures.ts`

### Task 2.1: Branch and baseline

- [ ] Start after PR 1 is merged or rebased.

```bash
git switch main
git pull --ff-only
git switch -c feat/product-component-stories
```

- [ ] Confirm baseline.

```bash
pnpm component:governance
```

Expected:

```text
[component-governance] passed: 0 error(s), 19 warning(s)
```

### Task 2.2: Add product fixtures

Create `src/components/products/product-story-fixtures.ts` if shared fixtures avoid copy/paste.

Required fixture data:

- One generic market definition.
- One long-title market definition.
- One Chinese market label set.
- Product family specs with:
  - one image,
  - three highlights,
  - two spec groups,
  - several rows per group.
- Empty specs object for null-render stories.
- Wide spec table group with many columns.
- Sticky family nav list with at least eight families.

Fixture copy must be generic starter copy.

### Task 2.3: Add product display stories

Create stories for:

- `market-series-card`
- `family-section`
- `product-specs`
- `spec-table`
- `sticky-family-nav`

Required states:

- `Default`
- `LongCopy`
- `ChineseCopy`
- `Overflow` where the component has horizontal or label overflow risk.
- `Empty` where the production component intentionally returns `null`.

Per-file acceptance:

- `market-series-card.stories.tsx` proves fallback image behavior with an unknown slug.
- `family-section.stories.tsx` shows default and no-inquiry variants.
- `product-specs.stories.tsx` includes `ProductSpecs`, `ProductCertifications`, and `ProductTradeInfo` exports in one file.
- `spec-table.stories.tsx` includes wide-table overflow.
- `sticky-family-nav.stories.tsx` includes many families and a custom `ariaLabel`.

### Task 2.4: Make breadcrumb storyable without server runtime coupling

`CatalogBreadcrumb` is an async Server Component and reads translations through `next-intl/server`.

Preferred implementation:

- Extract `CatalogBreadcrumbView` into `src/components/products/catalog-breadcrumb-view.tsx`.
- `CatalogBreadcrumb` keeps `getTranslations`, JSON-LD, and calls the view.
- `catalog-breadcrumb.stories.tsx` imports the view or the production wrapper only if Storybook build proves it is stable.

Required stories:

- `ProductsRoot`
- `MarketDetail`
- `LongMarketLabel`
- `WithoutJsonLd`

Acceptance criteria:

- Storybook does not need real `next-intl/server`.
- Existing tests for `buildCatalogBreadcrumbJsonLd` remain valid.
- Breadcrumb links keep the same visual structure.

### Task 2.5: PR 2 verification

Run:

```bash
pnpm component:governance:test
pnpm component:governance
pnpm storybook:build
pnpm component:check
```

Expected after `pnpm component:governance`:

```text
[component-governance] passed: 0 error(s), 13 warning(s)
```

If `catalog-breadcrumb.tsx` or other production files changed, also run:

```bash
pnpm type-check
pnpm lint:check
pnpm exec vitest run src/components/products/__tests__/catalog-breadcrumb.test.tsx
```

Commit:

```bash
git add src/components/products
git commit -m "test: add product component stories"
```

---

## PR 3: Section stories

**Goal:** Reduce governance warnings from 13 to 0 by adding section-layer Storybook coverage.

**Branch:** `feat/section-component-stories`

**Files:**

- Create: `src/components/sections/chain-section.stories.tsx`
- Create: `src/components/sections/faq-accordion.stories.tsx`
- Create: `src/components/sections/faq-section.stories.tsx`
- Create: `src/components/sections/final-cta-view.stories.tsx`
- Create: `src/components/sections/hero-section-view.stories.tsx`
- Create: `src/components/sections/homepage-section-shell.stories.tsx`
- Create: `src/components/sections/products-section-view.stories.tsx`
- Create: `src/components/sections/quality-section-view.stories.tsx`
- Create: `src/components/sections/resources-section.stories.tsx`
- Create: `src/components/sections/sample-cta.stories.tsx`
- Create: `src/components/sections/scenarios-section-view.stories.tsx`
- Create: `src/components/sections/starter-boundary-section-view.stories.tsx`
- Create: `src/components/sections/starter-boundary-section.stories.tsx`
- Modify if needed: server wrapper files under `src/components/sections/`
- Create if needed: synchronous view files for `chain-section`, `resources-section`, `sample-cta`, `faq-section`, or `starter-boundary-section`.
- Create if needed: `src/components/sections/section-story-fixtures.ts`

### Task 3.1: Branch and baseline

- [ ] Start after PR 2 is merged or rebased.

```bash
git switch main
git pull --ff-only
git switch -c feat/section-component-stories
```

- [ ] Confirm baseline.

```bash
pnpm component:governance
```

Expected:

```text
[component-governance] passed: 0 error(s), 13 warning(s)
```

### Task 3.2: Add shared section fixtures

Create `src/components/sections/section-story-fixtures.ts` if shared data helps.

Required fixtures:

- FAQ items with default, long English, and Chinese variants.
- Chain/process steps with five items.
- Resource cards with four items.
- Starter boundary content with four default items and long-copy items.
- Generic action slot content for `HomepageSectionShell`.

Do not duplicate existing `homepage-section.fixtures.ts` data if the existing fixture already covers the state. Reuse existing fixtures for:

- hero,
- products,
- quality,
- scenarios,
- final CTA.

### Task 3.3: Add view-component matching stories

Create matching story files for existing view components:

- `final-cta-view.stories.tsx`
- `hero-section-view.stories.tsx`
- `products-section-view.stories.tsx`
- `quality-section-view.stories.tsx`
- `scenarios-section-view.stories.tsx`
- `starter-boundary-section-view.stories.tsx`

Required states:

- `Default`
- `LongCopy`
- `ChineseCopy`
- `NarrowCanvas` for layout-heavy views.

Acceptance criteria:

- Existing non-view story files such as `hero-section.stories.tsx` stay in place.
- Matching story files clear scanner warnings for view files.
- Stories reuse current `homepage-section.fixtures.ts` where possible.

### Task 3.4: Add shell and accordion stories

Create:

- `homepage-section-shell.stories.tsx`
- `faq-accordion.stories.tsx`

Required stories for shell:

- `Default`
- `WithAction`
- `LongCopy`
- `ChineseCopy`

Required stories for FAQ accordion:

- `Default`
- `LongAnswers`
- `ChineseCopy`
- `ManyItems`

Acceptance criteria:

- `faq-accordion` stories show collapsed and expanded behavior through the real component.
- `homepage-section-shell` stories prove title, subtitle, action slot, and child layout.

### Task 3.5: Make server wrapper sections storyable

These files are async Server Components or use `next-intl/server`:

- `chain-section.tsx`
- `faq-section.tsx`
- `resources-section.tsx`
- `sample-cta.tsx`
- `starter-boundary-section.tsx`

Preferred pattern:

- Extract a synchronous view component next to the server wrapper.
- Keep the original server wrapper as the translation/data loader.
- Story file imports the view component or a story-only adapter that passes fixture props to the production view.

Required stories:

- `chain-section.stories.tsx`: `Default`, `LongCopy`, `ChineseCopy`, `NarrowCanvas`
- `faq-section.stories.tsx`: `Default`, `LongAnswers`, `ChineseCopy`, `WithoutJsonLd`
- `resources-section.stories.tsx`: `Default`, `LongCopy`, `ChineseCopy`
- `sample-cta.stories.tsx`: `Default`, `LongCopy`, `ChineseCopy`, `NarrowCanvas`
- `starter-boundary-section.stories.tsx`: `Default`, `LongCopy`, `ChineseCopy`

Acceptance criteria:

- Server wrappers do not become Client Components.
- JSON-LD can be disabled in Storybook.
- Existing section tests still pass after any view extraction.

### Task 3.6: PR 3 verification

Run:

```bash
pnpm component:governance:test
pnpm component:governance
pnpm storybook:build
pnpm component:check
```

Expected after `pnpm component:governance`:

```text
[component-governance] passed: 0 error(s), 0 warning(s)
```

If production section files changed, also run:

```bash
pnpm type-check
pnpm lint:check
pnpm exec vitest run src/components/sections/__tests__/chain-section.test.tsx src/components/sections/__tests__/faq-section.test.tsx src/components/sections/__tests__/resources-section.test.tsx src/components/sections/__tests__/sample-cta.test.tsx src/components/sections/__tests__/starter-boundary-section.test.tsx
```

Commit:

```bash
git add src/components/sections
git commit -m "test: add section component stories"
```

---

## Final verification after all three PRs

Run from clean `main` after PR 3 is merged:

```bash
git status --short --branch --untracked-files=all
pnpm component:governance:test
pnpm component:governance
pnpm storybook:build
pnpm component:check
pnpm type-check
pnpm lint:check
```

Expected:

```text
[component-governance] passed: 0 error(s), 0 warning(s)
Storybook build completed successfully
```

Final owner-facing summary should include:

- 33 warnings reduced to 0.
- Which PR cleared which surface.
- Whether any production view extraction happened.
- Which validation commands ran.
- Any story states that should still get human visual review in the browser.
