# Step 4: Four-Page Templates Implementation Plan (v3 — B data layer)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan MUST be executed by Claude (not Codex) because Tasks 6-9 use `/impeccable` slash commands. Tasks 1-5 are standard TDD. **Do NOT skip the user-confirmation checkpoints: the data-framing checkpoint in Task 2, and the shape-phase checkpoint in Tasks 6-9.**

**Goal:** Build the first four real Tucsenberg pages (home, product detail, OEM compatibility, RFQ quote) in EN/ES/ZH, wired to the **`@/data/product-compatibility`** data layer (the canonical layer on `origin/main`), after a data-cleanup pass, validated against DESIGN.md v1.1, with working RFQ submission and a global ⌘K compatibility search.

**Architecture:** The canonical data layer is `src/data/product-compatibility/` (catalog + mappings + schemas + prebuilt indexes). It is consumed through the barrel `@/data/product-compatibility`. Order: (1) routes/nav infra, (2) **data cleanup** — reconcile part numbers against the teardown source of truth and fill ES/ZH translations, (3) thin slug accessors + ⌘K search using the existing `findCompatibilityMatches`, (4) UI i18n namespaces, (5) per-page impeccable builds, (6) cross-cutting verification. Pages are App Router Server Components under `src/app/[locale]/`; client interactivity (search modal, RFQ form, tabs/filters) is pushed to leaf Client Components.

**Tech Stack:** Next.js 16.2.6, React 19.2.6, TypeScript 6.0.3, Tailwind CSS 4.3.0, Radix Themes 3.3.0, next-intl, Vitest, impeccable design skill.

**Design Reference:** `DESIGN.md` v1.1 — §3 (colors), §4 (typography), §6 (components), §7 (page templates + cross-page interaction patterns).

**Data source of truth for cleanup:** `/Users/Data/workspace/aeration-brand/catalog/oem-product-teardown.md` (read-only cross-reference; do NOT copy it into this repo).

---

## Canonical data layer — API contract (read before any task)

Import everything from the barrel: `import { ... } from "@/data/product-compatibility"`.

**Raw arrays:** `oemBrands`, `oemModels`, `productGroups`, `productVariants`, `compatibilityMappings`.

**Prebuilt indexes (slug-keyed `Record`s):**
- `compatibilityByModel: Record<modelSlug, ModelCompatibilityEntry>`
- `compatibilityByProduct: Record<variantSlug, ProductCompatibilityEntry>`
- `compatibilityByBrand: Record<brandSlug, BrandCompatibilityEntry>`
- `findCompatibilityMatches(query: string): { models: ModelCompatibilityEntry[]; products: ProductCompatibilityEntry[] }` — normalized fuzzy search (lowercases + strips non-alphanumeric) across model id/slug/name, brand id/slug/name, `oemPartNumbers`, `searchAliases`, model spec strings; and product id/slug/sku, name (en/es/zh), material.

**Entry shapes (from `indexes.ts`):**
- `ModelCompatibilityEntry`: `modelId, modelSlug, modelName (string), brandId, brandSlug, brandName (string), trademarkDisclaimer (LocalizedText), category ("disc"|"tube"), oemPartNumbers (string[]), searchAliases (string[]), specs ({diameter?, length?, connectionStyle?} all string), compatibleProducts: CompatibleProductEntry[]`
- `CompatibleProductEntry`: `id, slug, sku, name (LocalizedText), material ("epdm"|"tpu"), fitStatus ("exact"|"verify-dimensions"|"custom"), confidence ("high"|"medium"|"low"), requiredChecks (LocalizedText[]), disclaimer (LocalizedText)`
- `ProductCompatibilityEntry`: `productVariantId, productSlug, sku, name (LocalizedText), material, category, compatibleOemModels: CompatibleOEMModelEntry[]`
- `CompatibleOEMModelEntry`: `modelId, modelSlug, modelName, brandId, brandSlug, brandName, trademarkDisclaimer, category, oemPartNumbers, searchAliases, specs, fitStatus, confidence, requiredChecks, disclaimer`
- `BrandCompatibilityEntry`: `brandId, brandSlug, brandName, trademarkDisclaimer, models: ModelCompatibilityEntry[]`

**Exact slugs (use these literally — they differ from the abandoned `src/data/` layer):**
- Variant slugs: `tuc-d9-epdm`, `tuc-d9-tpu`, `tuc-d12-epdm`, `tuc-d7-epdm`, `tuc-t62-epdm`, `tuc-t62-tpu`, `tuc-t91-epdm`
- Brand slugs: `sanitaire`, `edi`, `ssi-aeration`
- Counts: 2 product groups, 7 variants, 3 brands, 11 OEM models, 18 compatibility mappings.

**Field reality (do not assume A-layer richness):** product variant `specs` only has `diameter` (free-text string, e.g. `'9" / 228.6 mm nominal membrane class'`). There is **no** structured temperature/shore/tensile on variants. OEM model `specs` has free-text `diameter`/`length`/`connectionStyle`. Facet filtering must use the **structured** fields `category` (disc/tube) and `material` (epdm/tpu) — not free-text diameter.

---

## Deferred / tracked follow-ups

- **Dynamic-route sitemapping** for `membraneProduct` (`/membranes/[product]`) and `compatibleBrand` (`/compatible/[brand]`): product/brand pages are not in `sitemap.xml` after Task 1 (same status as the existing `productMarket` dynamic route until its generator runs). Wiring a dynamic sitemap generator that mirrors `generateCatalogEntries` in `src/app/sitemap.ts` (emit per-variant-slug and per-brand-slug URLs) is handled in **Task 10 Step 6a** below, after the real page files exist. Until then, no fake static `/membranes` path is registered.
- **`quote` PENDING_ROUTE_OWNERS exception:** the single-entry existence-skip added in Task 1 Step 7 must be removed once `src/app/[locale]/quote/page.tsx` exists (after Task 9). Removal is an explicit step in Task 10 Step 7.

## File Structure

### Infrastructure (Tasks 1, 3, 4)

