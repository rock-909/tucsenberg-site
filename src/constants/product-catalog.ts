/**
 * Product catalog query facade.
 *
 * Authoring truth stays in src/config/single-site-product-catalog.ts and
 * src/constants/product-specs/**; this module gives routes, sitemap generation,
 * and pages a stable way to query the current catalog.
 */

import {
  SINGLE_SITE_PRODUCT_CATALOG,
  type MarketDefinition,
  type ProductCatalog,
  type ProductFamilyDefinition,
} from "@/config/single-site";

export type {
  MarketDefinition,
  ProductCatalog,
  ProductFamilyDefinition,
} from "@/config/single-site";

export const PRODUCT_CATALOG: ProductCatalog = SINGLE_SITE_PRODUCT_CATALOG;

/** Get a market definition by its URL slug */
export function getMarketBySlug(slug: string): MarketDefinition | undefined {
  return PRODUCT_CATALOG.markets.find((market) => market.slug === slug);
}

/** Get all product families for a given market slug */
export function getFamiliesForMarket(
  marketSlug: string,
): readonly ProductFamilyDefinition[] {
  return PRODUCT_CATALOG.families.filter(
    (family) => family.marketSlug === marketSlug,
  );
}

/** Check if a market slug is valid */
export function isValidMarketSlug(slug: string): boolean {
  return PRODUCT_CATALOG.markets.some((market) => market.slug === slug);
}

/** Check if a market + family combination is valid */
export function isValidMarketFamilyCombo(
  marketSlug: string,
  familySlug: string,
): boolean {
  return PRODUCT_CATALOG.families.some(
    (family) => family.marketSlug === marketSlug && family.slug === familySlug,
  );
}

/** Return all market slugs for static generation */
export function getAllMarketSlugs(): readonly string[] {
  return PRODUCT_CATALOG.markets.map((market) => market.slug);
}

/** Return all valid market + family pairs for static generation */
export function getAllMarketFamilyCombos(): ReadonlyArray<{
  market: string;
  family: string;
}> {
  return PRODUCT_CATALOG.families.map((family) => ({
    market: family.marketSlug,
    family: family.slug,
  }));
}
