import { SINGLE_SITE_HOME_LINK_TARGETS } from "@/config/single-site-links";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";

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

export const SINGLE_SITE_HOME_GRID_SECTION_ORDER = [
  "hero",
  "starterBoundary",
  "chain",
  "products",
  "resources",
  "sampleCta",
  "scenarios",
  "quality",
] as const;

export const SINGLE_SITE_HOME_TRAILING_SECTION_ORDER = ["finalCta"] as const;

export const SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS = [
  "structure",
  "content",
  "deployment",
  "inquiry",
  "multilingual",
] as const;

export const SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS = [
  "pageStructure",
  "replacementSurface",
  "inquiryPath",
  "cloudflareFoundation",
] as const;

export const SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS = [
  "brand",
  "content",
  "forms",
  "deploy",
] as const;

export const SINGLE_SITE_HOME_HERO_PROOF_ITEMS = [
  "est",
  "countries",
  "range",
  "production",
] as const;

export const SINGLE_SITE_HOME_FINAL_TRUST_ITEMS = ["countries"] as const;

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

export const SINGLE_SITE_HOME_QUALITY_COMMITMENT_ITEMS = [
  "commitment1",
  "commitment2",
  "commitment3",
  "commitment4",
  "commitment5",
] as const;

export const SINGLE_SITE_HOME_QUALITY_STANDARD_ITEMS = [
  "exampleA",
  "exampleB",
  "exampleC",
  "exampleD",
] as const;

export const SINGLE_SITE_HOME_QUALITY_PROOF_STRIP_ITEMS = [
  "iso9001",
  "standards",
  "countries",
] as const;

export const SINGLE_SITE_ABOUT_PAGE_EXPRESSION = {
  ctaHref: SINGLE_SITE_HOME_LINK_TARGETS.products,
} as const;

const SPECIALTY_MARKET_SLUG = "specialty-product-systems" as const;

const standardMarketSlugs = PRODUCT_CATALOG.markets.flatMap((market) =>
  market.slug === SPECIALTY_MARKET_SLUG ? [] : [market.slug],
);

export const SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION = {
  standardMarketSlugs,
  specialtyMarketSlug: SPECIALTY_MARKET_SLUG,
  marketLanding: {
    ctaHref: SINGLE_SITE_HOME_LINK_TARGETS.contact,
  },
} as const;

export const SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION = {
  supportedStandards: [
    "Example Standard A",
    "Example Standard B",
    "Example Standard C",
    "Example Standard D",
  ],
  scopeKeys: [
    "customSizes",
    "privateLabel",
    "implementationSupport",
    "qualityAssurance",
  ],
  processStepCount: 5,
  ctaHref: SINGLE_SITE_HOME_LINK_TARGETS.contact,
} as const;
