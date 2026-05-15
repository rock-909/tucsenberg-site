# Step 3 Product Compatibility Data Design

## Goal

Build Tucsenberg's static product and OEM compatibility data layer so Step 4 pages can query product families, product variants, OEM brands, OEM models, compatibility mappings, and part-number aliases without hard-coded page data.

## Approved direction

Use a **static TypeScript data module with Zod validation and generated in-memory indexes**.

This fits the PROJECT-BRIEF direction: Phase 1 product lookup is small enough for static TS/JSON-style data, does not need D1/KV, and must be easy for product pages and the homepage compatibility search to consume.

## Scope

### In scope

- Add typed Zod schemas for:
  - `ProductGroup`
  - `ProductVariant`
  - `OEMBrand`
  - `OEMModel`
  - `CompatibilityMapping`
- Add Phase 1 Tucsenberg product variants:
  - `TUC-D9-EPDM`
  - `TUC-D9-TPU`
  - `TUC-D12-EPDM`
  - `TUC-D7-EPDM`
  - `TUC-T62-EPDM`
  - `TUC-T62-TPU`
  - `TUC-T91-EPDM`
- Add Phase 1 OEM coverage:
  - Sanitaire / Xylem: Silver Series II disc, MT-2 tube
  - EDI: FlexAir T-Series tube, Threaded Disc
  - SSI Aeration: AFD270 disc, AFT tube
- Add compatibility mappings in both lookup directions:
  - brand -> models -> compatible Tucsenberg products
  - model -> compatible Tucsenberg products
  - product -> compatible OEM models
- Support search by OEM part number and model alias.
- Store OEM model search aliases explicitly so practical buyer inputs like `FlexAir 62x610` or `Sanitaire MT-2` do not depend on display names alone.
- Keep compatibility mapping checks and disclaimers localized with `en` / `es` / `zh`, because these fields can surface in Step 4 pages.
- Add Vitest QA coverage for schema validity, unique slugs, valid references, mapping confidence, brand coverage, and three-language fields.
- Update `DEVELOPMENT-LOG.md` with Step 3 completion and coverage counts after verification.

### Out of scope

- No pricing.
- No exact supplier performance parameters unless already present in source data.
- No page rendering or UI component work.
- No edits to `src/config/single-site-product-catalog.ts`.
- No copying the aeration-brand research archive into this repo.
- No new business claims about supplier capability, lead time, certifications, or superiority.

## Data boundaries

The data layer should expose structured facts, not marketing copy. It can carry short English descriptions because Step 4 needs page-ready product labels, but final page prose remains outside this step.

Spanish and Chinese fields may use placeholder prefixes as allowed by the task:

- Spanish: `[ES-TODO] ...`
- Chinese: `[ZH-TODO] ...`

Trademark disclaimers follow the approved format:

```text
[Brand] is a registered trademark of [Owner]. Tucsenberg is not affiliated with or endorsed by [Owner].
```

## Architecture

Create a focused data module under `src/data/product-compatibility/`:

- `schemas.ts` owns Zod schemas and exported TypeScript types.
- `catalog.ts` owns the static validated data arrays.
- `indexes.ts` derives lookup indexes and query helpers from the data arrays.
- `index.ts` re-exports the public API for Step 4 consumers.

Public lookup entries that mention an OEM brand/model must carry the brand trademark disclaimer with them, including product -> compatible OEM model results.

This keeps the existing starter catalog untouched and gives future pages a stable import surface:

```ts
import {
  compatibilityByBrand,
  compatibilityByModel,
  compatibilityByProduct,
  findCompatibilityMatches,
  productVariants,
} from "@/data/product-compatibility";
```

## Query behavior

`findCompatibilityMatches(query)` should support:

- OEM part numbers such as `00223`, `00326`, `AFD270-E`, `01691`.
- OEM model names such as `Sanitaire MT-2`, `Silver Series II`, `FlexAir 62x610`.
- Tucsenberg SKUs such as `TUC-D9-EPDM`.
- Case-insensitive matching and punctuation-insensitive matching for practical search input.

It returns model-index entries and product-index entries rather than rendering text.

## Testing

Add one focused Vitest file:

```text
src/data/product-compatibility/__tests__/product-compatibility.test.ts
```

Required proof:

- All static data passes Zod schemas.
- Slugs are unique inside each slug-bearing collection.
- Stable ids, SKUs, and OEM/product mapping pairs are unique.
- Every mapping points to an existing `oemModelId` and `productVariantId`.
- Every mapping has `confidence`.
- Every mapping pairs an OEM model with a product variant from the same product category.
- Every OEM brand has at least one compatibility mapping through its models.
- All localized fields have non-empty `en`, `es`, and `zh`.
- Indexes are keyed by slugs.
- Part-number, model alias, and SKU search can find Sanitaire/EDI/SSI examples.

## Acceptance commands

Run in order:

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm brand:check
pnpm content:check
pnpm build
pnpm website:build:cf
```

Do not run `pnpm build` and `pnpm website:build:cf` in parallel because both write `.next`.
