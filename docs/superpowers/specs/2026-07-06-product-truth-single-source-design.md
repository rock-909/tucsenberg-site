> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Product Truth Single Source Design

## Source and approval

This spec implements S1 from `docs/audits/结构性修复计划-2026-07-05.md`.
That audit already selects the long-term fix: `TUCSENBERG_PRODUCT_PAGES` is the
current Tucsenberg product runtime truth. The owner asked to continue that goal
and to ignore the unrelated Premium Engineering Procurement line.

## Goal

Product detail pages and their JSON-LD must describe the same product facts from
one source: `src/constants/tucsenberg-product-pages.ts`.

## Current problem

The visible `/products/[market]` page renders from `getTucsenbergProductPage()`,
but JSON-LD still uses the legacy `product-specs` path through
`getMarketPageData()` and `familySpecsMap`. That lets product specs, labels, and
images drift between what buyers see and what search engines read.

The same old path also contains placeholder image paths under
`/images/products/*placeholder.svg`; those files are not current product truth.

## Design

- Keep `src/constants/tucsenberg-product-pages.ts` as the current product page
  source of truth.
- Add an explicit product image state to each `TucsenbergProductPage`:
  - `real` with a `src` string means the image may be used in JSON-LD.
  - `pending` means the page has no approved real product image yet.
  - `omitted` means the product deliberately has no JSON-LD image.
- For `pending` and `omitted`, JSON-LD must omit `image`.
- For `real`, tests must prove the referenced file exists under `public/`.
- Build product JSON-LD from the current `TucsenbergProductPage`, not from
  `familySpecsMap` or legacy `product-specs`.
- Keep the catalog market object for route/path/breadcrumb identity only.
- Mark `src/constants/product-specs/tucsenberg-product-lines.ts` as a
  legacy/starter fixture, not current Tucsenberg runtime truth.
- Keep `SITE_CONFIG` as runtime config only; brand assets remain in
  `siteFacts`/single-site facts and must not be reintroduced into `SITE_CONFIG`.

## Acceptance criteria

Given a buyer opens `/products/abs-flood-barriers`,
when the page renders JSON-LD,
then the ProductGroup name and description come from the same product page copy
as the visible H1, subtitle, and lead.

Given a product page has `image.status: "pending"` or `"omitted"`,
when JSON-LD is generated,
then no product `image` field is emitted.

Given a product page has `image.status: "real"`,
when architecture tests run,
then its `src` starts with `/` and exists under `public/`.

Given a route or JSON-LD helper is edited later,
when architecture tests run,
then the current product route must not import the market spec registry for
runtime JSON-LD data.

Given a future agent tries to read `SITE_CONFIG.brandAssets`,
when architecture tests run,
then the boundary test fails and points them back to `siteFacts`.

## Out of scope

- No production domain cutover.
- No Premium Engineering Procurement changes.
- No new generic product model.
- No retirement of old FamilySection files; that belongs to S2.
- No permanent deletion.
