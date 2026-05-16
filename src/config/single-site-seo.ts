import {
  PUBLIC_STATIC_PAGE_TYPES,
  type PublicStaticPageChangeFrequency,
  getStaticPageLastmodByPath,
  getStaticSitemapPageConfigByPath,
  getStaticSitemapPages,
} from "@/config/pages.config";
import { getProductMarketPath } from "@/config/paths/utils";
import { getAllMarketSlugs } from "@/constants/product-catalog";
import { getMarketSpecsBySlug } from "@/constants/product-specs/market-spec-registry";

export type SingleSiteSitemapChangeFrequency = PublicStaticPageChangeFrequency;

/**
 * Canonical public-static SEO inputs for the current single-site baseline.
 *
 * Split of responsibility:
 * - `single-site.ts`: brand/contact/default SEO identity
 * - `single-site-page-expression.ts`: reusable page-expression inputs
 * - `single-site-seo.ts`: sitemap / robots / public static page SEO defaults
 */

export interface SingleSiteSitemapPageConfig {
  changeFrequency: SingleSiteSitemapChangeFrequency;
  priority: number;
}

const SINGLE_SITE_STATIC_LASTMOD_ISO = "2026-04-26T00:00:00Z";

export const SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES = PUBLIC_STATIC_PAGE_TYPES;

export const SINGLE_SITE_PUBLIC_STATIC_PAGES = getStaticSitemapPages();

export const SINGLE_SITE_SITEMAP_PAGE_CONFIG: Readonly<
  Record<string, SingleSiteSitemapPageConfig>
> = {
  ...getStaticSitemapPageConfigByPath(),
  productMarket: { changeFrequency: "weekly", priority: 0.8 },
  membraneProduct: { changeFrequency: "weekly", priority: 0.8 },
  compatibleBrand: { changeFrequency: "weekly", priority: 0.7 },
} as const;

export const SINGLE_SITE_SITEMAP_DEFAULT_CONFIG = {
  changeFrequency: "weekly",
  priority: 0.5,
} as const satisfies SingleSiteSitemapPageConfig;

const SINGLE_SITE_PRODUCT_MARKET_LASTMOD: Record<string, string> =
  Object.fromEntries(
    getAllMarketSlugs().map((marketSlug) => [
      getProductMarketPath(marketSlug),
      getMarketSpecsBySlug(marketSlug)?.updatedAt ??
        SINGLE_SITE_STATIC_LASTMOD_ISO,
    ]),
  );

export const SINGLE_SITE_STATIC_PAGE_LASTMOD = {
  ...getStaticPageLastmodByPath(),
  ...SINGLE_SITE_PRODUCT_MARKET_LASTMOD,
} as const satisfies Record<string, string>;

// Stable lastmod for product-compatibility detail/brand routes. Kept here as a
// single SEO-owned constant; the sitemap generator (which owns the data-layer
// import) consumes it so config modules stay free of the zod-parsed data layer.
export const SINGLE_SITE_COMPATIBILITY_LASTMOD_ISO =
  SINGLE_SITE_STATIC_LASTMOD_ISO;

export const SINGLE_SITE_ROBOTS_DISALLOW_PATHS = [
  "/api/",
  "/_next/",
  "/ops/",
  "/error-test/",
  "/zh/",
] as const;

export function getSingleSiteSitemapPageConfig(
  path: string,
): SingleSiteSitemapPageConfig {
  return (
    SINGLE_SITE_SITEMAP_PAGE_CONFIG[path] ?? SINGLE_SITE_SITEMAP_DEFAULT_CONFIG
  );
}
