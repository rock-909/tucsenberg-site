import type { MetadataRoute } from "next";
import {
  getMdxPageLastModified,
  isMdxDrivenPage,
} from "@/lib/content/page-dates";
import {
  getStaticPageLastModified,
  type StaticPageLastModConfig,
} from "@/lib/sitemap-utils";
import { isNoindexStaticPageType } from "@/config/pages.config";
import { LOCALES_CONFIG, SITE_CONFIG } from "@/config/paths";
import {
  getCompatibleBrandPath,
  getMembraneProductPath,
  getProductMarketPath,
} from "@/config/paths/utils";
import {
  canonicalProductSlug,
  oemBrands,
  productVariants,
} from "@/data/product-compatibility";
import {
  getSingleSiteSitemapPageConfig,
  SINGLE_SITE_COMPATIBILITY_LASTMOD_ISO,
  SINGLE_SITE_PUBLIC_STATIC_PAGES,
  SINGLE_SITE_STATIC_PAGE_LASTMOD,
  type SingleSiteSitemapPageConfig,
} from "@/config/single-site-seo";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";

// Base URL for the site - uses centralized SITE_CONFIG for consistency
const BASE_URL = SITE_CONFIG.baseUrl;
const PUBLIC_LOCALES = LOCALES_CONFIG.publicLocales;

type PageConfig = SingleSiteSitemapPageConfig;

const STATIC_PAGE_LASTMOD: StaticPageLastModConfig = new Map(
  Object.entries(SINGLE_SITE_STATIC_PAGE_LASTMOD).map(([route, isoDate]) => [
    route,
    new Date(isoDate),
  ]),
);

// Helper to get page config
function getPageConfig(path: string): PageConfig {
  return getSingleSiteSitemapPageConfig(path);
}

// Build alternate languages object for a URL path
function buildAlternateLanguages(path: string): Record<string, string> {
  const entries = PUBLIC_LOCALES.map((locale) => [
    locale,
    `${BASE_URL}/${locale}${path}`,
  ]);
  // x-default 指向默认语言版本，帮助搜索引擎识别语言选择器页面
  entries.push([
    "x-default",
    `${BASE_URL}/${LOCALES_CONFIG.defaultLocale}${path}`,
  ]);
  return Object.fromEntries(entries);
}

interface SitemapEntryParams {
  url: string;
  lastModified: Date;
  config: PageConfig;
  alternates: Record<string, string>;
}

// Generate a single sitemap entry
function createSitemapEntry(
  params: SitemapEntryParams,
): MetadataRoute.Sitemap[number] {
  return {
    url: params.url,
    lastModified: params.lastModified,
    changeFrequency: params.config.changeFrequency,
    priority: params.config.priority,
    alternates: {
      languages: params.alternates,
    },
  };
}

// Generate static page entries for public SEO locales only
async function generateStaticPageEntries(): Promise<MetadataRoute.Sitemap> {
  const mdxPages = SINGLE_SITE_PUBLIC_STATIC_PAGES.filter(isMdxDrivenPage);
  const mdxDates = new Map<string, Date>();
  await Promise.all(
    mdxPages.map(async (page) => {
      mdxDates.set(page, await getMdxPageLastModified(page));
    }),
  );

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of PUBLIC_LOCALES) {
    for (const page of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
      const config = getPageConfig(page);
      const url = `${BASE_URL}/${locale}${page}`;
      const alternates = buildAlternateLanguages(page);
      const lastModified =
        mdxDates.get(page) ??
        getStaticPageLastModified(page, STATIC_PAGE_LASTMOD);

      entries.push(
        createSitemapEntry({ url, lastModified, config, alternates }),
      );
    }
  }

  return entries;
}

// Generate product catalog entries (market pages) for public SEO locales only.
//
// The `/products/[market]` market landing pages are the starter-era catalog
// surface that lives under the `/products` overview. While that overview is
// de-listed + noindex (Wave B: `products` page type `sitemap.include: false`
// in pages.config.ts, because it still leaks starter slop + `[ES-TODO]`),
// emitting its child market URLs into the public sitemap would submit URLs
// whose own page metadata is `noindex` — a self-contradicting SEO leak.
//
// Gate the whole catalog emission on the SAME source of truth Wave B uses
// (`isNoindexStaticPageType("products")`). When a later Step rebuilds the
// product overview as real Tucsenberg content and flips its `sitemap.include`
// back to `true`, this function re-enables automatically — the generation
// path is intentionally kept intact below.
function generateCatalogEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  if (isNoindexStaticPageType("products")) {
    return entries;
  }

  // Market landing pages
  const marketConfig = getPageConfig("productMarket");
  for (const market of PRODUCT_CATALOG.markets) {
    const path = getProductMarketPath(market.slug);
    const lastModified = getStaticPageLastModified(path, STATIC_PAGE_LASTMOD);

    for (const locale of PUBLIC_LOCALES) {
      entries.push(
        createSitemapEntry({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified,
          config: marketConfig,
          alternates: buildAlternateLanguages(path),
        }),
      );
    }
  }

  return entries;
}

// Generate product-compatibility entries (membrane product detail pages and
// OEM compatibility pages) for public SEO locales only.
function generateCompatibilityEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date(SINGLE_SITE_COMPATIBILITY_LASTMOD_ISO);

  const membraneConfig = getPageConfig("membraneProduct");
  // Emit ONLY the canonical descriptive slug. The legacy SKU slug is a
  // permanent-redirect source, not an indexable URL.
  for (const variant of productVariants) {
    const path = getMembraneProductPath(canonicalProductSlug(variant));

    for (const locale of PUBLIC_LOCALES) {
      entries.push(
        createSitemapEntry({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified,
          config: membraneConfig,
          alternates: buildAlternateLanguages(path),
        }),
      );
    }
  }

  const brandConfig = getPageConfig("compatibleBrand");
  for (const brand of oemBrands) {
    const path = getCompatibleBrandPath(brand.slug);

    for (const locale of PUBLIC_LOCALES) {
      entries.push(
        createSitemapEntry({
          url: `${BASE_URL}/${locale}${path}`,
          lastModified,
          config: brandConfig,
          alternates: buildAlternateLanguages(path),
        }),
      );
    }
  }

  return entries;
}

/**
 * Dynamic sitemap generation for Next.js.
 * Includes static pages, product catalog pages, and product-compatibility
 * detail/brand pages with i18n alternates.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = await generateStaticPageEntries();
  const catalogEntries = generateCatalogEntries();
  const compatibilityEntries = generateCompatibilityEntries();

  return [...staticEntries, ...catalogEntries, ...compatibilityEntries];
}
