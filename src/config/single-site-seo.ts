import {
  type PublicStaticPageChangeFrequency,
  getActiveStaticPageLastmodByPath,
  getActiveStaticPageTypes,
  getActiveStaticSitemapPageConfigByPath,
  getActiveStaticSitemapPages,
} from "@/config/pages.config";
import type { DynamicPageType, PageType } from "@/config/paths/types";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import {
  DEFAULT_STARTER_PROFILE_ID,
  getStarterProfile,
  type StarterProfileId,
} from "@/config/starter-profiles";
import { getAllMarketSlugs } from "@/constants/product-catalog";
import { getMarketSpecsBySlug } from "@/constants/product-specs/market-spec-registry";

export type SingleSiteSitemapChangeFrequency = PublicStaticPageChangeFrequency;

export interface SingleSiteSitemapPageConfig {
  changeFrequency: SingleSiteSitemapChangeFrequency;
  priority: number;
}

const SINGLE_SITE_STATIC_LASTMOD_ISO = "2026-04-26T00:00:00Z";

const SINGLE_SITE_PRODUCT_MARKET_CONFIG = {
  changeFrequency: "weekly",
  priority: 0.8,
} as const satisfies SingleSiteSitemapPageConfig;

const SINGLE_SITE_BLOG_ARTICLE_CONFIG = {
  changeFrequency: "weekly",
  priority: 0.7,
} as const satisfies SingleSiteSitemapPageConfig;

export const SINGLE_SITE_PUBLIC_SEO_PROFILE_ID =
  DEFAULT_STARTER_PROFILE_ID satisfies StarterProfileId;

export function getSingleSitePublicSeoProfileId(): StarterProfileId {
  return SINGLE_SITE_PUBLIC_SEO_PROFILE_ID;
}

function buildSingleSiteProductMarketLastmod(): Record<string, string> {
  return Object.fromEntries(
    getAllMarketSlugs().map((marketSlug) => [
      getProductMarketPath(marketSlug),
      getMarketSpecsBySlug(marketSlug)?.updatedAt ??
        SINGLE_SITE_STATIC_LASTMOD_ISO,
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

export function getSingleSitePublicStaticPageRoutes(
  profileId?: StarterProfileId,
) {
  return getActiveStaticPageTypes(profileId);
}

export function getSingleSitePublicStaticPages(
  profileId?: StarterProfileId,
): string[] {
  return getActiveStaticSitemapPages(profileId);
}

export function hasSingleSiteDynamicSurface(
  dynamicSurface: DynamicPageType,
  profileId?: StarterProfileId,
): boolean {
  return getStarterProfile(profileId).dynamicSurfaces.includes(dynamicSurface);
}

function normalizePublicPagePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "" || trimmed === "/") {
    return "";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function shouldIndexPublicPageForProfile(
  pageType: PageType,
  path: string,
  profileId?: StarterProfileId,
): boolean {
  const normalizedPath = normalizePublicPagePath(path);
  const productsPath = getCanonicalPath("products");
  const blogPath = getCanonicalPath("blog");
  const activeTypes = new Set(getActiveStaticPageTypes(profileId));

  if (pageType === "products") {
    if (normalizedPath === productsPath) {
      return activeTypes.has("products");
    }

    if (normalizedPath.startsWith(`${productsPath}/`)) {
      return hasSingleSiteDynamicSurface("productMarket", profileId);
    }

    return false;
  }

  if (pageType === "blog") {
    if (normalizedPath === blogPath) {
      return activeTypes.has("blog");
    }

    if (normalizedPath.startsWith(`${blogPath}/`)) {
      return hasSingleSiteDynamicSurface("blogArticle", profileId);
    }

    return false;
  }

  return activeTypes.has(pageType);
}

export function getSingleSiteSitemapPageConfigByPath(
  profileId?: StarterProfileId,
): Readonly<Record<string, SingleSiteSitemapPageConfig>> {
  return {
    ...getActiveStaticSitemapPageConfigByPath(profileId),
    ...(hasSingleSiteDynamicSurface("productMarket", profileId)
      ? { productMarket: SINGLE_SITE_PRODUCT_MARKET_CONFIG }
      : {}),
    ...(hasSingleSiteDynamicSurface("blogArticle", profileId)
      ? { blogArticle: SINGLE_SITE_BLOG_ARTICLE_CONFIG }
      : {}),
  };
}

export function getSingleSiteStaticPageLastmod(
  profileId?: StarterProfileId,
): Record<string, string> {
  return {
    ...getActiveStaticPageLastmodByPath(profileId),
    ...(hasSingleSiteDynamicSurface("productMarket", profileId)
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

export const SINGLE_SITE_ROBOTS_DISALLOW_PATHS = [
  "/api/",
  "/_next/",
  "/ops/",
  "/error-test/",
] as const;

export function getSingleSiteSitemapPageConfig(
  path: string,
  profileId?: StarterProfileId,
): SingleSiteSitemapPageConfig {
  return (
    getSingleSiteSitemapPageConfigByPath(profileId)[path] ??
    SINGLE_SITE_SITEMAP_DEFAULT_CONFIG
  );
}
