> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Legacy FamilySection Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retire the old `FamilySection` product-detail path after proving it has no production runtime entry.

**Architecture:** Keep current product routes on `TUCSENBERG_PRODUCT_PAGES`. Remove the old route section/presenter/component path and its active tests/stories. Keep historical docs but label old references as retired.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Vitest, Storybook/component governance.

---

## Files

- Modify: `tests/architecture/product-market-route-boundary.test.ts`
- Modify: `tests/architecture/cache-directive-policy.test.ts`
- Modify: `src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx`
- Modify: `doctor.config.json`
- Modify: `docs/技术难题/Lighthouse黄色债务归因.md`
- Modify: `docs/技术难题/Lighthouse零黄色归因.md`
- Modify: `docs/audits/上线就绪问题清单-2026-07-05.md`
- Delete with `git rm`: `src/app/[locale]/products/[market]/market-page-sections.tsx`
- Delete with `git rm`: `src/app/[locale]/products/[market]/market-spec-presenter.ts`
- Delete with `git rm`: `src/app/[locale]/products/[market]/cta-section.tsx`
- Delete with `git rm`: `src/app/[locale]/products/[market]/trust-signals-section.tsx`
- Delete with `git rm`: `src/components/products/family-section.tsx`
- Delete with `git rm`: `src/components/products/family-section.stories.tsx`
- Delete with `git rm`: `src/components/products/__tests__/family-section.test.tsx`

## Task 1: Retirement proof and red tests

- [x] Run proof command and save decisive output for PR notes:

```bash
rg -n "FamilySections|FamilySection|market-page-sections|buildTranslatedFamilySpecs|TrustSignalsSection|CtaSection|market-spec-presenter" src tests docs --glob '*.{ts,tsx,md,mdx}'
```

Expected before deletion: references exist only in the old files, their story/test, architecture allowlists, and historical docs.

- [x] Update `tests/architecture/product-market-route-boundary.test.ts` so `PRODUCT_MARKET_ROUTE_FILES` contains only current runtime files:

```ts
const PRODUCT_MARKET_ROUTE_FILES = [
  "src/app/[locale]/products/[market]/page.tsx",
  "src/app/[locale]/products/[market]/market-page-data.ts",
  "src/app/[locale]/products/[market]/market-jsonld.ts",
] as const;
```

- [x] Add an assertion in `tests/architecture/product-market-route-boundary.test.ts` that retired files do not exist:

```ts
const RETIRED_PRODUCT_ROUTE_FILES = [
  "src/app/[locale]/products/[market]/market-page-sections.tsx",
  "src/app/[locale]/products/[market]/market-spec-presenter.ts",
  "src/app/[locale]/products/[market]/cta-section.tsx",
  "src/app/[locale]/products/[market]/trust-signals-section.tsx",
  "src/components/products/family-section.tsx",
  "src/components/products/family-section.stories.tsx",
  "src/components/products/__tests__/family-section.test.tsx",
] as const;

it("keeps the retired FamilySection product-detail path out of active source", () => {
  for (const filePath of RETIRED_PRODUCT_ROUTE_FILES) {
    expect(existsSync(filePath), filePath).toBe(false);
  }
});
```

- [x] Update `tests/architecture/cache-directive-policy.test.ts` so `PRODUCT_MARKET_SOURCE_FILES` contains only:

```ts
const PRODUCT_MARKET_SOURCE_FILES = [
  "src/app/[locale]/products/[market]/page.tsx",
  "src/app/[locale]/products/[market]/market-jsonld.ts",
  "src/app/[locale]/products/[market]/market-page-data.ts",
] as const;
```

- [x] Run red tests:

```bash
pnpm exec vitest run tests/architecture/product-market-route-boundary.test.ts tests/architecture/cache-directive-policy.test.ts
```

Expected before deletion: FAIL because retired files still exist.

## Task 2: Retire files

- [x] Remove old files with Git, not shell deletion:

```bash
git rm 'src/app/[locale]/products/[market]/market-page-sections.tsx' \
  'src/app/[locale]/products/[market]/market-spec-presenter.ts' \
  'src/app/[locale]/products/[market]/cta-section.tsx' \
  'src/app/[locale]/products/[market]/trust-signals-section.tsx' \
  src/components/products/family-section.tsx \
  src/components/products/family-section.stories.tsx \
  src/components/products/__tests__/family-section.test.tsx
```

- [x] Run focused tests:

```bash
pnpm exec vitest run tests/architecture/product-market-route-boundary.test.ts tests/architecture/cache-directive-policy.test.ts
```

Expected: PASS.

## Task 3: Mark historical docs

- [x] Update `docs/技术难题/Lighthouse黄色债务归因.md` where it mentions `market-page-sections.tsx` to say the path is historical and retired by S2.
- [x] Update `docs/技术难题/Lighthouse零黄色归因.md` where it mentions old product route section files to say the path is historical and retired by S2.
- [x] Re-run proof command:

```bash
rg -n "FamilySections|FamilySection|market-page-sections|buildTranslatedFamilySpecs|TrustSignalsSection|CtaSection|market-spec-presenter" src tests docs --glob '*.{ts,tsx,md,mdx}'
```

Expected after deletion: only this S2 spec/plan, the structural audit record, and historical docs with retired wording remain.

## Task 4: S2 verification

- [x] Run focused product proof:

```bash
pnpm exec vitest run \
  tests/architecture/product-market-route-boundary.test.ts \
  tests/architecture/cache-directive-policy.test.ts \
  'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx' \
  'src/app/[locale]/products/[market]/__tests__/market-metadata-live.test.ts' \
  src/app/__tests__/sitemap.test.ts
```

- [x] Run component governance:

```bash
pnpm component:check
```

- [x] Run branch gates:

```bash
pnpm test
pnpm build
pnpm lint:check
pnpm type-check
```

- [ ] Commit:

```bash
git add .
git commit -m "fix: retire legacy family section path"
```

- [ ] Push and open PR against `main`.
