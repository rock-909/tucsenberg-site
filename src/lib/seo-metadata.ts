import type { Metadata } from "next";
import {
  getPublicStaticPageDefinition,
  isNoindexStaticPageType,
} from "@/config/pages.config";
import {
  LOCALES_CONFIG,
  SITE_CONFIG,
  type Locale,
  type PageType,
} from "@/config/paths";
import { siteFacts } from "@/config/site-facts";
import { isPublicSeoLocale } from "@/config/paths/locales-config";
import { ONE } from "@/constants";
import { getPublicRuntimeEnvString, getRuntimeEnvString } from "@/lib/env";
import {
  generateCanonicalURL,
  generateLanguageAlternates,
} from "@/lib/seo/url-generator";

// 重新导出类型以保持向后兼容
export type { Locale, PageType } from "@/config/paths";

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  section?: string;
}

const FALLBACK_LOCALE: Locale = "en";

function resolveLocale(locale: Locale): Locale {
  return LOCALES_CONFIG.locales.includes(locale) ? locale : FALLBACK_LOCALE;
}

/** Replace ICU-style {placeholders} with siteFacts values in SEO strings. */
const SEO_INTERPOLATION_MAP: Record<string, string | number> = {
  established: siteFacts.company.established,
  countries: siteFacts.stats.exportCountries,
  employees: siteFacts.company.employees,
};

