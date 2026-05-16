/**
 * 核心路径配置
 */

import { PUBLIC_STATIC_PAGE_DEFINITIONS } from "@/config/pages.config";
import type {
  DynamicPageType,
  DynamicRoutePattern,
  LocalizedPath,
  PageType,
} from "@/config/paths/types";

// 核心路径配置 - 使用标准路径方案
export const PATHS_CONFIG = Object.freeze(
  Object.fromEntries(
    PUBLIC_STATIC_PAGE_DEFINITIONS.map((definition) => [
      definition.pageType,
      definition.localizedPaths,
    ]),
  ),
) as Readonly<Record<PageType, LocalizedPath>>;

// 动态路由配置 - 用于 next-intl 路由和语言切换
export const DYNAMIC_PATHS_CONFIG = Object.freeze({
  productMarket: Object.freeze({
    pattern: "/products/[market]",
    paramName: "market",
  }),
  blogArticle: Object.freeze({
    pattern: "/blog/[slug]",
    paramName: "slug",
  }),
  membraneProduct: Object.freeze({
    pattern: "/membranes/[product]",
    paramName: "product",
  }),
  compatibleBrand: Object.freeze({
    pattern: "/compatible/[brand]",
    paramName: "brand",
  }),
} as const satisfies Record<DynamicPageType, DynamicRoutePattern>);

/**
 * @public Static path configuration contract for downstream routing customization.
 */
export type PathsConfig = typeof PATHS_CONFIG;
/**
 * @public Dynamic path configuration contract for downstream routing customization.
 */
export type DynamicPathsConfig = typeof DYNAMIC_PATHS_CONFIG;
