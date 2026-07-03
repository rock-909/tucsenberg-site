# Tucsenberg B2B Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` in this session. Subagents are not used here because the available subagent tool requires explicit user authorization.

**Goal:** Convert this materialized catalog starter into the Phase 1 English-only Tucsenberg flood barrier B2B site described in `plans/goal-tucsenberg-site.md`.

**Architecture:** Keep the starter visual foundation and App Router shell. Replace the runtime profile with one English-only catalog site, map the existing `/products/[market]` surface to five product-line slugs, and add missing static routes for OEM, guides, RFQ, and warranty. Long-form owner-approved copy lives in MDX/content or typed product copy, while shared chrome and form labels stay in message/config surfaces.

**Tech Stack:** Next.js App Router, next-intl, TypeScript strict, MDX content, existing catalog/product-spec configuration, existing lead form/API path.

---

## Task 1: Behavior Guardrails

**Files:**
- Create tests covering Tucsenberg URL shape, English-only locale truth, forbidden public claims, and product catalog slugs.

Steps:
- [ ] Add failing tests for the 14 target public URLs and product slugs.
- [ ] Add failing tests that `LOCALES_CONFIG.locales` is English-only.
- [ ] Add a repository-content forbidden-claim test scoped to public-rendered source surfaces.
- [ ] Run the focused tests and confirm they fail on the current starter state.

## Task 2: Locale, Route, and Profile Truth

**Files:**
- Modify locale config, profile config, static page/path definitions, navigation, sitemap/SEO config.
- Add route owners for `/oem-wholesale/`, `/guides/flood-barrier-materials-guide/`, `/guides/flood-barrier-specifications/`, `/request-quote/`, and `/warranty/`.

Steps:
- [ ] Make runtime/tooling locale truth English-only.
- [ ] Add Phase 1 page types and canonical paths.
- [ ] Update active profile/static page set to the 14-page site.
- [ ] Remove starter-only navigation entries from the active site.

## Task 3: Brand, Assets, and Downloads

**Files:**
- Modify `src/config/single-site*.ts`.
- Add public logo/favicon/OG and PDF assets.
- Add route or header handling so PDF downloads emit `X-Robots-Tag: noindex`.

Steps:
- [ ] Replace brand facts with Tucsenberg facts.
- [ ] Clear placeholder social/sameAs links.
- [ ] Copy approved logo/PDF assets into public paths.
- [ ] Add a focused test or header proof for PDF noindex.

## Task 4: Content Pages

**Files:**
- Modify/create `content/pages/en/*.mdx`.
- Add route files that render MDX static pages where missing.

Steps:
- [ ] Move approved About, OEM, guide, warranty, privacy, and terms copy into MDX.
- [ ] Keep Chinese implementation notes out of public pages.
- [ ] Preserve `TODO-OWNER` where owner data is missing.
- [ ] Ensure FAQ questions render as H3 where FAQ JSON-LD is emitted.

## Task 5: Product Catalog Remap

**Files:**
- Modify `src/config/single-site-product-catalog.ts`.
- Replace product specs under `src/constants/product-specs/**` or equivalent typed catalog data.
- Update product page rendering only as much as needed to show the approved product copy, HTML tables, CTAs, FAQ, and Product JSON-LD without prices.

Steps:
- [ ] Map the old `[market]` dimension to five product-line slugs.
- [ ] Fill spec tables from owner-approved copy only.
- [ ] Keep product JSON-LD price-free.
- [ ] Explain the mapping choice in `plans/handoff-report.md`.

## Task 6: RFQ and Contact Flow

**Files:**
- Modify form UI/message/config/validation only where required.
- Add `/request-quote/` page.

Steps:
- [ ] Present the 10 owner-approved RFQ fields.
- [ ] Keep submission through the existing safe contact/lead path unless a route change is unavoidable.
- [ ] Add or update tests for field presence and successful event/success copy where feasible.

## Task 7: Verification and Handoff

**Files:**
- Create `plans/handoff-report.md`.

Steps:
- [ ] Run focused tests during development, then `pnpm type-check`, `pnpm lint:check`, `pnpm test`, and `pnpm website:build:cf` before completion.
- [ ] Run `pnpm brand:check` and `pnpm content:check`; record pass or exact differences.
- [ ] Run forbidden-claim grep/test over public surfaces.
- [ ] Render or otherwise verify all 14 URLs after build.
- [ ] Write mapping scheme, TODO-OWNER list, verification summary, and owner launch items in `plans/handoff-report.md`.
