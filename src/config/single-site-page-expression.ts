import {
  getSingleSiteActiveRouteTargets,
  getSingleSiteContactFallbackHref,
  getSingleSiteAboutPageCtaHref,
} from "@/config/single-site-links";
import {
  PRODUCT_CATALOG,
  type ProductMarketSlug,
} from "@/constants/product-catalog";
import type { TucsenbergProductDiagramKind } from "@/constants/tucsenberg-product-page-types";

export { SINGLE_SITE_HOME_LINK_TARGETS } from "@/config/single-site-links";

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
 * - `contact/page.tsx` `MERGED_MESSAGES`
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

export const SINGLE_SITE_HOME_PRODUCT_LINES = [
  {
    key: "absFloodBarriers",
    slug: "abs-flood-barriers",
    glyph: "boxwall",
  },
  {
    key: "aluminumFloodGates",
    slug: "aluminum-flood-gates",
    glyph: "gate",
  },
  {
    key: "absorbentFloodBags",
    slug: "absorbent-flood-bags",
    glyph: "bag",
  },
  {
    key: "floodTubeDams",
    slug: "flood-tube-dams",
    glyph: "tube",
  },
  {
    key: "frpFloodBarriers",
    slug: "frp-flood-barriers",
    glyph: "frp",
    hasBadge: true,
  },
] as const satisfies readonly {
  key: string;
  slug: ProductMarketSlug;
  glyph: TucsenbergProductDiagramKind;
  hasBadge?: true;
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

export const SINGLE_SITE_HOME_SCENARIO_ITEMS = [
  "item1",
  "item2",
  "item3",
] as const;

export const SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS = [
  "quality",
  "innovation",
  "service",
  "integrity",
] as const;

export const SINGLE_SITE_ABOUT_STATS_ITEMS = [
  {
    key: "years",
    valueSource: "yearsInBusiness",
    labelKey: "yearsExperience",
    suffix: "+",
  },
  {
    key: "countries",
    valueSource: "exportCountries",
    labelKey: "countriesServed",
    suffix: "+",
  },
  {
    key: "team",
    valueSource: "employees",
    labelKey: "happyClients",
    suffix: "+",
  },
  {
    key: "footprint",
    valueSource: "exampleFootprint",
    labelKey: "productsDelivered",
    suffix: "",
  },
] as const;

export const SINGLE_SITE_ABOUT_PAGE_EXPRESSION = {
  ctaHref: getSingleSiteAboutPageCtaHref(),
} as const;

const singleSiteContactFallbackHref = getSingleSiteContactFallbackHref();
const singleSiteActiveRouteTargets = getSingleSiteActiveRouteTargets();

const standardMarketSlugs = PRODUCT_CATALOG.markets.map(
  (market) => market.slug,
);

export const SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION = {
  standardMarketSlugs,
  marketLanding: {
    ctaHref: singleSiteContactFallbackHref,
  },
} as const;

const SINGLE_SITE_RESOURCES_CARD_KEYS = [
  "brochure",
  "productSheet",
  "buyerGuide",
] as const;

export const SINGLE_SITE_RESOURCES_PAGE_EXPRESSION = {
  cardKeys: SINGLE_SITE_RESOURCES_CARD_KEYS,
  pathwayStepKeys: ["learn", "compare", "ask"],
  replacementItemKeys: ["files", "proof", "owner"],
  cardHrefs: {
    brochure: singleSiteContactFallbackHref,
    productSheet:
      singleSiteActiveRouteTargets.products ?? singleSiteContactFallbackHref,
    buyerGuide: singleSiteContactFallbackHref,
  } satisfies Record<(typeof SINGLE_SITE_RESOURCES_CARD_KEYS)[number], string>,
  ctaHref: singleSiteContactFallbackHref,
} as const;
