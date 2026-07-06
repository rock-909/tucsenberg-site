# Product Truth Single Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current product detail pages and JSON-LD share `TUCSENBERG_PRODUCT_PAGES` as the single runtime truth.

**Architecture:** Keep the existing route shape. Remove the JSON-LD dependency on the legacy product-spec registry. Add a small product image state directly to the product page data and lock the boundary with focused architecture and page tests.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, shared JSON-LD generators.

---

## Files

- Modify: `src/constants/tucsenberg-product-pages.ts`
  - Add `TucsenbergProductImage`.
  - Add `image` to every product page.
- Modify: `src/app/[locale]/products/[market]/market-jsonld.ts`
  - Build ProductGroup from `TucsenbergProductPage`.
  - Omit image unless `image.status === "real"`.
- Modify: `src/app/[locale]/products/[market]/market-page-data.ts`
  - Keep route market/family lookup only; remove current-page spec registry output.
- Modify: `src/app/[locale]/products/[market]/page.tsx`
  - Pass `productPage` into JSON-LD builder.
- Modify: `tests/architecture/tucsenberg-product-pages.test.ts`
  - Add image state/file existence contracts.
- Modify: `tests/architecture/product-market-route-boundary.test.ts`
  - Lock current route away from `product-specs` registry for runtime data.
- Modify: `src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx`
  - Assert ProductGroup uses current product page title/lead/spec details and no placeholder images.
- Modify: `src/constants/product-specs/tucsenberg-product-lines.ts`
  - Add file-level legacy/starter fixture comment.
- Modify: `docs/项目基础/替换边界.md`
  - Clarify current Tucsenberg product page truth vs legacy starter catalog adapters.

## Task 1: Product page contracts first

- [ ] Add tests to `tests/architecture/tucsenberg-product-pages.test.ts`:
  - every product page has `image.status` in `real | pending | omitted`;
  - `real` image paths start with `/` and exist under `public/`;
  - product page data contains no `/images/products/*placeholder*` paths.

- [ ] Add route boundary assertions to `tests/architecture/product-market-route-boundary.test.ts`:
  - `page.tsx` imports `getTucsenbergProductPage`;
  - `page.tsx`, `market-page-data.ts`, and `market-jsonld.ts` do not import `@/constants/product-specs/market-spec-registry`;
  - `market-jsonld.ts` does not mention `familySpecsMap`.

- [ ] Add JSON-LD behavior assertions to `market-landing.test.tsx`:
  - ProductGroup `name` is `ABS Interlocking Boxwall Flood Barriers`;
  - ProductGroup `description` includes visible product lead text;
  - JSON-LD includes visible spec values such as `TB-BW50` and `4 mm`;
  - JSON-LD does not include `/images/products/` or `brandAssets`.

- [ ] Run:

```bash
pnpm exec vitest run \
  tests/architecture/tucsenberg-product-pages.test.ts \
  tests/architecture/product-market-route-boundary.test.ts \
  'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx'
```

Expected before implementation: FAIL because `image` is missing and JSON-LD still reads `familySpecsMap`/legacy specs.

## Task 2: Minimal implementation

- [ ] Update `src/constants/tucsenberg-product-pages.ts`:

```ts
export type TucsenbergProductImage =
  | { status: "real"; src: string }
  | { status: "pending" }
  | { status: "omitted" };
```

Add `image: { status: "pending" }` to each current product page.

- [ ] Update `market-jsonld.ts` so the input is:

```ts
{
  market: NonNullable<ReturnType<typeof getMarketBySlug>>;
  productPage: TucsenbergProductPage;
  marketUrl: string;
}
```

Use `generateProductGroupData()` with one variant for the current product page.

- [ ] Update `market-page-data.ts` to return only:

```ts
{
  market,
  families,
}
```

- [ ] Update `page.tsx` to pass `{ market: pageData.market, productPage, marketUrl }` to `buildMarketPageJsonLdData()`.

- [ ] Run the focused Vitest command from Task 1. Expected: PASS.

## Task 3: Legacy labeling and docs

- [ ] Add a top comment to `src/constants/product-specs/tucsenberg-product-lines.ts` saying it is a legacy/starter fixture, not current Tucsenberg product runtime truth.
- [ ] Update `docs/项目基础/替换边界.md` product catalog row and catalog compatibility note:
  - current Tucsenberg product page copy/spec runtime truth is `src/constants/tucsenberg-product-pages.ts`;
  - `src/constants/product-specs/**` remains an adopter-facing legacy/starter fixture unless a future profile explicitly selects it.

- [ ] Run:

```bash
node scripts/starter-checks.js truth-docs
```

Expected: PASS.

## Task 4: S1 verification

- [ ] Run the S1 focused gate:

```bash
pnpm exec vitest run \
  tests/architecture/tucsenberg-product-pages.test.ts \
  src/constants/product-specs/__tests__/market-spec-registry.test.ts \
  'src/app/[locale]/products/[market]/__tests__/market-landing.test.tsx' \
  'src/app/[locale]/products/[market]/__tests__/market-metadata-live.test.ts'
node scripts/starter-checks.js content-readiness --profile catalog
node scripts/starter-checks.js truth-docs
pnpm type-check
pnpm build
```

- [ ] Run the unified finish gate if focused gate passes:

```bash
pnpm content:check
pnpm test
pnpm build
pnpm lint:check
pnpm type-check
```

Expected: all commands exit 0 before opening the S1 PR.
