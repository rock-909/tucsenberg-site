import { getTranslations } from "next-intl/server";
import type {
  ArticleData,
  BreadcrumbData,
  OrganizationData,
  ProductData,
  WebSiteData,
} from "@/lib/structured-data-types";
import {
  getPublicContactPhone,
  getPublicLogoPath,
} from "@/config/public-trust";
import { SITE_CONFIG } from "@/config/paths/site-config";
import { routing, type Locale } from "@/i18n/routing";

const FALLBACK_BASE_URL = SITE_CONFIG.baseUrl;

interface ProductGroupInput {
  name: string;
  description: string;
  url: string;
  brand: string;
  products: Array<{
    name: string;
    description?: string;
    image?: string;
    url?: string;
  }>;
}

interface CustomProjectPageSchemaInput {
  name: string;
  description?: string;
  locale: string;
  specialty: string;
}

interface AboutPageSchemaInput {
  title: string;
  description?: string;
  locale: string;
  companyName: string;
  established: string | number;
  employees: number;
}

interface LegalPageSchemaInput {
  schemaType: "PrivacyPolicy" | "WebPage";
  additionalType?: string;
  locale: string;
  name: string;
  description?: string;
  publishedAt?: string;
  modifiedAt?: string;
}

interface LocalBusinessSchemaInput {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  openingHours?: string[];
  priceRange?: string;
}

function getSocialProfileUrls(
  t: Awaited<ReturnType<typeof getTranslations>>,
): string[] {
  return [
    t("organization.social.twitter", {
      defaultValue: SITE_CONFIG.social.twitter,
    }),
    t("organization.social.linkedin", {
      defaultValue: SITE_CONFIG.social.linkedin,
    }),
  ].filter((url) => /^https?:\/\//iu.test(url));
}

export function buildSchemaFallback(type: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": type,
  };
}

/**
 * 生成组织结构化数据
 */
export function generateOrganizationData(
  t: Awaited<ReturnType<typeof getTranslations>>,
  data: OrganizationData = {},
) {
  const logoPath = data.logo ?? getPublicLogoPath();
  const telephone = getPublicContactPhone(
    data.phone ?? SITE_CONFIG.contact.phone,
  );
  const sameAs = getSocialProfileUrls(t);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name:
      data.name ||
      t("organization.name", {
        defaultValue: SITE_CONFIG.name,
      }),
    description:
      data.description ||
      t("organization.description", {
        defaultValue: SITE_CONFIG.description,
      }),
    url: data.url || FALLBACK_BASE_URL,
    ...(logoPath
      ? { logo: new URL(logoPath, FALLBACK_BASE_URL).toString() }
      : {}),
    contactPoint: {
      "@type": "ContactPoint",
      ...(telephone ? { telephone } : {}),
      contactType: "customer service",
      availableLanguage: routing.locales,
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    // 移除 ...data 扩展运算符，只使用已验证的属性
  };
}

/**
 * 生成网站结构化数据
 */
export function generateWebSiteData(
  t: Awaited<ReturnType<typeof getTranslations>>,
  data: WebSiteData = {},
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name:
      data.name ||
      t("website.name", {
        defaultValue: SITE_CONFIG.name,
      }),
    description:
      data.description ||
      t("website.description", {
        defaultValue: SITE_CONFIG.seo.defaultDescription,
      }),
    url: data.url || FALLBACK_BASE_URL,
    inLanguage: routing.locales,
    // 移除 ...data 扩展运算符，只使用已验证的属性
  };
}

/**
 * 生成文章结构化数据
 */
