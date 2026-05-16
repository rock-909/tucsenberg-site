import {
  getCanonicalPath,
  getCompatibleBrandPath,
  getMembraneProductPath,
} from "@/config/paths/utils";

/**
 * Featured membrane product entry point (nav + home final CTA).
 *
 * This is the CANONICAL descriptive slug for the `tuc-d9-epdm` variant
 * (`{diameter}-{unit}-{material}-{form}-replacement`, see
 * `@/data/product-compatibility/product-slug`). The legacy SKU slug
 * `/membranes/tuc-d9-epdm` 308-redirects to this URL from the product route.
 *
 * The slug is declared here as a literal rather than imported from the data
 * layer on purpose: this config module is loaded by widely-imported nav/link
 * chains, and pulling the product-compatibility barrel (which Zod-parses the
 * catalog at module load) into that hot path breaks the global Zod-mock test
 * setup. Equivalence to the slug helper output is enforced by
 * `src/config/__tests__/site-facts.test.ts` (which unmocks Zod).
 */
const FEATURED_MEMBRANE_CANONICAL_SLUG = "9-inch-epdm-disc-replacement";

export const FEATURED_MEMBRANE_HREF = getMembraneProductPath(
  FEATURED_MEMBRANE_CANONICAL_SLUG,
);

/**
 * Featured OEM-compatibility entry point (nav + footer + header fallback).
 *
 * Sanitaire is the launch-anchor OEM brand. Declared here as a literal for the
 * same reason as `FEATURED_MEMBRANE_CANONICAL_SLUG`: this config module sits in
 * the hot nav/link import chain, and pulling the product-compatibility barrel
 * (Zod-parses the catalog at module load) into that path breaks the global
 * Zod-mock test setup. Equivalence to the real `oemBrands` slug is enforced by
 * `src/config/__tests__/site-facts.test.ts` (which unmocks Zod).
 */
const FEATURED_COMPATIBLE_BRAND_SLUG = "sanitaire";

export const FEATURED_COMPATIBLE_BRAND_HREF = getCompatibleBrandPath(
  FEATURED_COMPATIBLE_BRAND_SLUG,
);

export const SINGLE_SITE_ROUTE_HREFS = {
  home: getCanonicalPath("home"),
  comingSoon: "#coming-soon",
  about: getCanonicalPath("about"),
  capabilities: getCanonicalPath("capabilities"),
  contact: getCanonicalPath("contact"),
  howItWorks: getCanonicalPath("howItWorks"),
  products: getCanonicalPath("products"),
  blog: getCanonicalPath("blog"),
  privacy: getCanonicalPath("privacy"),
  terms: getCanonicalPath("terms"),
  customProject: getCanonicalPath("customProject"),
  quote: getCanonicalPath("quote"),
} as const;

export const SINGLE_SITE_HOME_LINK_TARGETS = {
  contact: SINGLE_SITE_ROUTE_HREFS.comingSoon,
  products: SINGLE_SITE_ROUTE_HREFS.comingSoon,
} as const;

/**
 * Header / mobile-menu primary CTA target.
 *
 * The buyer's primary header action routes to the live RFQ quote page (the
 * Step-4 conversion path), not the `#coming-soon` placeholder. This is
 * deliberately separate from `SINGLE_SITE_HOME_LINK_TARGETS.contact`, which
 * stays a placeholder for the still-future generic Contact page consumed by
 * the about / products / custom-project page expressions.
 */
export const SINGLE_SITE_PRIMARY_CTA_HREF = SINGLE_SITE_ROUTE_HREFS.quote;
