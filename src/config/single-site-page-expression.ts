import {
  getSingleSiteActiveRouteTargets,
  getSingleSiteContactFallbackHref,
  getSingleSiteAboutPageCtaHref,
} from "@/config/single-site-links";
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

export const SINGLE_SITE_HOME_SECTION_ORDER = [
  "hero",
  "problems",
  "howToChoose",
  "startPath",
  "answer",
  "verify",
  "faq",
  "finalCta",
] as const;

export type SingleSiteHomeSectionKey =
  (typeof SINGLE_SITE_HOME_SECTION_ORDER)[number];

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
  "ship",
] as const;

/** Deep-link targets for the five home product cards, keyed by problem item. */
export const SINGLE_SITE_HOME_PRODUCT_CARD_LINKS = {
  structure: "/products/abs-flood-barriers",
  content: "/products/aluminum-flood-gates",
  deployment: "/products/absorbent-flood-bags",
  inquiry: "/products/flood-tube-dams",
  multilingual: "/products/frp-flood-barriers",
} as const satisfies Record<
  (typeof SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS)[number],
  string
>;

/** Home product cards that carry a status badge (message key `badge`). */
export const SINGLE_SITE_HOME_PRODUCT_CARD_BADGE_KEYS = [
  "multilingual",
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
  ctaHref: getSingleSiteAboutPageCtaHref(),
} as const;

const singleSiteContactFallbackHref = getSingleSiteContactFallbackHref();
const singleSiteActiveRouteTargets = getSingleSiteActiveRouteTargets();

const SPECIALTY_MARKET_SLUG = "specialty-product-systems" as const;

const specialtyMarketSlug = PRODUCT_CATALOG.markets.some(
  (market) => market.slug === SPECIALTY_MARKET_SLUG,
)
  ? SPECIALTY_MARKET_SLUG
  : undefined;

const standardMarketSlugs = PRODUCT_CATALOG.markets.flatMap((market) =>
  market.slug === specialtyMarketSlug ? [] : [market.slug],
);

export const SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION = {
  standardMarketSlugs,
  specialtyMarketSlug,
  marketLanding: {
    ctaHref: singleSiteContactFallbackHref,
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
  processStepKeys: ["step1", "step2", "step3", "step4", "step5"],
  ctaHref: singleSiteContactFallbackHref,
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
