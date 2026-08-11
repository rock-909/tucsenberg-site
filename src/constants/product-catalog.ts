/**
 * Product catalog query facade.
 *
 * Product identity and order live with the Tucsenberg product pages. This file
 * remains the narrow query facade used by routes and the lead pipeline.
 */

import {
  singleSiteProductCatalog,
  type ProductMarketSlug,
} from "@/config/single-site-product-catalog";
import type { MarketDefinition, ProductCatalog } from "@/config/site-types";

export type { MarketDefinition, ProductCatalog, ProductMarketSlug };

export const PRODUCT_CATALOG = singleSiteProductCatalog;

/** Type guard for catalog product ids (market slugs). */
export function isProductMarketSlug(value: string): value is ProductMarketSlug {
  return singleSiteProductCatalog.markets.some(
    (market) => market.slug === value,
  );
}

/** Get a market definition by its URL slug */
export function getMarketBySlug(slug: string) {
  return PRODUCT_CATALOG.markets.find((market) => market.slug === slug);
}

/** Return all market slugs for static generation */
export function getAllMarketSlugs(): readonly ProductMarketSlug[] {
  return PRODUCT_CATALOG.markets.map((market) => market.slug);
}
