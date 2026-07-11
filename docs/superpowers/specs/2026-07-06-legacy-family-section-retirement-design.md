> Historical. This file preserves dated design or execution context. It is not current Tucsenberg product truth; verify current code and stable docs before acting on it.

# Legacy FamilySection Retirement Design

## Source and approval

This spec implements S2 from `docs/audits/结构性修复计划-2026-07-05.md`.
S2 was blocked on S1. S1 has been merged in PR #22, so the current product
detail runtime truth is now `src/constants/tucsenberg-product-pages.ts`.

## Goal

Retire the old `FamilySection` product-detail path after proving it no longer
has a production runtime entry.

## Current problem

The current `/products/[market]` page renders product detail content directly
from `TUCSENBERG_PRODUCT_PAGES`. The old path still exists:

- `src/app/[locale]/products/[market]/market-page-sections.tsx`
- `src/app/[locale]/products/[market]/market-spec-presenter.ts`
- `src/app/[locale]/products/[market]/cta-section.tsx`
- `src/app/[locale]/products/[market]/trust-signals-section.tsx`
- `src/components/products/family-section.tsx`
- `src/components/products/family-section.stories.tsx`
- `src/components/products/__tests__/family-section.test.tsx`

Those files make agents maintain a second product-detail presentation path that
does not drive the current buyer page.

## Design

- Prove first, then remove.
- Keep current public product routes, visible copy, CTA links, PDF downloads,
  metadata, BreadcrumbList, ProductGroup, and FAQPage behavior unchanged.
- Remove architecture-test allowlists that keep the old path alive.
- Retire old runtime files with `git rm` only after proof shows they have no
  production entry.
- Remove the paired story and tests for the retired component.
- Keep historical docs, but mark references to `market-page-sections.tsx` as
  historical / retired so they do not look like current architecture.
- Do not remove profile fixtures or product-spec compatibility fixtures unless
  proof shows the specific asset or fixture is only used by the retired path.

## Acceptance criteria

Given an agent searches for current product-detail rendering,
when it reads route and architecture tests,
then it finds `page.tsx`, `market-jsonld.ts`, `market-page-data.ts`, and
`TUCSENBERG_PRODUCT_PAGES`, not the old `FamilySection` path.

Given the old `FamilySection` path has no production runtime entry,
when the branch is reviewed,
then the retired files, story, and component tests are removed from the active
codebase.

Given historical docs mention `market-page-sections.tsx`,
when those docs are read,
then they clearly say the path is historical and retired.

Given current product routes are rendered after retirement,
when focused product tests and the build run,
then page headings, sections, CTA links, metadata, JSON-LD, and sitemap output
remain unchanged.

## Out of scope

- No Premium Engineering Procurement work.
- No production domain cutover.
- No S3 RFQ form refactor.
- No generic product mega-model.
- No deletion outside the S2 proof scope.
