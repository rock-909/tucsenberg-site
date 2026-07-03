/**
 * 路径配置相关类型定义
 */

import { LOCALES_CONFIG } from "@/config/paths/locales-config";

export type Locale = (typeof LOCALES_CONFIG.locales)[number];

// 路径映射接口定义
export type LocalizedPath = {
  [locale in Locale]: string;
};

// 页面类型定义 (静态路由)
export type PageType =
  | "home"
  | "capabilities"
  | "howItWorks"
  | "about"
  | "contact"
  | "oemWholesale"
  | "materialsGuide"
  | "specificationsGuide"
  | "requestQuote"
  | "warranty"
  | "products"
  | "blog"
  | "resources"
  | "privacy"
  | "terms"
  | "customProject";

// 动态路由类型定义
export type DynamicPageType = "productMarket" | "blogArticle";

// 动态路由路径模式
export interface DynamicRoutePattern {
  pattern: string;
  paramName: string;
  paramNames?: readonly string[];
}
