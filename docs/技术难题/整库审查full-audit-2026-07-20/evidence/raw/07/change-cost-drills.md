# Lane 07 change-cost drills

All drills are static walkthroughs against `9ab5f6c4`; no business code was changed.

## 1. Add a product line

Expected authoring path:

1. add route/list identity in `src/config/single-site-product-catalog.ts`;
2. add SEO metadata in `src/constants/tucsenberg-product-meta.ts`;
3. add one typed product-page constant and register it in `src/constants/tucsenberg-product-pages.ts`;
4. decide whether it appears on Home and, if yes, update `src/config/single-site-page-expression.ts` plus `messages/profiles/catalog/en/messages.json`;
5. update product-count claims in active MDX/messages/product copy; current source contains 15 active authoring occurrences of `five product lines/classes/materials` outside generated files and tests;
6. add a diagram implementation only if no existing diagram kind fits.

Generated involvement: rerun the content manifest only when MDX changes. Message packs have no generated compatibility copy.

Existing protection: `tests/architecture/tucsenberg-product-pages.test.ts` catches catalog/product-page key drift; `src/config/__tests__/single-site-page-expression.test.ts` snapshots the current Home tuple. No check inventories the 15 count-bound marketing claims, so a sixth line can ship while some pages still say `five`.

Disposition: finding `FPH-L07-001` (duplicate product truth / silent copy drift).

## 2. Change a product specification

Concrete probe: change the TB-BW height range.

Independent production owners currently include:

- body/proof/spec table: `src/constants/tucsenberg-product-page-abs-flood-barriers.ts:29,37,114-146`;
- SEO description: `src/constants/tucsenberg-product-meta.ts:8-12`;
- diagram label: `src/components/products/product-diagrams.tsx:170-186`;
- comparison guide: `content/pages/en/flood-barrier-materials-guide.mdx:22-30`.

Tests snapshot individual surfaces (`product-diagrams.test.tsx`, market metadata tests), but no test proves the numeric claim is sourced once or remains equal across these owners. Content-manifest freshness only proves generated output matches MDX, not that MDX matches product constants.

Disposition: same root cause and finding as drill 1; do not create a broad product-schema framework. Prefer deleting unnecessary repeated numbers and passing the existing typed value only to surfaces that must display it.

## 3. Add an inquiry field

Intentional change path:

- UI label/error copy and physical message pack;
- `inquiry-form-fields.tsx`, `inquiry-payload.ts`, and success reset behavior;
- API allowlist in `src/app/api/inquiry/route.ts:76-89`;
- canonical Zod contract in `src/lib/lead-pipeline/lead-schema.ts:53-68`;
- explicit mappings to email and Airtable in `process-lead.ts` and their provider data types;
- focused form, route, schema, and canonical-channel tests.

This is broad but predictable: each touchpoint is a real trust, UI, or delivery boundary. `canonical-inquiry-contract.test.ts` already proves current buyer text reaches both owner-email and Airtable paths. The owner has also fixed the public form at three fields under R'13; adding a field is a product decision, not routine cleanup.

Disposition: Keep; no finding. Do not replace the explicit path with a config-driven universal form engine.

## 4. Swap the email provider

Provider-specific surface is concentrated in `src/lib/resend-core.tsx`, `src/lib/resend-instance.ts`, `src/lib/email/resend-http-client.ts`, Resend env/production checks, deploy secret wiring, and provider tests/docs. The business pipeline has one provider-specific import/call (`src/lib/lead-pipeline/process-lead.ts:20,100`) and consumes only success/failure, not Resend response types. Form, schema, product identity, Airtable mapping, and runtime email-content building can stay unchanged.

Disposition: Keep. A new provider interface/factory would add steps today; introduce one only when a second live provider exists or a swap branch proves repeated provider conditionals.

## 5. Add a locale

Required current surfaces:

- `LOCALES_CONFIG` plus time-zone/currency entries;
- three physical message packs and `STATIC_PACKS` imports in `src/lib/i18n/composed-messages.ts`;
- matching locale MDX and regenerated content manifest;
- route/SEO/release proof;
- locale-aware product-page copy/diagrams and transactional-email selection, which are currently English-owned in TS constants and `src/emails/email-copy.ts`.

Silent-drift risk is high if only locale routing and message packs are added: product detail prose and transactional email would remain English. This is not promoted as a new defect because the owner explicitly parked `add locale itself (email locale pipeline, route switch)` for a future locale PR in `docs/技术难题/整库审查2026-07/执行计划.md:471`.

Disposition: owner-deferred / adjudicated, not a finding. Future work must start with a locale behavior spec, not by copying `en` files alone.
