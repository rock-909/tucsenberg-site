import type { Metadata } from "next";
import { getPublicStaticPageDefinition } from "@/config/pages.config";
import { SITE_CONFIG, type Locale, type PageType } from "@/config/paths";
import {
  getSingleSitePublicSeoProfileId,
  shouldIndexPublicPageForProfile,
} from "@/config/single-site-seo";
import { siteFacts } from "@/config/site-facts";
import { ONE } from "@/constants";
import { routing } from "@/i18n/routing-config";
import { getRuntimeEnvString } from "@/lib/env";
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

interface StaticPageMetadata {
  readonly title: string;
  readonly description?: string;
  readonly seo?: {
    readonly title?: string;
    readonly description?: string;
    readonly keywords?: string[];
    readonly ogImage?: string;
  };
}

interface StaticPageMetadataConfigOptions {
  readonly includeKeywords?: boolean;
  readonly includeImage?: boolean;
  readonly includeEmptyDescription?: boolean;
}

const FALLBACK_LOCALE: Locale = "en";

function resolveLocale(locale: Locale): Locale {
  return locale === FALLBACK_LOCALE ? locale : FALLBACK_LOCALE;
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

function buildCanonicalForPath(locale: Locale, path: string): string {
  resolveLocale(locale);
  const normalizedPath = normalizePath(path);
  return new URL(
    normalizedPath === "" ? "/" : normalizedPath,
    SITE_CONFIG.baseUrl,
  ).toString();
}

function buildLanguagesForPath(path: string): Record<string, string> {
  const normalizedPath = normalizePath(path);

  const entries: Array<[string, string]> = routing.locales.map((locale) => [
    locale,
    new URL(
      normalizedPath === "" ? "/" : normalizedPath,
      SITE_CONFIG.baseUrl,
    ).toString(),
  ]);
  entries.push([
    "x-default",
    new URL(
      normalizedPath === "" ? "/" : normalizedPath,
      SITE_CONFIG.baseUrl,
    ).toString(),
  ]);

  return Object.fromEntries(entries);
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
    case "content.pages.oem-wholesale":
      return {
        type: "website",
        keywords: ["OEM", "Wholesale", "Private Label", "Flood Barriers"],
      };
    case "content.pages.contact":
      return {
        type: "website",
        keywords: ["Contact", "Support", "Business"],
      };
    case "content.pages.flood-barrier-materials-guide":
      return {
        type: "website",
        keywords: ["Flood Barrier Materials", "ABS", "Aluminum", "FRP"],
      };
    case "catalog.overview":
      return {
        type: "website",
        keywords: ["Products", "Flood Barriers", "Flood Gates", "B2B"],
      };
    case "content.pages.flood-barrier-specifications":
      return {
        type: "website",
        keywords: ["Flood Barrier Specifications", "Product Tables", "RFQ"],
      };
    case "content.pages.request-quote":
      return {
        type: "website",
        keywords: ["Request Quote", "RFQ", "Flood Barrier Supply"],
      };
    case "content.pages.warranty":
      return {
        type: "website",
        keywords: ["Warranty", "Product Support", "Flood Barriers"],
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
    default:
      return {
        type: "website",
        keywords: [...SITE_CONFIG.seo.keywords, "B2B Solution"],
        image: "/images/og-image.jpg",
      };
  }
}

export function generateLocalizedMetadata(
  locale: Locale,
  pageType: PageType,
  config: SEOConfig = {},
): Metadata {
  const safeLocale = resolveLocale(locale);
  const title =
    config.title !== undefined && config.title.trim().length > 0
      ? interpolateSeoString(config.title)
      : SITE_CONFIG.seo.defaultTitle;
  const description =
    config.description !== undefined && config.description.trim().length > 0
      ? interpolateSeoString(config.description)
      : SITE_CONFIG.seo.defaultDescription;
  const siteName = SITE_CONFIG.name;

  const metadata: Metadata = {
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
    alternates: {
      canonical: generateCanonicalURL(pageType, safeLocale),
      languages: generateLanguageAlternates(pageType),
    },

    // 其他元数据
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -ONE,
        "max-image-preview": "large",
        "max-snippet": -ONE,
      },
    },

    // 验证标签
    verification: {
      google: getRuntimeEnvString("GOOGLE_SITE_VERIFICATION"),
      yandex: getRuntimeEnvString("YANDEX_VERIFICATION"),
    },
  };

  return metadata;
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

const INACTIVE_PROFILE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const satisfies Metadata["robots"];

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

  if (
    !shouldIndexPublicPageForProfile(
      pageType,
      path,
      getSingleSitePublicSeoProfileId(),
    )
  ) {
    metadata.robots = INACTIVE_PROFILE_ROBOTS;
  }

  return metadata;
}

export function createStaticPageMetadataConfig(
  metadata: StaticPageMetadata,
  options: StaticPageMetadataConfigOptions = {},
): Partial<SEOConfig> {
  const description = metadata.seo?.description ?? metadata.description;

  return {
    title: metadata.seo?.title ?? metadata.title,
    ...(description || (options.includeEmptyDescription && description === "")
      ? { description }
      : {}),
    ...(options.includeKeywords && metadata.seo?.keywords
      ? { keywords: metadata.seo.keywords }
      : {}),
    ...(options.includeImage && metadata.seo?.ogImage
      ? { image: metadata.seo.ogImage }
      : {}),
  };
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
