/**
 * SEO和URL生成相关常量定义
 * 集中管理SEO优化中的魔法数字，提高代码可维护性
 */

// ==================== SEO优先级常量 ====================

/** SEO优先级常量 */
export const SEO_PRIORITY_CONSTANTS = {
  /** 最高优先级 - 1.0 (首页) */
  HIGHEST: 1.0,

  /** 高优先级 - 0.8 (重要页面) */
  HIGH: 0.8,

  /** 中等优先级 - 0.6 (一般页面) */
  MEDIUM: 0.6,

  /** 低优先级 - 0.4 (次要页面) */
  LOW: 0.4,

  /** 最低优先级 - 0.2 (归档页面) */
  LOWEST: 0.2,
} as const;

/** 网站地图更新频率常量 */
export const SITEMAP_CHANGEFREQ_CONSTANTS = {
  /** 每日更新 (首页、新闻) */
  DAILY: "daily",

  /** 每周更新 (产品页面、关于我们) */
  WEEKLY: "weekly",

  /** 每月更新 (政策页面) */
  MONTHLY: "monthly",

  /** 年度更新 (归档内容) */
  YEARLY: "yearly",

  /** 从不更新 (静态内容) */
  NEVER: "never",
} as const;

// ==================== URL生成常量 ====================

/** URL生成相关常量 */
export const URL_GENERATION_CONSTANTS = {
  /** 默认页面优先级 - 0.8 */
  DEFAULT_PAGE_PRIORITY: SEO_PRIORITY_CONSTANTS.HIGH,

  /** 首页优先级 - 1.0 */
  HOME_PAGE_PRIORITY: SEO_PRIORITY_CONSTANTS.HIGHEST,

  /** 默认更新频率 - weekly */
  DEFAULT_CHANGEFREQ: SITEMAP_CHANGEFREQ_CONSTANTS.WEEKLY,

  /** 首页更新频率 - daily */
  HOME_CHANGEFREQ: SITEMAP_CHANGEFREQ_CONSTANTS.DAILY,
} as const;

// ==================== 导出所有SEO常量 ====================

/** 所有SEO常量的统一导出 */
export const SEO_CONSTANTS = {
  PRIORITY: SEO_PRIORITY_CONSTANTS,
  CHANGEFREQ: SITEMAP_CHANGEFREQ_CONSTANTS,
  URL_GENERATION: URL_GENERATION_CONSTANTS,
} as const;

/** SEO常量类型定义 */
export type SeoConstants = typeof SEO_CONSTANTS;
export type SeoPriorityConstants = typeof SEO_PRIORITY_CONSTANTS;
export type SitemapChangefreqConstants = typeof SITEMAP_CHANGEFREQ_CONSTANTS;
export type UrlGenerationConstants = typeof URL_GENERATION_CONSTANTS;
