import {
  TUCSENBERG_PRODUCT_PAGES,
  type TucsenbergProductPageSlug,
} from "@/constants/tucsenberg-product-pages";

/**
 * Canonical single-site page-expression inputs.
 *
 * Keep reusable page-expression inputs here:
 * - FAQ item keys
 * - card order / display mapping
 * - CTA targets
 * - supported standards / scope keys / process-step counts
 * - fallback copy
 *
 * Keep implementation details out of here:
 * - route-local message composition and presenter data
 * - product route-local spec lookup maps
 * - `privacy` / `terms` heading-prefix constants
 * - `slugify`, heading parsers, JSON-LD object literals, and page-local helpers
 */

export const SINGLE_SITE_HOME_SECTION_ORDER = [
  "hero",
  "productLines",
  "howToChoose",
  "buyingProcess",
  "buyerSegments",
  "verify",
  "faq",
  "finalCta",
] as const;

export type SingleSiteHomeSectionKey =
  (typeof SINGLE_SITE_HOME_SECTION_ORDER)[number];

export const SINGLE_SITE_HOME_PRODUCT_LINES = Object.values(
  TUCSENBERG_PRODUCT_PAGES,
).map((page) => ({
  key: page.catalog.homeMessageKey,
  slug: page.slug,
  ...("homeBadge" in page.catalog
    ? {
        badgeKey:
          `productLines.items.${page.catalog.homeMessageKey}.badge` as const,
      }
    : {}),
})) satisfies readonly {
  key: string;
  slug: TucsenbergProductPageSlug;
  badgeKey?: string;
}[];

export const SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS = [
  "dealersDistributors",
  "importersBrands",
  "contractorsProjects",
  "smallBusinessBuyers",
] as const;

export const SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS = [
  "sendRfq",
  "quoteResponse",
  "paidSample",
  "productionQc",
  "shipment",
] as const;

/** Q5 summary on home: how a buyer verifies us without leaving the page flow. */
export const SINGLE_SITE_HOME_VERIFY_ITEM_KEYS = [
  "audits",
  "samples",
  "inspection",
] as const;

export const SINGLE_SITE_HOME_HOW_TO_CHOOSE_ROW_KEYS = [
  "openings",
  "perimeters",
  "emergency",
  "longRuns",
  "coastal",
] as const;

export const SINGLE_SITE_HOME_FAQ_ITEM_KEYS = [
  "minimumOrder",
  "quoteSpeed",
  "paymentTerms",
  "samples",
  "oem",
  "warranty",
  "leadTime",
  "madeInChina",
  "audit",
] as const;

export const SINGLE_SITE_HOME_HERO_PROOF_ITEMS = [
  "quoteSla",
  "warranty",
  "factoryPool",
  "oem",
] as const;
