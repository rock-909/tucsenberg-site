import {
  type PublicStaticPageChangeFrequency,
  getActiveStaticPageLastmodByPath,
  getActiveStaticPageTypes,
  getActiveStaticSitemapPageConfigByPath,
  getActiveStaticSitemapPages,
} from "@/config/pages.config";
import type { DynamicPageType, PageType } from "@/config/paths/types";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import { TUCSENBERG_PRODUCT_PAGES } from "@/constants/tucsenberg-product-pages";

export type SingleSiteSitemapChangeFrequency = PublicStaticPageChangeFrequency;

export interface SingleSiteSitemapPageConfig {
  changeFrequency: SingleSiteSitemapChangeFrequency;
  priority: number;
}

const SINGLE_SITE_STATIC_LASTMOD_ISO = "2026-07-05T00:00:00Z";

const SINGLE_SITE_PRODUCT_MARKET_CONFIG = {
  changeFrequency: "weekly",
  priority: 0.8,
} as const satisfies SingleSiteSitemapPageConfig;

function buildSingleSiteProductMarketLastmod(): Record<string, string> {
  return Object.fromEntries(
    Object.values(TUCSENBERG_PRODUCT_PAGES).map((productPage) => [
      getProductMarketPath(productPage.slug),
      productPage.meta.updatedAt ?? SINGLE_SITE_STATIC_LASTMOD_ISO,
    ]),
  );
}

/**
 * Canonical public-static SEO inputs for the current single-site baseline.
 *
 * Split of responsibility:
 * - `single-site.ts`: brand/contact/default SEO identity
 * - `single-site-page-expression.ts`: reusable page-expression inputs
 * - `single-site-seo.ts`: sitemap / robots / public static page SEO defaults
 */

export function getSingleSitePublicStaticPageRoutes() {
  return getActiveStaticPageTypes();
}

export function getSingleSitePublicStaticPages(): string[] {
  return getActiveStaticSitemapPages();
}

export function hasSingleSiteDynamicSurface(
  dynamicSurface: DynamicPageType,
): boolean {
  return dynamicSurface === "productMarket";
}

function normalizePublicPagePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "" || trimmed === "/") {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function shouldIndexPublicPage(
  pageType: PageType,
  path: string,
): boolean {
  const normalizedPath = normalizePublicPagePath(path);
  const productsPath = getCanonicalPath("products");
  const activeTypes = new Set(getActiveStaticPageTypes());

  if (pageType === "products") {
    if (normalizedPath === productsPath) {
      return activeTypes.has("products");
    }

    if (normalizedPath.startsWith(`${productsPath}/`)) {
      return hasSingleSiteDynamicSurface("productMarket");
    }

    return false;
  }

  return activeTypes.has(pageType);
}

export function getSingleSiteSitemapPageConfigByPath(): Readonly<
  Record<string, SingleSiteSitemapPageConfig>
> {
  return {
    ...getActiveStaticSitemapPageConfigByPath(),
    ...(hasSingleSiteDynamicSurface("productMarket")
      ? { productMarket: SINGLE_SITE_PRODUCT_MARKET_CONFIG }
      : {}),
  };
}

export function getSingleSiteStaticPageLastmod(): Record<string, string> {
  return {
    ...getActiveStaticPageLastmodByPath(),
    ...(hasSingleSiteDynamicSurface("productMarket")
      ? buildSingleSiteProductMarketLastmod()
      : {}),
  };
}

export const SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES =
  getSingleSitePublicStaticPageRoutes();

export const SINGLE_SITE_PUBLIC_STATIC_PAGES = getSingleSitePublicStaticPages();

export const SINGLE_SITE_SITEMAP_PAGE_CONFIG =
  getSingleSiteSitemapPageConfigByPath();

export const SINGLE_SITE_SITEMAP_DEFAULT_CONFIG = {
  changeFrequency: "weekly",
  priority: 0.5,
} as const satisfies SingleSiteSitemapPageConfig;

export const SINGLE_SITE_STATIC_PAGE_LASTMOD =
  getSingleSiteStaticPageLastmod() satisfies Record<string, string>;

export const SINGLE_SITE_ROBOTS_DISALLOW_PATHS = ["/api/", "/_next/"] as const;

export function getSingleSiteSitemapPageConfig(
  path: string,
): SingleSiteSitemapPageConfig {
  return (
    getSingleSiteSitemapPageConfigByPath()[path] ??
    SINGLE_SITE_SITEMAP_DEFAULT_CONFIG
  );
}
