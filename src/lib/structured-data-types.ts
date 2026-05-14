import type { Locale } from "@/i18n/routing-config";

export type { Locale };

// 严格的结构化数据接口定义
export interface OrganizationData {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface WebSiteData {
  name?: string;
  description?: string;
  url?: string;
}

export interface ArticleData {
  title: string;
  description: string;
  author?: string;
  publishedTime: string;
  modifiedTime?: string;
  url: string;
  image?: string;
  section?: string;
}

export interface ProductData {
  name: string;
  description: string;
  brand?: string;
  manufacturer?: string;
  image?: string;
  price?: number;
  currency?: string;
  availability?: string;
  sku?: string;
}

export interface BreadcrumbData {
  items: Array<{
    name: string;
    url: string;
    position: number;
  }>;
}

/**
 * @public Structured data union for downstream schema customizations.
 */
export type StructuredDataType =
  | OrganizationData
  | WebSiteData
  | ArticleData
  | ProductData
  | BreadcrumbData;
