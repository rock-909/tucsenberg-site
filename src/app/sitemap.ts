import type { MetadataRoute } from "next";
import {
  getMdxPageLastModified,
  isMdxDrivenPage,
} from "@/lib/content/page-dates";
import {
  getStaticPageLastModified,
  type StaticPageLastModConfig,
} from "@/lib/sitemap-utils";
import {
  getBlogArticlePath,
  LOCALES_CONFIG,
  getProductMarketPath,
  SITE_CONFIG,
} from "@/config/paths";
import {
  getSingleSitePublicSeoProfileId,
  getSingleSitePublicStaticPages,
  getSingleSiteSitemapPageConfig,
  getSingleSiteStaticPageLastmod,
  hasSingleSiteDynamicSurface,
  type SingleSiteSitemapPageConfig,
} from "@/config/single-site-seo";
import type { StarterProfileId } from "@/config/starter-profiles";
import { routing } from "@/i18n/routing";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";
import {
  getStarterBlogArticle,
  getStarterBlogArticleModifiedAt,
  getStarterBlogArticleSlugs,
} from "@/lib/blog/starter-blog";

// Base URL for the site - uses centralized SITE_CONFIG for consistency
const BASE_URL = SITE_CONFIG.baseUrl;

type PageConfig = SingleSiteSitemapPageConfig;

function createStaticPageLastmod(
  profileId?: StarterProfileId,
): StaticPageLastModConfig {
  return new Map(
    Object.entries(getSingleSiteStaticPageLastmod(profileId)).map(
      ([route, isoDate]) => [route, new Date(isoDate)],
    ),
  );
}

// Helper to get page config
function getPageConfig(path: string, profileId?: StarterProfileId): PageConfig {
  return getSingleSiteSitemapPageConfig(path, profileId);
}

function buildLocalePath(locale: string, path: string): string {
  const normalizedPath = path === "" ? "/" : path;

  if (LOCALES_CONFIG.localePrefix === "never") {
    return normalizedPath;
  }

  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`;
}

function buildAbsoluteUrl(locale: string, path: string): string {
  return new URL(buildLocalePath(locale, path), BASE_URL).toString();
}

// Build alternate languages object for a URL path
function buildAlternateLanguages(path: string): Record<string, string> {
  const entries = routing.locales.map((locale) => [
    locale,
    buildAbsoluteUrl(locale, path),
  ]);
  // x-default 指向默认语言版本，帮助搜索引擎识别语言选择器页面
  entries.push(["x-default", buildAbsoluteUrl(routing.defaultLocale, path)]);
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

// Generate static page entries for all locales
async function generateStaticPageEntries(
  profileId?: StarterProfileId,
): Promise<MetadataRoute.Sitemap> {
  const publicStaticPages = getSingleSitePublicStaticPages(profileId);
  const staticPageLastmod = createStaticPageLastmod(profileId);
  const mdxPages = publicStaticPages.filter(isMdxDrivenPage);
  const mdxDates = new Map<string, Date>();
  await Promise.all(
    mdxPages.map(async (page) => {
      mdxDates.set(page, await getMdxPageLastModified(page));
    }),
  );

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const page of publicStaticPages) {
      const config = getPageConfig(page, profileId);
      const url = buildAbsoluteUrl(locale, page);
      const alternates = buildAlternateLanguages(page);
      const lastModified =
        mdxDates.get(page) ??
        getStaticPageLastModified(page, staticPageLastmod);

      entries.push(
        createSitemapEntry({ url, lastModified, config, alternates }),
      );
    }
  }

  return entries;
}

// Generate product catalog entries (market + family pages) for all locales
function generateCatalogEntries(
  profileId?: StarterProfileId,
): MetadataRoute.Sitemap {
  if (!hasSingleSiteDynamicSurface("productMarket", profileId)) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  const staticPageLastmod = createStaticPageLastmod(profileId);

  const marketConfig = getPageConfig("productMarket", profileId);
  for (const market of PRODUCT_CATALOG.markets) {
    const path = getProductMarketPath(market.slug);
    const lastModified = getStaticPageLastModified(path, staticPageLastmod);

    for (const locale of routing.locales) {
      entries.push(
        createSitemapEntry({
          url: buildAbsoluteUrl(locale, path),
          lastModified,
          config: marketConfig,
          alternates: buildAlternateLanguages(path),
        }),
      );
    }
  }

  return entries;
}

function generateBlogArticleEntries(
  profileId?: StarterProfileId,
): MetadataRoute.Sitemap {
  if (!hasSingleSiteDynamicSurface("blogArticle", profileId)) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];
  const articleConfig = getPageConfig("blogArticle", profileId);

  for (const slug of getStarterBlogArticleSlugs()) {
    const path = getBlogArticlePath(slug);

    for (const locale of routing.locales) {
      const article = getStarterBlogArticle(locale, slug);

      entries.push(
        createSitemapEntry({
          url: buildAbsoluteUrl(locale, path),
          lastModified: new Date(getStarterBlogArticleModifiedAt(article)),
          config: articleConfig,
          alternates: buildAlternateLanguages(path),
        }),
      );
    }
  }

  return entries;
}

export async function generateSitemapForProfile(
  profileId?: StarterProfileId,
): Promise<MetadataRoute.Sitemap> {
  const staticEntries = await generateStaticPageEntries(profileId);
  const catalogEntries = generateCatalogEntries(profileId);
  const blogArticleEntries = generateBlogArticleEntries(profileId);

  return [...staticEntries, ...catalogEntries, ...blogArticleEntries];
}

/**
 * Dynamic sitemap generation for Next.js.
 * Includes the selected starter profile's static pages and owned dynamic surfaces.
 */
export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateSitemapForProfile(getSingleSitePublicSeoProfileId());
}