export function generateArticleData(
  t: Awaited<ReturnType<typeof getTranslations>>,
  locale: Locale,
  data: ArticleData,
) {
  const logoPath = getPublicLogoPath();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    author: {
      "@type": "Person",
      name:
        data.author ||
        t("article.defaultAuthor", {
          defaultValue: `${SITE_CONFIG.name} Team`,
        }),
    },
    publisher: {
      "@type": "Organization",
      name: t("organization.name", {
        defaultValue: SITE_CONFIG.name,
      }),
      ...(logoPath
        ? {
            logo: {
              "@type": "ImageObject",
              url: new URL(logoPath, FALLBACK_BASE_URL).toString(),
            },
          }
        : {}),
    },
    datePublished: data.publishedTime,
    dateModified: data.modifiedTime || data.publishedTime,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": data.url,
    },
    image: data.image
      ? {
          "@type": "ImageObject",
          url: data.image,
        }
      : undefined,
    inLanguage: locale,
    section: data.section,
    // 移除 ...data 扩展运算符，只使用已验证的属性
  };
}

/**
 * 生成产品结构化数据
 */
export function generateProductData(
  t: Awaited<ReturnType<typeof getTranslations>>,
  data: ProductData,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    description: data.description,
    brand: {
      "@type": "Brand",
      name:
        data.brand ||
        t("organization.name", {
          defaultValue: SITE_CONFIG.name,
        }),
    },
    manufacturer: {
      "@type": "Organization",
      name:
        data.manufacturer ||
        t("organization.name", {
          defaultValue: SITE_CONFIG.name,
        }),
    },
    image: data.image ? [data.image] : undefined,
    offers: data.price
      ? {
          "@type": "Offer",
          price: data.price,
          priceCurrency: data.currency || "USD",
          availability: data.availability || "https://schema.org/InStock",
        }
      : undefined,
    sku: data.sku,
    // 移除 ...data 扩展运算符，只使用已验证的属性
  };
}

export function generateProductGroupData(
  data: ProductGroupInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: data.name,
    description: data.description,
    url: data.url,
    brand: {
      "@type": "Brand",
      name: data.brand,
    },
    hasVariant: data.products.map((product) => ({
      "@type": "Product",
      name: product.name,
      ...(product.description ? { description: product.description } : {}),
      ...(product.image ? { image: product.image } : {}),
      ...(product.url ? { url: product.url } : {}),
    })),
  };
}

export function buildCustomProjectPageSchema(
  data: CustomProjectPageSchemaInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.name,
    ...(data.description ? { description: data.description } : {}),
    inLanguage: data.locale,
    specialty: data.specialty,
  };
}

export function buildAboutPageSchema(
  data: AboutPageSchemaInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: data.title,
    ...(data.description ? { description: data.description } : {}),
    inLanguage: data.locale,
    mainEntity: {
      "@type": "Organization",
      name: data.companyName,
      foundingDate: String(data.established),
      numberOfEmployees: {
        "@type": "QuantitativeValue",
        value: data.employees,
      },
    },
  };
}

export function buildLegalPageSchema(
  data: LegalPageSchemaInput,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": data.schemaType,
    ...(data.additionalType ? { additionalType: data.additionalType } : {}),
    inLanguage: data.locale,
    name: data.name,
    ...(data.description ? { description: data.description } : {}),
    ...(data.publishedAt ? { datePublished: data.publishedAt } : {}),
    ...(data.modifiedAt ? { dateModified: data.modifiedAt } : {}),
  };
}

export function buildBreadcrumbListSchema(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return generateBreadcrumbData({
    items: items.map((item, index) => ({
      ...item,
      position: index + 1,
    })),
  });
}

export function buildLocalBusinessSchema(
  business: LocalBusinessSchemaInput,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
    },
    url: SITE_CONFIG.baseUrl,
  };

  if (business.phone) {
    schema.telephone = business.phone;
  }
  if (business.email) {
    schema.email = business.email;
  }
  if (business.openingHours) {
    schema.openingHours = business.openingHours;
  }
  if (business.priceRange) {
    schema.priceRange = business.priceRange;
  }

  return schema;
}

/**
 * 生成面包屑结构化数据
 */
export function generateBreadcrumbData(data: BreadcrumbData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement:
      data.items?.map((item, index) => ({
        "@type": "ListItem",
        position: item.position || index + 1,
        name: item.name,
        item: item.url,
      })) || [],
    // 移除 ...data 扩展运算符，只使用已验证的属性
  };
}
