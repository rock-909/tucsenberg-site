# Step 3 Product Compatibility Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Tucsenberg's static product and OEM compatibility data layer for Step 4 page/query work.

**Architecture:** Keep the data layer under `src/data/product-compatibility/`, with Zod schemas in one file, static validated catalog data in one file, and derived indexes/query helpers in one file. Tests assert data integrity and lookup behavior before pages consume it.

**Tech Stack:** TypeScript strict, Zod v4, Vitest, static TS data modules.

---

## File structure and responsibilities

- Create: `src/data/product-compatibility/schemas.ts`
  - Zod schemas and exported inferred types.
- Create: `src/data/product-compatibility/catalog.ts`
  - Static ProductGroup, ProductVariant, OEMBrand, and OEMModel arrays, including explicit OEM model search aliases.
- Create: `src/data/product-compatibility/mappings.ts`
  - Static CompatibilityMapping arrays with localized required checks and localized compatibility disclaimers.
- Create: `src/data/product-compatibility/indexes.ts`
  - Brand/model/product indexes and search helpers.
- Create: `src/data/product-compatibility/index.ts`
  - Public re-export surface for Step 4.
- Create: `src/data/product-compatibility/__tests__/product-compatibility.test.ts`
  - QA tests for schema, references, i18n fields, coverage, and search.
- Modify: `DEVELOPMENT-LOG.md`
  - Mark Step 3 complete after verification and record coverage counts.

## Tasks

### Task 1: Write the data QA test first

- [ ] Create `src/data/product-compatibility/__tests__/product-compatibility.test.ts`.
- [ ] Assert schema parsing through exported Zod schemas.
- [ ] Assert slug uniqueness, reference validity, mapping confidence, brand coverage, i18n completeness, and part-number search.
- [ ] Run `pnpm exec vitest run src/data/product-compatibility/__tests__/product-compatibility.test.ts`.
- [ ] Confirm the test fails because the data module does not exist yet.

### Task 2: Add schemas and catalog data

- [ ] Create `schemas.ts` with the four-layer Zod model.
- [ ] Create `catalog.ts` with the seven confirmed Tucsenberg product variants.
- [ ] Add Sanitaire, EDI, and SSI OEM brands/models from the approved source.
- [ ] Add compatibility mappings with `fitStatus`, `confidence`, localized `requiredChecks`, and localized `disclaimer`.
- [ ] Run the focused test and fix schema/data issues until it passes.

### Task 3: Add indexes and search helpers

- [ ] Create `indexes.ts` with brand, model, product, and search indexes.
- [ ] Support case-insensitive and punctuation-insensitive part/model/SKU search.
- [ ] Carry OEM trademark disclaimers through all lookup entries that expose OEM brand/model data.
- [ ] Create `index.ts` public exports.
- [ ] Run the focused test again.

### Task 4: Update development log

- [ ] Update `DEVELOPMENT-LOG.md`.
- [ ] Mark Step 3 data layer complete.
- [ ] Record coverage counts: 3 OEM brands, 7 product variants, and the final mapping count.
- [ ] Keep Step 4 page/UI work listed as next work.

### Task 5: Full verification

- [ ] Run `pnpm type-check`.
- [ ] Run `pnpm lint:check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm brand:check`.
- [ ] Run `pnpm content:check`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm website:build:cf`.
- [ ] Summarize exact pass/fail evidence.
