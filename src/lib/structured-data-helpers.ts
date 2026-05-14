import { getTranslations } from "next-intl/server";
import { I18nPerformanceMonitor } from "@/lib/i18n/performance";
import {
  buildLocalBusinessSchema,
  buildSchemaFallback,
  generateArticleData,
  generateBreadcrumbData,
  generateOrganizationData,
  generateProductData,
  generateWebSiteData,
} from "@/lib/structured-data-generators";
import type {
  ArticleData,
  BreadcrumbData,
  Locale,
  OrganizationData,
  ProductData,
  WebSiteData,
} from "@/lib/structured-data-types";

/**
 * 创建面包屑导航结构化数据
 *
 * @public Structured data helper kept for downstream SEO customizations.
 */
export function createBreadcrumbStructuredData(
  locale: Locale,
  breadcrumbs: Array<{ name: string; url: string }>,
) {
  return generateLocalizedStructuredData(locale, "BreadcrumbList", {
    items: breadcrumbs.map((item, index) => ({
      name: item.name,
      url: item.url,
      position: index + 1,
    })),
  });
}

/**
 * 创建文章结构化数据
 *
 * @public Structured data helper kept for downstream SEO customizations.
 */
export function createArticleStructuredData(
  locale: Locale,
  article: {
    title: string;
    description: string;
    author?: string;
    publishedTime: string;
    modifiedTime?: string;
    url: string;
    image?: string;
  },
) {
  return generateLocalizedStructuredData(locale, "Article", article);
}

export function generateProductSchema(
  product: {
    name: string;
    description: string;
    image?: string;
    price?: string | number;
    currency?: string;
    availability?: string;
    brand?: string;
    sku?: string;
  },
  locale: Locale,
) {
  // 规范化价格为 number | undefined 以适配内部类型
  const normalizedPrice =
    typeof product.price === "string" ? Number(product.price) : product.price;
  const payload: Partial<ProductData> = {
    name: product.name,
    description: product.description,
  };

  if (product.brand) {
    payload.brand = product.brand;
  }
  if (product.image) {
    payload.image = product.image;
  }
  if (normalizedPrice !== undefined) {
    payload.price = normalizedPrice;
  }
  if (product.currency) {
    payload.currency = product.currency;
  }
  if (product.availability) {
    payload.availability = product.availability;
  }
  if (product.sku) {
    payload.sku = product.sku;
  }

  return generateLocalizedStructuredData(
    locale,
    "Product",
    payload as ProductData,
  );
}

export function generateLocalBusinessSchema(
  business: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    openingHours?: string[];
    priceRange?: string;
  },
  _locale: Locale,
) {
  return buildLocalBusinessSchema(business);
}

/**
 * 生成本地化结构化数据
 */
export async function generateLocalizedStructuredData(
  locale: Locale,
  type: "Organization" | "WebSite" | "Article" | "Product" | "BreadcrumbList",
  data: unknown,
): Promise<Record<string, unknown>> {
  try {
    // 使用原始的getTranslations，缓存已在底层实现
    const t = await getTranslations({ locale, namespace: "structured-data" });

    switch (type) {
      case "Organization":
        return generateOrganizationData(
          t,
          data as OrganizationData | undefined,
        );
      case "WebSite":
        return generateWebSiteData(t, data as WebSiteData | undefined);
      case "Article":
        return generateArticleData(t, locale, data as ArticleData);
      case "Product":
        return generateProductData(t, data as ProductData);
      case "BreadcrumbList":
        return generateBreadcrumbData(data as BreadcrumbData);
      default:
        return buildSchemaFallback(type);
    }
  } catch (error) {
    // 记录错误并返回基础结构
    if (error instanceof Error) {
      // 处理已知错误类型
      I18nPerformanceMonitor.recordError();
    }
    return buildSchemaFallback(type);
  }
}
