/**
 * Derived catalog fact constants — the single source of truth for the
 * counts, brand list, fit-status totals, and featured-product facts that the
 * marketing pages render.
 *
 * Everything here is COMPUTED over the Zod-parsed data arrays exported by
 * `@/data/product-compatibility` (`compatibilityMappings`, `oemBrands`,
 * `oemModels`, `productVariants`). No counts or brand names are baked as
 * literals: if the catalog data moves, these constants move with it, and the
 * paired drift-guard test (`__tests__/catalog-facts.test.ts`) recomputes the
 * same values from source to prove they stayed in sync.
 *
 * Slug-vs-canonical footgun: the featured facts expose distinctly-named
 * `sku`, `canonicalSlug`, and a ready `quoteHref`. They intentionally do NOT
 * expose a bare `slug` — the raw variant slug (`tuc-d9-epdm`) 308-redirects
 * to the canonical descriptive slug, so consumers must never build a URL
 * from it.
 *
 * `quoteHref` shape mirrors the frozen product-page producer at
 * `src/app/[locale]/membranes/[product]/page.tsx` (absolute `/quote?`
 * prefix, `encodeURIComponent` on both `sku` and `product`). Later phases
 * import this SSOT value and must emit the byte-identical URL the existing
 * page already emits.
 */

import {
  oemBrands,
  oemModels,
  productVariants,
} from "@/data/product-compatibility/catalog";
import { compatibilityMappings } from "@/data/product-compatibility/mappings";
import { canonicalProductSlug } from "@/data/product-compatibility/product-slug";
import type {
  FitStatus,
  MembraneMaterial,
} from "@/data/product-compatibility/schemas";

const FIT_STATUS_ORDER = ["exact", "verify-dimensions", "custom"] as const;
const FIT_STATUS_LABEL_KEY = "membraneProduct.compatibility.fitStatus";

/** The variant id/slug of the featured membrane (the homepage hero product). */
const FEATURED_VARIANT_ID = "tuc-d9-epdm";

export type FitStatusTotals = Readonly<Record<FitStatus, number>>;

export interface OemBrandFacts {
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
}

export interface BrandPathStats {
  readonly paths: number;
  readonly epdm: number;
  readonly tpu: number;
  readonly fitStatus: FitStatusTotals;
}

export interface FeaturedProductFacts {
  readonly sku: string;
  readonly material: MembraneMaterial;
  readonly diameter: string;
  readonly canonicalSlug: string;
  readonly quoteHref: string;
}

export interface CatalogFacts {
  readonly totalCompatibilityPaths: number;
  readonly oemBrandCount: number;
  readonly fitStatusOrder: readonly FitStatus[];
  readonly fitStatusLabelKey: string;
  readonly fitStatusTotals: FitStatusTotals;
}

const brandIdByModelId = new Map(
  oemModels.map((model) => [model.id, model.brandId] as const),
);

const materialByVariantId = new Map(
  productVariants.map((variant) => [variant.id, variant.material] as const),
);

function emptyFitStatusTotals(): Record<FitStatus, number> {
  return { exact: 0, "verify-dimensions": 0, custom: 0 };
}

function computeFitStatusTotals(): FitStatusTotals {
  const totals = emptyFitStatusTotals();
  for (const mapping of compatibilityMappings) {
    totals[mapping.fitStatus] += 1;
  }
  return totals;
}

function computeBrandPathStats(brandId: string): BrandPathStats {
  let paths = 0;
  let epdm = 0;
  let tpu = 0;
  const fitStatus = emptyFitStatusTotals();

  for (const mapping of compatibilityMappings) {
    if (brandIdByModelId.get(mapping.oemModelId) !== brandId) {
      continue;
    }

    paths += 1;
    fitStatus[mapping.fitStatus] += 1;

    const material = materialByVariantId.get(mapping.productVariantId);
    if (material === "epdm") {
      epdm += 1;
    } else if (material === "tpu") {
      tpu += 1;
    }
  }

  return { paths, epdm, tpu, fitStatus };
}

const OEM_BRAND_FACTS: readonly OemBrandFacts[] = oemBrands.map((brand) => ({
  id: brand.id,
  slug: brand.slug,
  displayName: brand.name,
}));

const BRAND_PATH_STATS = new Map<string, BrandPathStats>(
  oemBrands.map(
    (brand) => [brand.id, computeBrandPathStats(brand.id)] as const,
  ),
);

function computeFeaturedProductFacts(): FeaturedProductFacts {
  const variant = productVariants.find((v) => v.id === FEATURED_VARIANT_ID);

  if (!variant) {
    throw new Error(
      `Featured product variant "${FEATURED_VARIANT_ID}" not found in productVariants`,
    );
  }

  const { diameter } = variant.specs;

  if (!diameter) {
    throw new Error(
      `Featured product variant "${FEATURED_VARIANT_ID}" is missing specs.diameter`,
    );
  }

  const canonicalSlug = canonicalProductSlug(variant);

  return {
    sku: variant.sku,
    material: variant.material,
    diameter,
    canonicalSlug,
    quoteHref: `/quote?sku=${encodeURIComponent(variant.sku)}&product=${encodeURIComponent(canonicalSlug)}`,
  };
}

const FEATURED_PRODUCT_FACTS = computeFeaturedProductFacts();

export const CATALOG_FACTS: CatalogFacts = {
  totalCompatibilityPaths: compatibilityMappings.length,
  oemBrandCount: oemBrands.length,
  fitStatusOrder: FIT_STATUS_ORDER,
  fitStatusLabelKey: FIT_STATUS_LABEL_KEY,
  fitStatusTotals: computeFitStatusTotals(),
};

/** The real OEM brands, in catalog order. Never includes excluded brands. */
export function getOemBrandFacts(): readonly OemBrandFacts[] {
  return OEM_BRAND_FACTS;
}

/** Per-brand compatibility-path stats. Throws on an unknown brand id. */
export function getBrandPathStats(brandId: string): BrandPathStats {
  const stats = BRAND_PATH_STATS.get(brandId);

  if (!stats) {
    throw new Error(`Unknown OEM brand id: ${brandId}`);
  }

  return stats;
}

/** Facts for the featured membrane (homepage hero product). */
export function getFeaturedProductFacts(): FeaturedProductFacts {
  return FEATURED_PRODUCT_FACTS;
}
