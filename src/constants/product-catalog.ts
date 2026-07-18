/**
 * Product catalog query facade.
 *
 * Catalog route/list truth stays in src/config/single-site-product-catalog.ts.
 * Current Tucsenberg product page specs/copy live in
 * src/constants/tucsenberg-product-page-*.ts and
 * src/constants/tucsenberg-product-pages.ts.
 */

import {
  SINGLE_SITE_PRODUCT_CATALOG,
  type MarketDefinition,
  type ProductCatalog,
} from "@/config/single-site";

export type { MarketDefinition, ProductCatalog } from "@/config/single-site";

export const PRODUCT_CATALOG: ProductCatalog = SINGLE_SITE_PRODUCT_CATALOG;

/** Get a market definition by its URL slug */
export function getMarketBySlug(slug: string): MarketDefinition | undefined {
  return PRODUCT_CATALOG.markets.find((market) => market.slug === slug);
}

/** Return all market slugs for static generation */
export function getAllMarketSlugs(): readonly string[] {
  return PRODUCT_CATALOG.markets.map((market) => market.slug);
}