function interpolateSeoString(text: string): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = SEO_INTERPOLATION_MAP[key];
    return value !== undefined ? String(value) : match;
  });
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (trimmed === "" || trimmed === "/") {
    return "";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function getRequestAwareBaseUrl(): string {
  const siteUrl = getPublicRuntimeEnvString("NEXT_PUBLIC_SITE_URL");
  if (siteUrl !== undefined && siteUrl.trim().length > 0) {
    return siteUrl;
  }

  const baseUrl = getPublicRuntimeEnvString("NEXT_PUBLIC_BASE_URL");
  if (baseUrl !== undefined && baseUrl.trim().length > 0) {
    return baseUrl;
  }

  return SITE_CONFIG.baseUrl;
}

function buildCanonicalForPath(locale: Locale, path: string): string {
  const safeLocale = resolveLocale(locale);
  const normalizedPath = normalizePath(path);
  return new URL(
    `/${safeLocale}${normalizedPath}`,
    getRequestAwareBaseUrl(),
  ).toString();
}

function buildLanguagesForPath(path: string): Record<string, string> {
  const normalizedPath = normalizePath(path);
  const baseUrl = getRequestAwareBaseUrl();

  const entries: Array<[string, string]> = LOCALES_CONFIG.publicLocales.map(
    (locale) => [
      locale,
      new URL(`/${locale}${normalizedPath}`, baseUrl).toString(),
    ],
  );
  entries.push([
    "x-default",
    new URL(
      `/${LOCALES_CONFIG.defaultLocale}${normalizedPath}`,
      baseUrl,
    ).toString(),
  ]);

  return Object.fromEntries(entries);
}

function buildRobotsForLocale(
  locale: Locale,
  pageType: PageType,
): Metadata["robots"] {
  // De-listed legacy starter pages are noindex for every locale; ZH is
  // already noindex via the public-SEO-locale gate.
  const shouldIndex =
    isPublicSeoLocale(locale) && !isNoindexStaticPageType(pageType);

  return {
    index: shouldIndex,
    follow: shouldIndex,
    googleBot: {
      index: shouldIndex,
      follow: shouldIndex,
      "max-video-preview": -ONE,
      "max-image-preview": "large",
      "max-snippet": -ONE,
    },
  };
}

/**
 * Apply base fields to merged config
 */
function applyBaseFields(target: SEOConfig, base: SEOConfig): void {
  if (base.type !== undefined) target.type = base.type;
  if (base.keywords !== undefined) target.keywords = base.keywords;
  if (base.image !== undefined) target.image = base.image;
}

/**
 * Apply custom fields to merged config
 */
function applyCustomFields(
  target: SEOConfig,
  custom: Partial<SEOConfig>,
): void {
  if (custom.type !== undefined) target.type = custom.type;
  if (custom.keywords !== undefined) target.keywords = custom.keywords;
  if (custom.image !== undefined) target.image = custom.image;
  if (custom.title !== undefined) target.title = custom.title;
  if (custom.description !== undefined) target.description = custom.description;
  if (custom.publishedTime !== undefined)
    target.publishedTime = custom.publishedTime;
  if (custom.modifiedTime !== undefined)
    target.modifiedTime = custom.modifiedTime;
  if (custom.authors !== undefined) target.authors = custom.authors;
  if (custom.section !== undefined) target.section = custom.section;
}

function mergeSEOConfig(
  baseConfig: SEOConfig,
  customConfig?: Partial<SEOConfig> | null,
): SEOConfig {
  const mergedConfig: SEOConfig = {};

  applyBaseFields(mergedConfig, baseConfig);

  if (customConfig === null || customConfig === undefined) {
    return mergedConfig;
  }

  applyCustomFields(mergedConfig, customConfig);

  return mergedConfig;
}

function createStaticPageSeoDefaults(pageType: PageType): SEOConfig {
  const definition =
    getPublicStaticPageDefinition(pageType) ??
    getPublicStaticPageDefinition("home");

  if (definition === undefined) {
    return {
      type: "website",
      keywords: [...SITE_CONFIG.seo.keywords, "B2B Solution"],
      image: "/images/og-image.jpg",
    };
  }

  switch (definition.seoKey) {
    case "home":
      return {
        type: "website",
        keywords: [...SITE_CONFIG.seo.keywords, "B2B Solution"],
        image: "/images/og-image.jpg",
      };
    case "content.pages.about":
      return {
        type: "website",
        keywords: ["About", "Company", "Team", "Enterprise"],
      };
    case "content.pages.capabilities":
      return {
        type: "website",
        keywords: ["Capabilities", "Website Starter", "Lead Foundation", "B2B"],
      };
    case "content.pages.contact":
      return {
        type: "website",
        keywords: ["Contact", "Support", "Business"],
      };
    case "content.pages.how-it-works":
      return {
        type: "website",
        keywords: ["How It Works", "Setup", "Launch", "Website Starter"],
      };
    case "catalog.overview":
      return {
        type: "website",
        keywords: ["Products", "Solutions", "Enterprise", "B2B"],
      };
    case "blog.index":
      return {
        type: "website",
        keywords: ["Blog", "Launch Guide", "Website Starter", "Cloudflare"],
      };
    case "content.pages.privacy":
      return {
        type: "website",
        keywords: ["Privacy", "Policy", "Data Protection"],
      };
    case "content.pages.terms":
      return {
        type: "website",
        keywords: ["Terms", "Conditions", "Legal"],
      };
    case "content.pages.custom-project-support":
      return {
        type: "website",
        keywords: [
          "Custom Project",
          "Website Starter",
          "Brand Adaptation",
          "Implementation Support",
        ],
      };
    default:
      return {
        type: "website",
        keywords: [...SITE_CONFIG.seo.keywords, "B2B Solution"],
        image: "/images/og-image.jpg",
      };
  }
}

/**
 * Build the shared metadata object (title/description/OG/Twitter/verification).
 *
 * Canonical, hreflang, and robots are passed in so static-route and
 * dynamic-route callers reuse the exact same chrome assembly instead of
 * maintaining a parallel metadata builder.
 */
function buildMetadataObject(params: {
  safeLocale: Locale;
  config: SEOConfig;
  alternates: NonNullable<Metadata["alternates"]>;
  robots: Metadata["robots"];
}): Metadata {
  const { safeLocale, config, alternates, robots } = params;
  const title =
    config.title !== undefined && config.title.trim().length > 0
      ? interpolateSeoString(config.title)
      : SITE_CONFIG.seo.defaultTitle;
  const description =
    config.description !== undefined && config.description.trim().length > 0
      ? interpolateSeoString(config.description)
      : SITE_CONFIG.seo.defaultDescription;
  const siteName = SITE_CONFIG.name;

  return {
    title,
    description,
    keywords: config.keywords ?? SITE_CONFIG.seo.keywords,

    // Open Graph本地化
    openGraph: {
      title,
      description,
      siteName,
      locale: safeLocale,
      type: (config.type === "product" ? "website" : config.type) || "website",
      images: config.image ? [{ url: config.image }] : undefined,
      publishedTime: config.publishedTime,
      modifiedTime: config.modifiedTime,
      authors: config.authors,
      section: config.section,
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: config.image ? [config.image] : undefined,
    },

    // hreflang和canonical链接
    alternates,

    // 其他元数据
    robots,

    // 验证标签
    verification: {
      google: getRuntimeEnvString("GOOGLE_SITE_VERIFICATION"),
      yandex: getRuntimeEnvString("YANDEX_VERIFICATION"),
    },
  };
}

export function generateLocalizedMetadata(
  locale: Locale,
  pageType: PageType,
  config: SEOConfig = {},
): Metadata {
  const safeLocale = resolveLocale(locale);

  return buildMetadataObject({
    safeLocale,
    config,
    alternates: {
      canonical: generateCanonicalURL(pageType, safeLocale),
      languages: generateLanguageAlternates(pageType),
    },
    robots: buildRobotsForLocale(safeLocale, pageType),
  });
}

/**
 * Generate path-aware metadata for App Router pages.
 *
 * Next.js metadata uses shallow merges: if a page does not explicitly return
 * `alternates` or `openGraph.url`, it may inherit those fields from a parent layout.
 * This helper ensures canonical/hreflang and OG URL are always derived from the
 * actual route path.
 */
interface GenerateMetadataForPathParams {
  locale: Locale;
  pageType: PageType;
  path: string;
  config?: Partial<SEOConfig>;
}

export function generateMetadataForPath(
  params: GenerateMetadataForPathParams,
): Metadata {
  const { locale, pageType, path, config } = params;

  const seoConfig = createPageSEOConfig(pageType, config ?? {});
  const metadata = generateLocalizedMetadata(locale, pageType, seoConfig);

  const canonical = buildCanonicalForPath(locale, path);
  const languages = buildLanguagesForPath(path);

  metadata.alternates = {
    canonical,
    languages,
  };

  const { openGraph } = metadata;
  if (openGraph && typeof openGraph === "object") {
    (openGraph as { url?: string | URL }).url = canonical;
    metadata.openGraph = openGraph;
  } else {
    metadata.openGraph = {
      url: canonical,
    } as unknown as Metadata["openGraph"];
  }

  return metadata;
}

/**
 * Robots for dynamic catalog/compatibility detail routes.
 *
 * These routes have no static `PageType` definition. Per the documented
 * contract in `isNoindexStaticPageType`, dynamic catalog/compatibility routes
 * are NOT de-listed and stay indexable; only the internal `zh` locale is
 * noindex (it is excluded from canonical/hreflang/sitemap, en/es only).
 */
function buildDynamicRouteRobots(locale: Locale): Metadata["robots"] {
  const shouldIndex = isPublicSeoLocale(locale);

  return {
    index: shouldIndex,
    follow: shouldIndex,
    googleBot: {
      index: shouldIndex,
      follow: shouldIndex,
      "max-video-preview": -ONE,
      "max-image-preview": "large",
      "max-snippet": -ONE,
    },
  };
}

/**
 * Path-aware metadata for dynamic catalog/compatibility detail routes
 * (`/membranes/[product]`, `/compatible/[brand]`) that have no static
 * `PageType` definition.
 *
 * Reuses the SAME canonical/hreflang/OG primitives as
 * `generateMetadataForPath`: canonical and `alternates.languages` are derived
 * purely from the resolved route `path` and the public-SEO-locale source of
 * truth (`LOCALES_CONFIG.publicLocales` → en + es + x-default, never zh).
 * The caller MUST pass the canonical descriptive path (not a redirect-source
 * SKU slug) so the emitted canonical matches the route's 308 redirect target.
 */
interface GenerateMetadataForDynamicPathParams {
  locale: Locale;
  path: string;
  config?: Partial<SEOConfig>;
}

export function generateMetadataForDynamicPath(
  params: GenerateMetadataForDynamicPathParams,
): Metadata {
  const { locale, path, config } = params;
  const safeLocale = resolveLocale(locale);

  const seoConfig = mergeSEOConfig(
    { type: "website", keywords: SITE_CONFIG.seo.keywords },
    config ?? {},
  );

  const canonical = buildCanonicalForPath(safeLocale, path);
  const languages = buildLanguagesForPath(path);

  const metadata = buildMetadataObject({
    safeLocale,
    config: seoConfig,
    alternates: { canonical, languages },
    robots: buildDynamicRouteRobots(safeLocale),
  });

  const { openGraph } = metadata;
  if (openGraph && typeof openGraph === "object") {
    (openGraph as { url?: string | URL }).url = canonical;
    metadata.openGraph = openGraph;
  } else {
    metadata.openGraph = {
      url: canonical,
    } as unknown as Metadata["openGraph"];
  }

  return metadata;
}

/**
 * 生成页面特定的SEO配置
 */
export function createPageSEOConfig(
  pageType: PageType,
  customConfig: Partial<SEOConfig> = {},
): SEOConfig {
  return mergeSEOConfig(createStaticPageSeoDefaults(pageType), customConfig);
}