| File | Action | Responsibility |
|---|---|---|
| `src/config/paths/types.ts` | Modify | Add `membranes`, `quote` to PageType; add `membraneProduct`, `compatibleBrand` to DynamicPageType |
| `src/config/pages.config.ts` | Modify | Add page definitions + SEO key union entries for membranes + quote |
| `src/config/paths/paths-config.ts` | Modify | Add dynamic route patterns for `membraneProduct` + `compatibleBrand` |
| `src/config/single-site-links.ts` | Modify | Add `membranes` + `quote` href entries |
| `src/config/single-site-navigation.ts` | Modify | Point nav to real B-layer pages (not #coming-soon) |
| `src/data/product-compatibility/accessors.ts` | Create | Thin safe slug getters (wrap the `Record` indexes) |
| `src/data/product-compatibility/index.ts` | Modify | Re-export accessors |
| `src/data/product-compatibility/__tests__/accessors.test.ts` | Create | Accessor tests |
| `src/components/search/compatibility-search.tsx` | Create | Global ⌘K search modal (Client Component) |
| `src/components/search/use-search-hotkey.ts` | Create | ⌘K / Ctrl+K hook |
| `src/components/search/__tests__/compatibility-search.test.tsx` | Create | Search behavior tests |
| `src/app/[locale]/layout.tsx` | Modify | Wire global search trigger into layout |
| `messages/en/critical.json` | Modify | Add page-level i18n namespaces |
| `messages/es/critical.json` | Modify | Spanish translations |
| `messages/zh/critical.json` | Modify | Chinese translations |

### Data cleanup (Task 2)

| File | Action | Responsibility |
|---|---|---|
| `src/data/product-compatibility/catalog.ts` | Modify | Reclassify part numbers vs teardown; fill ES/ZH names + disclaimers |
| `src/data/product-compatibility/mappings.ts` | Modify | Fill ES/ZH `disclaimer` + `requiredChecks` (remove `[ES-TODO]`/`[ZH-TODO]`) |
| `src/data/product-compatibility/__tests__/data-cleanup.test.ts` | Create | Guards: no `[ES-TODO]`/`[ZH-TODO]`, no competitor/ASIN tokens in `oemPartNumbers` |

### Pages (Tasks 6-9, created by impeccable)

| Route | File | Data Source |
|---|---|---|
| `/` (home) | `src/app/[locale]/page.tsx` (replace) | `oemBrands`, `findCompatibilityMatches()` |
| `/membranes/[product]` | `src/app/[locale]/membranes/[product]/page.tsx` (create) | `getProductCompatibility(slug)` |
| `/compatible/[brand]` | `src/app/[locale]/compatible/[brand]/page.tsx` (create) | `getBrandCompatibility(slug)` |
| `/quote` | `src/app/[locale]/quote/page.tsx` (create) | URL searchParams for pre-fill |

### Quote backend (Task 9a)

| File | Action | Responsibility |
|---|---|---|
| `src/lib/lead-pipeline/lead-schema.ts` | Modify | Add `rfqLeadSchema` |
| `src/app/api/quote/route.ts` | Create | RFQ submission endpoint |
| `src/app/api/quote/__tests__/quote-api.test.ts` | Create | API behavior tests |

---

## Task 1: Route and navigation infrastructure

**Files:**
- Modify: `src/config/paths/types.ts`
- Modify: `src/config/pages.config.ts`
- Modify: `src/config/paths/paths-config.ts`
- Modify: `src/config/single-site-links.ts`
- Modify: `src/config/single-site-navigation.ts`

- [ ] **Step 1:** Read all five files above plus `src/config/pages.config.ts`'s `PublicStaticPageSeoKey` union to learn the exact current shapes (the union member list and `PUBLIC_STATIC_PAGE_DEFINITIONS` entry shape may have drifted; match the existing entries exactly).

> **Modeling rule (do not deviate):** `membranes` is NOT a static page. There is no `/membranes` index page in Step 4 scope; the nav item "Membranes" points directly at a product instance (`/membranes/tuc-d9-epdm`), which is the `membraneProduct` **dynamic** route. Mirror exactly how `compatible` is handled: no `compatible` PageType / no static definition, only the `compatibleBrand` dynamic pattern. Apply the same to `membranes`/`membraneProduct`. Only `quote` is a real new static page. Registering `membranes` as a static page with `sitemap.include` would ship a dead `/membranes` 404 URL in `sitemap.xml`. Sitemapping of product/brand dynamic routes is a tracked follow-up (see "Deferred / tracked follow-ups"), not part of Task 1.

- [ ] **Step 2:** In `src/config/paths/types.ts`, add **only** `"quote"` to the `PageType` union (do NOT add `"membranes"` — mirror `compatible` which is not a PageType), and add `"membraneProduct"` and `"compatibleBrand"` to the `DynamicPageType` union. Keep all existing members.

- [ ] **Step 3:** In `src/config/pages.config.ts`, add **one** entry to `PUBLIC_STATIC_PAGE_DEFINITIONS` (only `quote`), following the exact shape of the existing entries (copy an existing entry's field set; do not invent fields):

```typescript
{
  pageType: "quote",
  localizedPaths: localizedPath("/quote"),
  navigationKey: "navigation.quote",
  seoKey: "content.pages.quote",
  sitemap: { include: true, changeFrequency: "monthly", priority: 0.85 },
  lastmod: { source: "static", iso: STATIC_PAGE_LASTMOD_ISO },
  mdxCollection: null,
  routeOwner: "src/app/[locale]/quote/page.tsx",
},
```

Add **only** `"content.pages.quote"` to the `PublicStaticPageSeoKey` union (no `catalog.membranes`). If `localizedPath`, `STATIC_PAGE_LASTMOD_ISO`, or the field names differ from the above, adapt to the file's real helpers/shape discovered in Step 1.

- [ ] **Step 4:** In `src/config/paths/paths-config.ts`, add to `DYNAMIC_PATHS_CONFIG` (keep existing entries, match the existing `Object.freeze` pattern):

```typescript
membraneProduct: Object.freeze({
  pattern: "/membranes/[product]",
  paramName: "product",
}),
compatibleBrand: Object.freeze({
  pattern: "/compatible/[brand]",
  paramName: "brand",
}),
```

- [ ] **Step 5:** In `src/config/single-site-links.ts`, add to `SINGLE_SITE_ROUTE_HREFS`:

```typescript
membranes: getCanonicalPath("membranes"),
quote: getCanonicalPath("quote"),
```

Use whatever canonical-path helper the file already uses for sibling entries (match the existing pattern; the helper name may differ).

- [ ] **Step 6:** In `src/config/single-site-navigation.ts`, point nav at real B-layer pages. **Use these exact slugs** (`tuc-d9-epdm`, `sanitaire`):

```typescript
export const SINGLE_SITE_NAVIGATION: SiteNavigationItem[] = [
  {
    key: "membranes",
    href: "/membranes/tuc-d9-epdm",
    translationKey: "navigation.membranes",
  },
  {
    key: "compatibility",
    href: "/compatible/sanitaire",
    translationKey: "navigation.compatibility",
  },
  {
    key: "materials",
    href: SINGLE_SITE_ROUTE_HREFS.comingSoon,
    translationKey: "navigation.materials",
  },
  {
    key: "quote",
    href: SINGLE_SITE_ROUTE_HREFS.quote,
    translationKey: "navigation.quote",
  },
];
```

Match the real `SiteNavigationItem` shape and existing item fields found in Step 1.

- [ ] **Step 7 — Twin tests + architecture contract.** Adding the dynamic page types forces `DYNAMIC_ROUTE_BUILDERS` entries in `src/lib/i18n/route-parsing.ts` (single-param builders, mirror `productMarket`/`blogArticle`), and updates to twin/contract tests that pin the type/href/path sets. Update those tests to assert the **new correct behavior** (real hrefs, the new `quote` static type, the two new dynamic types) — never weaken or delete an assertion to make it pass. For `tests/architecture/static-public-pages-contract.test.ts` and `src/config/__tests__/pages-config.test.ts`: the only not-yet-built static route owner is `src/app/[locale]/quote/page.tsx` (built in Task 9). Keep the **original** `routeOwner` regex unchanged (`quote`'s owner is a normal single-segment `…/quote/page.tsx` path that already matches it — do NOT widen the regex to allow dynamic `[..]` segments). Add a single-entry exception that skips only the `existsSync`/`repoFileExists` check for exactly `"src/app/[locale]/quote/page.tsx"`, with a comment pointing at Task 9 and Task 10 Step 7 for its removal. Do not duplicate the exception across files unless unavoidable; if both files need it, define it once and export/import it.

- [ ] **Step 8:** Run `pnpm type-check` — expect zero errors.

- [ ] **Step 9:** Run `pnpm exec prettier --write src/config/`

- [ ] **Step 10:** Commit:

```bash
git add -A
git commit -m "feat(routes): register quote static route and product/brand dynamic routes"
```

---

## Task 2: Data cleanup — reconcile part numbers and fill translations

**Why:** On the canonical layer, `catalog.ts` and `mappings.ts` ship with (a) `[ES-TODO]`/`[ZH-TODO]` placeholders in every ES/ZH field, and (b) competitor/retail identifiers mis-filed into `oemPartNumbers` (AerationStore SKUs `MM01/MM02/MM03/MM11`, Amazon ASIN `B07KBHGX2V`). The site is a part-number problem solver — surfacing a competitor's SKU as an "OEM part number" is a credibility risk. Reconcile against the teardown source of truth before any page is built on this data.

**Files:**
- Modify: `src/data/product-compatibility/catalog.ts`
- Modify: `src/data/product-compatibility/mappings.ts`
- Create: `src/data/product-compatibility/__tests__/data-cleanup.test.ts`

- [ ] **Step 1 — Read source of truth.** Read `/Users/Data/workspace/aeration-brand/catalog/oem-product-teardown.md` in full. The authoritative tables: §一 EDI T-Series (lines ~26-41), Threaded Disc (~47-54), Disc Membrane Replacements (~76-82), Tube Membrane Replacements (~90-121); §二 SSI (AFD270 / AFT, Amazon ASIN table ~175-179); §三 Sanitaire (~245-251); §四 AerationStore MM SKUs (~261-282).

- [ ] **Step 2 — STOP for user confirmation (data-framing decision).** Present this decision to the user and wait for an answer. Do not proceed to Step 3 until answered:

  > Three OEM models carry non-OEM identifiers in `oemPartNumbers`. Per the teardown:
  > - `sanitaire-silver-series-ii-9-inch-disc`: `["00223", "MM01", "MM02", "MM03"]` — `00223` is EDI's real universal 9" cross-reference replacement number (keep, it is the single most valuable search token per the teardown's key finding). `MM01/02/03` are AerationStore (a competitor store) price-break SKUs — propose **remove**.
  > - `ssi-afd270-9-inch-disc`: `["AFD270", "AFD270-E", "B07KBHGX2V"]` — `AFD270`/`AFD270-E` are real SSI model/membrane designations (keep). `B07KBHGX2V` is an Amazon ASIN for a competitor retail listing — propose **remove from `oemPartNumbers`** (a B2B buyer never searches an ASIN).
  > - `ssi-aft-62-mm-tube`: `["AFT-N2500-E", "MM11"]` — `AFT-N2500-E` real (keep). `MM11` is an AerationStore SKU — propose **remove**.
  >
  > Also: should cross-reference numbers like EDI `00223` shown under a *Sanitaire* model be labeled in the UI as "Cross-reference / interchange number" rather than implying Sanitaire sells it? (Recommended: yes — a footnote/label, handled in the page tasks.)
  >
  > Confirm: (A) remove the three competitor/ASIN groups as proposed, keep verified OEM + cross-ref numbers, OR (B) a different policy you specify.

- [ ] **Step 3 — Write the guard test** `src/data/product-compatibility/__tests__/data-cleanup.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { oemBrands, oemModels, compatibilityMappings, productVariants, productGroups } from "@/data/product-compatibility";

const PLACEHOLDER = /\[(ES|ZH)-TODO\]/;
// Competitor/retail identifier shapes that must not appear as OEM part numbers.
const FORBIDDEN_PART_TOKENS = [/^MM\d+$/i, /^B0[A-Z0-9]{8}$/]; // AerationStore MM SKUs, Amazon ASIN

function localizedClean(value: { en: string; es: string; zh: string }) {
  return (
    !PLACEHOLDER.test(value.es) &&
    !PLACEHOLDER.test(value.zh) &&
    value.es.trim().length > 0 &&
    value.zh.trim().length > 0
  );
}

describe("product-compatibility data cleanup", () => {
  it("has no [ES-TODO]/[ZH-TODO] placeholders in any localized field", () => {
    for (const b of oemBrands) expect(localizedClean(b.trademarkDisclaimer)).toBe(true);
    for (const g of productGroups) {
      expect(localizedClean(g.name)).toBe(true);
      expect(localizedClean(g.description)).toBe(true);
    }
    for (const v of productVariants) expect(localizedClean(v.name)).toBe(true);
    for (const m of compatibilityMappings) {
      expect(localizedClean(m.disclaimer)).toBe(true);
      for (const c of m.requiredChecks) expect(localizedClean(c)).toBe(true);
    }
  });

  it("has no competitor SKUs or Amazon ASINs in oemPartNumbers", () => {
    for (const model of oemModels) {
      for (const pn of model.oemPartNumbers) {
        for (const forbidden of FORBIDDEN_PART_TOKENS) {
          expect(forbidden.test(pn), `${model.id} has forbidden part number ${pn}`).toBe(false);
        }
      }
    }
  });
});
```

- [ ] **Step 4 — Run the test:** `pnpm test src/data/product-compatibility/__tests__/data-cleanup.test.ts` — expect FAIL on both assertions.

- [ ] **Step 5 — Reclassify part numbers** in `src/data/product-compatibility/catalog.ts` per the user's Step 2 answer. With answer (A): delete `"MM01","MM02","MM03"` from `sanitaire-silver-series-ii-9-inch-disc`; delete `"B07KBHGX2V"` from `ssi-afd270-9-inch-disc`; delete `"MM11"` from `ssi-aft-62-mm-tube`. Do not alter any number that the teardown corroborates as a real OEM/EDI cross-reference (e.g. `00223`, `01798`, `07228`, the EDI T-Series numbers). `oemPartNumbers` may become `[]` for a model if it has no verified OEM number — that is acceptable; `searchAliases` still makes it findable.

- [ ] **Step 6 — Fill ES/ZH translations** in `catalog.ts` (product group `name`/`description`, variant `name`, brand `trademarkDisclaimer`) and `mappings.ts` (`oemCompatibilityDisclaimer`, every `check(...)` value). Translation rules: keep technical tokens in English (EPDM, TPU, OEM, SKU, mm, NPT, part numbers, brand/model names); ES = natural professional Spanish; ZH = 简体中文, 工程化语气; no marketing adjectives ("high quality / premium / better"); TPU described by 工况适配 (oil/chemical/grease conditions), never as superior to EPDM. The shared `check()` helper in `mappings.ts` currently auto-prefixes `[ES-TODO]`/`[ZH-TODO]`; replace it with a real trilingual object literal per check, or refactor `check()` to take `(en, es, zh)`.

- [ ] **Step 7 — Run the guard test + full data tests:**

```bash
pnpm test src/data/product-compatibility/
```

Expect the new cleanup test PASS and the existing `product-compatibility.test.ts` PASS (schema `.parse()` still validates at module load).

- [ ] **Step 8 — Run** `pnpm exec prettier --write src/data/product-compatibility/` then `pnpm type-check`.

- [ ] **Step 9 — Commit:**

```bash
git add src/data/product-compatibility/
git commit -m "fix(data): reconcile oem part numbers and complete es/zh translations"
```

---

## Task 3: Slug accessors

**Files:**
- Create: `src/data/product-compatibility/accessors.ts`
- Modify: `src/data/product-compatibility/index.ts`
- Create: `src/data/product-compatibility/__tests__/accessors.test.ts`

The route params are slugs. The prebuilt indexes are slug-keyed `Record`s; pages need safe getters that return `undefined` for unknown slugs (so route handlers can `notFound()`), instead of raw `Record` access.

- [ ] **Step 1 — Write failing tests** `src/data/product-compatibility/__tests__/accessors.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  getProductCompatibility,
  getBrandCompatibility,
  getModelCompatibility,
} from "@/data/product-compatibility";

describe("getProductCompatibility", () => {
  it("resolves a known variant slug", () => {
    expect(getProductCompatibility("tuc-d9-epdm")?.sku).toBe("TUC-D9-EPDM");
  });
  it("returns undefined for unknown slug", () => {
    expect(getProductCompatibility("nope")).toBeUndefined();
  });
});

describe("getBrandCompatibility", () => {
  it("resolves a known brand slug", () => {
    expect(getBrandCompatibility("sanitaire")?.brandName).toBe("Sanitaire");
  });
  it("returns undefined for unknown slug", () => {
    expect(getBrandCompatibility("nope")).toBeUndefined();
  });
});

describe("getModelCompatibility", () => {
  it("resolves a known model slug", () => {
    expect(
      getModelCompatibility("sanitaire-silver-series-ii-9-inch-disc")?.modelId,
    ).toBe("sanitaire-silver-series-ii-9-inch-disc");
  });
  it("returns undefined for unknown slug", () => {
    expect(getModelCompatibility("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2 — Run tests:** `pnpm test src/data/product-compatibility/__tests__/accessors.test.ts` — expect FAIL (module not found).

- [ ] **Step 3 — Implement** `src/data/product-compatibility/accessors.ts`:

```typescript
import {
  compatibilityByBrand,
  compatibilityByModel,
  compatibilityByProduct,
  type BrandCompatibilityEntry,
  type ModelCompatibilityEntry,
  type ProductCompatibilityEntry,
} from "@/data/product-compatibility/indexes";

export function getProductCompatibility(
  slug: string,
): ProductCompatibilityEntry | undefined {
  return compatibilityByProduct[slug];
}

export function getBrandCompatibility(
  slug: string,
): BrandCompatibilityEntry | undefined {
  return compatibilityByBrand[slug];
}

export function getModelCompatibility(
  slug: string,
): ModelCompatibilityEntry | undefined {
  return compatibilityByModel[slug];
}
```

- [ ] **Step 4 — Re-export** from `src/data/product-compatibility/index.ts` (append, keep existing exports):

```typescript
export {
  getBrandCompatibility,
  getModelCompatibility,
  getProductCompatibility,
} from "@/data/product-compatibility/accessors";
```

- [ ] **Step 5 — Run tests:** `pnpm test src/data/product-compatibility/` — all pass.

- [ ] **Step 6 — Run** `pnpm exec prettier --write src/data/product-compatibility/` then `pnpm type-check`.

- [ ] **Step 7 — Commit:**

```bash
git add src/data/product-compatibility/
git commit -m "feat(data): add safe slug accessors for compatibility indexes"
```

---

## Task 4: i18n namespace scaffolding

**Files:**
- Modify: `messages/en/critical.json`
- Modify: `messages/es/critical.json`
- Modify: `messages/zh/critical.json`

Add the three **additive** page-level UI namespaces only (chrome/labels — data-driven text comes from the Task 2 cleaned data layer).

> **Sequencing correction (do not deviate):** Do NOT touch the existing `home.*` namespace in this task. On this branch the starter homepage (`src/app/[locale]/page.tsx`) and ~10 `src/components/sections/*` components actively consume the old `home.*` keys; replacing them here would break the site and many tests. The new `home.*` UI namespace is introduced in **Task 6**, atomically with the home-page rewrite and retirement of the old starter sections. This task only ADDS `membraneProduct`, `compatibleBrand`, `quote` — zero conflict with existing keys.
>
> **Locale files:** all three split files exist and must stay key-identical: `messages/en/critical.json`, `messages/es/critical.json`, `messages/zh/critical.json`. Add the new namespaces to all three.

**Important:** Do NOT promise a lead time — 品弘交期未确认. Use "Lead time confirmed during quote review" / "Within 2 business days" only.

- [ ] **Step 1 — Read** `messages/en/critical.json`, `messages/es/critical.json`, `messages/zh/critical.json` to learn nesting/format/ordering conventions. Do not modify `home.*`.

- [ ] **Step 2 — Add** the `membraneProduct`, `compatibleBrand`, `quote` namespaces to `messages/en/critical.json` (additive; place per existing ordering; leave `home.*` and all other namespaces untouched):

```json
"membraneProduct": {
  "hero": { "overline": "REPLACEMENT MEMBRANE", "specBar": { "diameter": "Diameter", "material": "Material", "category": "Type", "sku": "SKU" } },
  "compatibility": {
    "title": "Compatible OEM Models",
    "description": "This membrane is a planned replacement for the following OEM diffuser models. Confirm dimensions and hardware before ordering.",
    "crossRefNote": "Numbers shown are OEM or published cross-reference / interchange numbers, not numbers sold by the OEM.",
    "fitStatus": { "exact": "Exact Fit", "verify-dimensions": "Verify Dimensions", "custom": "Custom" },
    "confidence": { "high": "High Confidence", "medium": "Medium Confidence", "low": "Low Confidence" },
    "requiredChecks": "Buyer Must Verify",
    "noChecksRequired": "No additional verification required"
  },
  "cta": { "requestQuote": "Request Quote for This Part", "viewGroup": "View All Sizes" }
},
"compatibleBrand": {
  "hero": { "overline": "OEM COMPATIBILITY", "description": "Replacement membranes for {brand} aeration diffusers." },
  "disclaimer": "Trademark Disclaimer",
  "filter": { "all": "All", "disc": "Disc Models", "tube": "Tube Models", "material": "Material", "materialAll": "All Materials" },
  "results": {
    "compatibleProduct": "Compatible Tucsenberg Replacement",
    "partNumbers": "OEM / Cross-Reference Numbers",
    "fitStatus": "Fit Status",
    "confidence": "Confidence",
    "requiredChecks": "Buyer Must Verify",
    "noChecksRequired": "No additional verification required",
    "requestQuote": "Request Quote for This Part",
    "empty": "No models match the selected filters."
  }
},
"quote": {
  "hero": { "title": "Request a Quote", "description": "Tell us what you need. We review your request and respond within 2 business days." },
  "form": {
    "partNumbers": "Part Number(s) or OEM Model",
    "partNumbersHint": "Enter Tucsenberg SKU, OEM part number, or model name",
    "quantity": "Quantity",
    "quantityHint": "Approximate quantity needed",
    "company": "Company / Organization",
    "email": "Email",
    "name": "Full Name",
    "country": "Country",
    "material": "Preferred Material",
    "materialOptions": { "epdm": "EPDM", "tpu": "TPU", "notSure": "Not sure — advise me" },
    "shutdownDate": "Shutdown Date / Urgency",
    "shutdownDateHint": "When do you need the membranes installed?",
    "notes": "Additional Notes",
    "fileUpload": "Upload Part List or Photos",
    "fileUploadHint": "CSV, PDF, or images (max 10MB)",
    "submit": "Submit Quote Request",
    "submitting": "Submitting..."
  },
  "summary": {
    "title": "Your Request Summary",
    "empty": "Add details to see your request summary",
    "leadTime": "Lead Time",
    "leadTimeValue": "Confirmed during quote review",
    "responseTime": "Response Time",
    "responseTimeValue": "Within 2 business days"
  },
  "success": { "title": "Quote Request Submitted", "description": "We received your request and will respond to {email} within 2 business days." }
}
```

- [ ] **Step 3 — Add Spanish** the same three namespaces to `messages/es/critical.json`: natural professional Spanish, technical tokens stay English (EPDM/TPU/OEM/SKU/CSV/PDF/MB), ICU `{brand}`/`{email}` placeholders unchanged. No `[ES-TODO]`. Examples: "Request a Quote" → "Solicitar cotización"; "Compatible OEM Models" → "Modelos OEM compatibles"; "Exact Fit" → "Ajuste exacto"; "Verify Dimensions" → "Verificar dimensiones"; "Buyer Must Verify" → "El comprador debe verificar".

- [ ] **Step 4 — Add Chinese** the same three namespaces to `messages/zh/critical.json`: 简体中文 工程化语气. No `[ZH-TODO]`. Examples: "Request a Quote" → "询价"; "Compatible OEM Models" → "兼容 OEM 型号"; "Exact Fit" → "精确匹配"; "Verify Dimensions" → "需核对尺寸"; "Buyer Must Verify" → "买方须确认".

- [ ] **Step 5 — Run** `pnpm content:check` and `pnpm type-check` — all three locales must have identical key structure; zero type errors.

- [ ] **Step 6 — Commit** (only `messages/`, not `git add -A`):

```bash
git add messages/
git commit -m "feat(i18n): add product, compatible, and quote page namespaces" -m "Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Global ⌘K compatibility search component

**Files:**
- Create: `src/components/search/use-search-hotkey.ts`
- Create: `src/components/search/compatibility-search.tsx`
- Create: `src/components/search/__tests__/compatibility-search.test.tsx`
- Modify: `src/app/[locale]/layout.tsx`

Uses the existing `findCompatibilityMatches()` — do **not** write a new search function.

- [ ] **Step 1 — Write failing tests** `src/components/search/__tests__/compatibility-search.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompatibilitySearchModal } from "@/components/search/compatibility-search";

describe("CompatibilitySearchModal", () => {
  it("renders a searchbox when open", () => {
    render(<CompatibilitySearchModal isOpen onClose={() => {}} />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("does not render a searchbox when closed", () => {
    render(<CompatibilitySearchModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("shows OEM model results for a valid query", async () => {
    render(<CompatibilitySearchModal isOpen onClose={() => {}} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "00223" } });
    expect(await screen.findByText(/9 inch Disc/i)).toBeInTheDocument();
  });

  it("shows an empty state for no matches", async () => {
    render(<CompatibilitySearchModal isOpen onClose={() => {}} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "ZZZZZ" } });
    expect(await screen.findByText(/no (results|matches)/i)).toBeInTheDocument();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<CompatibilitySearchModal isOpen onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2 — Run tests:** `pnpm test src/components/search/` — expect FAIL.

- [ ] **Step 3 — Implement** `src/components/search/use-search-hotkey.ts`: a hook `useSearchHotkey(onOpen: () => void)` that adds a `keydown` listener for `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"`, calls `e.preventDefault()` + `onOpen()`, and cleans up on unmount.

- [ ] **Step 4 — Implement** `src/components/search/compatibility-search.tsx`:
  - `"use client"`.
  - `CompatibilitySearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void })`.
  - Internal `query` state; on change compute `findCompatibilityMatches(query)` (import from `@/data/product-compatibility`) when `query.trim()` length ≥ 2, else empty.
  - Renders nothing when `!isOpen`. When open: an overlay + a boxed panel (DESIGN.md §6/§7: `rounded-[6px]` input, `border-input`, teal `focus-visible:ring-ring/20`; panel `rounded-lg`; no pill, no `rounded-full`).
  - Input has `role="searchbox"` (use `type="search"` with an `aria-label` from i18n, or the search input wrapper).
  - Results: `models[]` → each row shows `modelName`, `brandName`, part numbers in `type-part-number` mono, and links to `/compatible/{brandSlug}`. `products[]` → link to `/membranes/{productSlug}`. Each model row also offers a "Request quote" link to `/quote?partNumber={firstPartNumber}&model={modelSlug}`.
  - Empty state when query ≥ 2 and both arrays empty: a "no results" message (must satisfy the test regex `/no (results|matches)/i`).
  - Escape key and overlay click call `onClose()`.
  - All user-facing strings via `next-intl` (`home.hero.*` for placeholder, a small `search.*` namespace if needed — if you add keys, add them to all three `messages/*/critical.json` and re-run `pnpm content:check`).

- [ ] **Step 5 — Wire into layout:** read `src/app/[locale]/layout.tsx` and the Header component it renders. Add a search trigger (button with ⌘K affordance) in the header and mount `CompatibilitySearchModal` with open state controlled by a small client wrapper using `useSearchHotkey`. Keep the layout a Server Component; isolate client state in the wrapper component.

- [ ] **Step 6 — Run tests:** `pnpm test src/components/search/` — all pass.

- [ ] **Step 7 — Run** `pnpm type-check && pnpm lint:check && pnpm react:doctor` (Client Component + hook change).

- [ ] **Step 8 — Commit:**

```bash
git add src/components/search src/app/[locale]/layout.tsx messages/
git commit -m "feat(search): add global compatibility search with cmd+k hotkey"
```

---

## Task 6: Home page — impeccable build

**Files:**
- Replace: `src/app/[locale]/page.tsx`
- Create: supporting section components as impeccable directs

**Reference:** DESIGN.md §7.1 + §7 cross-page patterns

> **This task is atomic and bigger than a page file.** Replacing the starter home means: (a) introducing the new `home.*` i18n namespace, (b) rewriting `src/app/[locale]/page.tsx`, and (c) retiring the old starter section components and their now-unused `home.*` keys — all in one green commit. Doing any part alone breaks `content:check`/tests (the old `home.*` keys are consumed by `src/components/sections/*`).

- [ ] **Step 0a — Audit old `home.*` consumers.** `grep -rn 'namespace: "home"\|t("home\.\|"home\.' src/ tests/` and list every component/test consuming `home.*` (known: `src/app/[locale]/page.tsx`, `src/components/sections/{hero-section,chain-section,scenarios-section,quality-section,final-cta,sample-cta,resources-section,starter-boundary-section,products-section}.tsx` and their tests; plus `src/test/i18n-validation.ts` special-cases `home.title`). Confirm each old section component is used ONLY by the home page (grep its import sites). Components used elsewhere must NOT be deleted — adapt instead.

- [ ] **Step 0b — Introduce the new `home.*` namespace** in all three `messages/{en,es,zh}/critical.json`, REPLACING the old `home.*` content (now safe — the old consumers are removed/rewritten in this same task). EN content:

```json
"home": {
  "hero": {
    "title": "Find Your Replacement Membrane",
    "subtitle": "Enter a part number, OEM model, or diffuser brand to check compatibility.",
    "searchPlaceholder": "Search by part number or OEM model...",
    "searchButton": "Check Compatibility"
  },
  "oemGrid": {
    "overline": "OEM COMPATIBILITY",
    "title": "Replacement Membranes for Major Brands",
    "viewAll": "View all {brand} compatible parts"
  },
  "materials": {
    "overline": "MATERIAL SELECTION",
    "title": "Choose the Material That Matches Your Conditions",
    "epdm": { "name": "EPDM", "description": "Municipal and light industrial wastewater conditions." },
    "tpu": { "name": "TPU", "description": "Oil, chemical, and high-grease wastewater conditions where EPDM degrades." }
  },
  "trust": {
    "leadTime": "Lead Time Confirmed Per Quote",
    "noFit": "No-Fit, No-Charge Review",
    "sla": "2-Business-Day Quote Response"
  },
  "cta": { "requestQuote": "Request a Quote", "viewMembranes": "Browse All Membranes" }
}
```

ES/ZH: same keys, professional Spanish / 简体中文 工程化语气, technical tokens English, `{brand}` placeholder intact, no marketing adjectives, no numeric lead time. If `src/test/i18n-validation.ts` special-cases `home.title` (old key now `home.hero.title`), update that validation reference accordingly.

- [ ] **Step 0c — Retire old starter sections (USER-CONFIRMED: full teardown in this task).** Move to Trash (NOT `rm` — global no-permanent-delete rule still applies even though teardown is approved) every starter file confirmed in Step 0a to be consumed ONLY by the old starter home: the 9 section components + their `-view.tsx`, `.stories.tsx`, `-view.stories.tsx`, and `__tests__/`, plus `homepage-section-shell*`, `homepage-trust-strip*`, `homepage-section-links.ts`, `homepage-section.fixtures.ts`, `section-story-fixtures.ts`, and `faq-section*`/`faq-accordion*` IF (and only if) grep proves they are not imported by any surviving page/component/test. Anything imported elsewhere is NOT removed. Also retire now-unused `SINGLE_SITE_HOME_PUBLIC_DEMO_*` keys in `src/config/single-site-page-expression.ts` if nothing else consumes them, and fix the `home.title` special case at `src/test/i18n-validation.ts:426` (old key path; new is `home.hero.title`). All gates must stay green together: `pnpm type-check && pnpm lint:check && pnpm test && pnpm content:check && pnpm brand:check && pnpm component:check && pnpm react:doctor`. If removing a file cascades into a governance/storybook-coverage gate, resolve it (the coverage expectation for a deleted starter section is its removal from the coverage manifest, not a re-added stub).

- [ ] **Step 1 — Run `/impeccable shape`** with this brief:

> Build the Tucsenberg home page, replacing the current starter home. DESIGN.md §7.1.
> 1. H1 "Find Your Replacement Membrane" — Display 01 (60px / weight 300 / Engineering Navy), via `home.hero.title`.
> 2. One-line sub-claim — Body Large 18px, `home.hero.subtitle`.
> 3. Compatibility search bar (~60% width) — opens the global `CompatibilitySearchModal` (Task 5), placeholder `home.hero.searchPlaceholder`.
> 4. OEM family grid: map `oemBrands` from `@/data/product-compatibility`; one card per brand (Sanitaire / EDI / SSI Aeration) linking to `/compatible/{brand.slug}` (`sanitaire`, `edi`, `ssi-aeration`).
> 5. Trust ribbon: three items from `home.trust.*` (NO numeric lead-time promise).
> 6. Below fold: material guidance (EPDM vs TPU, condition-based, `home.materials.*` — never "premium/better").
> 7. Final CTA: "Request a Quote" → `/quote`; "Browse All Membranes" → `/membranes/tuc-d9-epdm`.
> Server Component; all text via `getTranslations` (`home.*`); no hero image (search bar is the hero); no hardcoded English.

- [ ] **Step 2 — Wait for user confirmation of the shape.**

- [ ] **Step 3 — Run `/impeccable craft`.** Then verify in browser (`pnpm dev`):
  - `http://localhost:3000/en` renders; search bar opens the ⌘K modal; typing `00223` yields a Sanitaire/EDI result.
  - Brand cards link to `/compatible/sanitaire`, `/compatible/edi`, `/compatible/ssi-aeration`.
  - Trust ribbon shows three items, no unconfirmed lead time.
  - `/es` and `/zh` render with translations; no hardcoded English.

- [ ] **Step 4 — Run `/impeccable audit`** — fix findings.

- [ ] **Step 5 — Run** `pnpm type-check && pnpm lint:check`.

- [ ] **Step 6 — Commit:**

```bash
git add src/app/[locale] src/components messages/
git commit -m "feat(pages): build tucsenberg home with compatibility search"
```

---

## Task 7: Product detail page — impeccable build

**Files:**
- Create: `src/app/[locale]/membranes/[product]/page.tsx`
- Create: supporting components as impeccable directs

**Reference:** DESIGN.md §7.3

- [ ] **Step 1 — Run `/impeccable shape`** with this brief:

> Build `/membranes/[product]`. Primary instance `/membranes/tuc-d9-epdm`.
> Resolve param: `getProductCompatibility(params.product)` from `@/data/product-compatibility`; `notFound()` if undefined.
> 1. Hero: product `name` (Display 02, from entry `name` LocalizedText by locale) + spec stat bar — **only the fields the data has**: Diameter (free-text string from the variant's `specs.diameter`; look it up via `productVariants` by `productVariantId`), Material (`material`), Type (`category`), SKU (`sku`, `type-part-number` mono). There is NO temperature/shore/tensile in this dataset — do not invent it.
> 2. Compatibility table from `entry.compatibleOemModels`: columns OEM model (`modelName` + `brandName`), OEM/cross-ref numbers (`oemPartNumbers` mono; show `membraneProduct.compatibility.crossRefNote` footnote), fit-status badge (`fitStatus` → `membraneProduct.compatibility.fitStatus.*`), confidence badge (`confidence`), expandable required checks (`requiredChecks` LocalizedText[] by locale; if empty show `noChecksRequired`).
> 3. Per-model `disclaimer` (LocalizedText) and per-brand `trademarkDisclaimer` shown at the bottom of the compatibility section (dedupe brands).
> 4. Quote CTA with pre-fill: `/quote?sku={entry.sku}&product={entry.productSlug}`.
> `generateStaticParams()`: `productVariants.map(v => v.slug)` × locales. i18n `membraneProduct.*`. Badge colors per DESIGN.md (success/amber/neutral); no pill.

- [ ] **Step 2 — Wait for user confirmation of the shape.**

- [ ] **Step 3 — Run `/impeccable craft`.** Verify:
  - `http://localhost:3000/en/membranes/tuc-d9-epdm` renders; spec bar shows Diameter/Material(EPDM)/Type(disc)/SKU(TUC-D9-EPDM).
  - Compatibility table lists Sanitaire/EDI/SSI models with fit + confidence badges; trademark + per-model disclaimers present; cross-ref footnote present.
  - Quote CTA href `= /quote?sku=TUC-D9-EPDM&product=tuc-d9-epdm`.
  - All 7 slugs resolve (spot-check `tuc-d9-tpu`, `tuc-t91-epdm`); unknown slug → 404.
  - `/es` and `/zh` render.

- [ ] **Step 4 — Run `/impeccable audit`** — fix findings.

- [ ] **Step 5 — Run** `pnpm type-check && pnpm lint:check`.

- [ ] **Step 6 — Commit:**

```bash
git add src/app/[locale]/membranes src/components messages/
git commit -m "feat(pages): build product detail page with compatibility data"
```

---

## Task 8: OEM compatibility page — impeccable build

**Files:**
- Create: `src/app/[locale]/compatible/[brand]/page.tsx`
- Create: supporting components as impeccable directs (filter is a Client Component)

**Reference:** DESIGN.md §7.2 + §7 cross-page patterns (context ribbon, OEM tab)

- [ ] **Step 1 — Run `/impeccable shape`** with this brief:

> Build `/compatible/[brand]`. Primary instance `/compatible/sanitaire`.
> Resolve param: `getBrandCompatibility(params.brand)`; `notFound()` if undefined.
> 1. Context ribbon: `entry.brandName` + overline (thin row, `compatibleBrand.hero.*`).
> 2. Trademark disclaimer (`entry.trademarkDisclaimer` LocalizedText) prominently below the ribbon.
> 3. Facet filter (Client Component, **NOT optional**) over `entry.models`: a category tab switcher "All / Disc Models / Tube Models" filtering by `model.category`, plus a material dropdown ("All Materials / EPDM / TPU") filtering models that have ≥1 `compatibleProducts` of that `material`. Facets use the structured `category`/`material` fields only (free-text diameter is display, not a facet). Empty result → `compatibleBrand.results.empty`.
> 4. Result cards: one per filtered `ModelCompatibilityEntry` — `modelName`, OEM/cross-ref numbers (mono, with cross-ref note), then each `compatibleProducts[]` entry: Tucsenberg `name`+`sku`, fit-status badge, confidence badge, expandable required checks; "Request Quote for This Part" → `/quote?brand={entry.brandSlug}&model={model.modelSlug}&partNumber={model.oemPartNumbers[0] ?? model.modelSlug}`.
> `generateStaticParams()`: `oemBrands.map(b => b.slug)` × locales (3 brands: `sanitaire`, `edi`, `ssi-aeration`). i18n `compatibleBrand.*`. Server Component renders data; only the filter is client.

- [ ] **Step 2 — Wait for user confirmation of the shape.**

- [ ] **Step 3 — Run `/impeccable craft`.** Verify:
  - `http://localhost:3000/en/compatible/sanitaire` renders; trademark disclaimer visible.
  - Category tabs switch disc vs tube; material dropdown narrows results; empty-state message works.
  - Fit-status/confidence badges use correct DESIGN.md colors; no pill.
  - Quote buttons carry pre-fill params.
  - `/compatible/edi` and `/compatible/ssi-aeration` render; unknown brand → 404.
  - `/es` and `/zh` render.

- [ ] **Step 4 — Run `/impeccable audit`** — fix findings.

- [ ] **Step 5 — Run** `pnpm type-check && pnpm lint:check && pnpm react:doctor`.

- [ ] **Step 6 — Commit:**

```bash
git add src/app/[locale]/compatible src/components messages/
git commit -m "feat(pages): build oem compatibility page with tabs and facet filter"
```

---

## Task 9: Quote page — backend + frontend

### 9a — RFQ backend

**Files:**
- Modify: `src/lib/lead-pipeline/lead-schema.ts`
- Create: `src/app/api/quote/route.ts`
- Create: `src/app/api/quote/__tests__/quote-api.test.ts`

- [ ] **Step 1 — Read** `src/lib/lead-pipeline/lead-schema.ts` and `src/app/api/inquiry/route.ts` to learn the existing schema pattern (`LEAD_TYPES`, `sanitizedString`, length constants, `productLeadSchema`) and the route pattern (`withRateLimit`, Turnstile `expectedAction`, `safeParseJson`, `processLead`).

- [ ] **Step 2 — Write failing API tests** `src/app/api/quote/__tests__/quote-api.test.ts` mirroring the inquiry integration test setup (reuse `@/test/utils`, mock Turnstile + Resend):
  - rejects missing Turnstile token (expect failure status)
  - rejects invalid email
  - rejects missing required fields (`fullName`, `email`, `partNumbers`)
  - accepts a valid submission and returns a reference id
  - `vi.unmock("zod")` at top level (schema rejection assertions).

- [ ] **Step 3 — Run tests:** `pnpm test src/app/api/quote/` — expect FAIL (route missing).

- [ ] **Step 4 — Add `rfqLeadSchema`** to `lead-schema.ts` (adapt names/helpers to the file's real exports found in Step 1):

```typescript
export const rfqLeadSchema = z.object({
  type: z.literal("rfq"),
  fullName: sanitizedString().min(1).max(MAX_NAME_LENGTH),
  email: z.string().trim().min(1).email().max(MAX_EMAIL_LENGTH),
  company: sanitizedString().max(MAX_COMPANY_LENGTH).optional(),
  country: sanitizedString().max(100).optional(),
  partNumbers: sanitizedString().min(1).max(500),
  quantity: sanitizedString().max(100).optional(),
  material: z.enum(["epdm", "tpu", "not-sure"]).optional(),
  shutdownDate: sanitizedString().max(200).optional(),
  notes: sanitizedString().max(2000).optional(),
  marketingConsent: z.boolean().optional().default(false),
});

export type RfqLeadInput = z.infer<typeof rfqLeadSchema>;
```

Add `"rfq"` to `LEAD_TYPES` if that constant gates the pipeline.

- [ ] **Step 5 — Create** `src/app/api/quote/route.ts` cloning `src/app/api/inquiry/route.ts`: `withRateLimit("quote", ...)`, Turnstile `expectedAction: "rfq_quote"`, `safeParseJson`, validate with `rfqLeadSchema`, `processLead`. **File upload is client-side only for Step 4**: the endpoint accepts JSON only; file name/size metadata may ride in `notes` or an optional `attachments` string field. Server-side multipart is deferred (note this in a code comment, no TODO without owner).

- [ ] **Step 6 — Run tests:** `pnpm test src/app/api/quote/` — all pass.

- [ ] **Step 7 — Commit:**

```bash
git add src/app/api/quote src/lib/lead-pipeline/lead-schema.ts
git commit -m "feat(api): add rfq quote submission endpoint"
```

### 9b — Quote page frontend (impeccable)

**Files:**
- Create: `src/app/[locale]/quote/page.tsx`
- Create: form Client Component + supporting components as impeccable directs

- [ ] **Step 1 — Run `/impeccable shape`** with this brief:

> Build `/quote`.
> 1. Two columns: left = form (Client Component), right = sticky live summary. Mobile (<768px): summary moves below the form.
> 2. Fields in order: Part Number(s)/OEM Model (text, required, pre-filled from `?sku=` or `?partNumber=`), Quantity (text, optional, from `?quantity=`), Full Name (text, required), Email (email, required), Company (optional), Country (optional), Preferred Material (select EPDM/TPU/Not sure), Shutdown Date/Urgency (optional), Notes (textarea, optional), file upload zone (drag-drop CSV/PDF/JPG/PNG ≤10MB — client-side only, send file name+size in payload).
> 3. Turnstile widget before submit.
> 4. Right panel live-updates from form state; shows `quote.summary.leadTimeValue` ("Confirmed during quote review") and `quote.summary.responseTimeValue` ("Within 2 business days"); echoes `?brand=`/`?model=` context if present.
> 5. Success state `quote.success.*`.
> Submit JSON POST to `/api/quote` with `type: "rfq"`. i18n `quote.*`. Read `searchParams` for pre-fill. Inputs/textarea use the governed `@/components/ui/*` wrappers (DESIGN.md §6: 6px radius, teal focus ring; no pill).

- [ ] **Step 2 — Wait for user confirmation of the shape.**

- [ ] **Step 3 — Run `/impeccable craft`.** Verify:
  - `http://localhost:3000/en/quote` renders all fields with labels/hints.
  - `/quote?sku=TUC-D9-EPDM` pre-fills the part-number field; `?brand=sanitaire&model=...` shows in summary.
  - Required-field validation works; file zone renders; summary updates live.
  - Mobile single column at 390px.
  - Submit with valid data → success state (dev Turnstile token).
  - `/es` and `/zh` render.

- [ ] **Step 4 — Run `/impeccable audit`** — fix findings.

- [ ] **Step 5 — Run** `pnpm type-check && pnpm lint:check && pnpm react:doctor`.

- [ ] **Step 6 — Commit:**

```bash
git add src/app/[locale]/quote src/components messages/
git commit -m "feat(pages): build rfq quote page with pre-fill and live summary"
```

---

## Task 10: Cross-cutting verification and design-system audit

- [ ] **Step 1 — i18n:** `pnpm content:check` (all three locales identical keys). Browser: `/es/` and `/zh/` for all four pages — no overflow, natural text, ZH font fallback OK.

- [ ] **Step 2 — Navigation:** "Membranes" → `/membranes/tuc-d9-epdm`; "Compatibility" → `/compatible/sanitaire`; "Quote" → `/quote`; "Materials" → coming-soon; ⌘K opens search from any page.

- [ ] **Step 3 — Data integration:** Home search `00223` → Sanitaire/EDI model; `Sanitaire` → brand models; `TUC-D9` → product. Product page compatibility table has badges + disclaimers. Compatible page tabs + material filter narrow results. Quote pre-fill arrives from product/compatible CTAs.

- [ ] **Step 4 — Viewport matrix** (4 pages × {390×844, 768×1024, 1280×800} × {en, es, zh}): no horizontal overflow, no clipped buttons, readable text, layout appropriate at each breakpoint.

- [ ] **Step 5 — Design token audit** across all 4 pages: no raw hex in classes; no `rounded-full`/pill; no `font-bold` on display/heading; overlines use `type-overline`; part numbers use `type-part-number`; buttons `rounded-[6px]`; cards `rounded-lg`.

- [ ] **Step 6a — Dynamic-route sitemapping + contract cleanup.** Now that `/membranes/[product]/page.tsx` and `/compatible/[brand]/page.tsx` exist: (1) In `src/app/sitemap.ts`, add a dynamic generator mirroring `generateCatalogEntries` that emits one URL per `productVariants` slug (`/membranes/{slug}`) and one per `oemBrands` slug (`/compatible/{slug}`) for each public locale; wire it into the sitemap output. Add/extend the sitemap test to assert these URLs are present and that every emitted sitemap URL maps to a real route (close the gap the spec review found — the old test only checked length/uniqueness). (2) Remove the single-entry `quote` `PENDING_ROUTE_OWNERS` exception from `tests/architecture/static-public-pages-contract.test.ts` and `src/config/__tests__/pages-config.test.ts` (the file now exists); the existence assertion must apply to `quote` again. Run `pnpm test src/app/__tests__/sitemap.test.ts tests/architecture/static-public-pages-contract.test.ts src/config/__tests__/pages-config.test.ts` — all pass.

- [ ] **Step 6 — Full gates** (sequential, `build` and `website:build:cf` NOT parallel):

```bash
pnpm type-check
pnpm lint:check
pnpm test
pnpm brand:check
pnpm content:check
pnpm component:check
pnpm build
pnpm website:build:cf
```

- [ ] **Step 7 — Update `DEVELOPMENT-LOG.md`** "进行中/已完成" with the Step 4 outcome (four pages live on the `product-compatibility` data layer, data cleaned, ⌘K search, three-language, viewport matrix passed) and record in "最近决策" that the canonical data layer is `src/data/product-compatibility/` and the abandoned local `src/data/` (A) is not used. Note the open follow-up: local `main` diverged from `origin/main` and needs reset.

- [ ] **Step 8 — Commit:**

```bash
git add DEVELOPMENT-LOG.md
git commit -m "docs: mark step 4 four-page templates complete"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** four pages (Tasks 6–9b), ⌘K global search (Task 5), routes/nav (Task 1), i18n (Task 4), data correctness precondition (Task 2), slug resolution (Task 3), RFQ backend (Task 9a), cross-cutting verification incl. viewport matrix + token audit (Task 10). impeccable shape→confirm→craft→audit on every page task. All covered.
- **Data-layer correctness:** every page task points at the real `@/data/product-compatibility` API and real slugs/fields; no reference to the abandoned `src/data/` (A) API (`getProductVariantBySlug`, `searchCompatibility`, structured temp specs) remains.
- **Placeholders:** none — tests and reclassification rules are concrete; the only deferred item (server-side multipart upload) is explicitly scoped to a later step with rationale, not a bare TODO.
- **Type/name consistency:** accessor names (`getProductCompatibility`/`getBrandCompatibility`/`getModelCompatibility`) are defined in Task 3 and used identically in Tasks 7–8; entry field names match `indexes.ts`; `fitStatus` enum values (`exact`/`verify-dimensions`/`custom`) match schema and i18n keys.
- **Business guardrails:** lead time never promised numerically; TPU framed by 工况适配; trademark + cross-ref disclaimers on compatibility surfaces; competitor/ASIN reclassification gated behind a user-confirmation checkpoint (Task 2 Step 2).
