/**
 * 集中URL生成服务
 * 统一管理所有URL生成逻辑，确保一致性和类型安全
 */

import {
  getLocalizedPath,
  LOCALES_CONFIG,
  PATHS_CONFIG,
  SITE_CONFIG,
  type Locale,
  type PageType,
} from "@/config/paths";
import type { PublicSeoLocale } from "@/config/paths/locales-config";
import { SEO_CONSTANTS } from "@/constants/seo-constants";

// URL生成选项接口
export interface URLGeneratorOptions {
  includeLocale?: boolean;
  absolute?: boolean;
  trailingSlash?: boolean;
  protocol?: "http" | "https";
  host?: string;
}

// 默认选项
const DEFAULT_OPTIONS: Required<URLGeneratorOptions> = {
  includeLocale: true,
  absolute: false,
  trailingSlash: false,
  protocol: "https",
  host: "",
};

// hreflang链接接口
export interface HreflangLink {
  href: string;
  hreflang: string;
}

// Sitemap条目接口
export interface SitemapEntry {
  loc: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  lastmod?: string;
  alternateRefs?: HreflangLink[];
}

/**
 * 核心URL生成器类
 */
export class URLGenerator {
  private readonly baseUrl: string;
  private readonly defaultLocale: Locale;
  private readonly locales: readonly Locale[];
  private readonly publicLocales: readonly PublicSeoLocale[];

  constructor() {
    this.baseUrl = SITE_CONFIG.baseUrl;
    this.defaultLocale = LOCALES_CONFIG.defaultLocale;
    this.locales = LOCALES_CONFIG.locales;
    this.publicLocales = LOCALES_CONFIG.publicLocales;
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(
    options: URLGeneratorOptions,
  ): Required<URLGeneratorOptions> {
    return {
      includeLocale: options.includeLocale ?? DEFAULT_OPTIONS.includeLocale,
      absolute: options.absolute ?? DEFAULT_OPTIONS.absolute,
      trailingSlash: options.trailingSlash ?? DEFAULT_OPTIONS.trailingSlash,
      protocol: options.protocol ?? DEFAULT_OPTIONS.protocol,
      host: options.host ?? DEFAULT_OPTIONS.host,
    };
  }

  /**
   * Build path with locale prefix and page path
   */
  private buildPath(
    locale: Locale,
    localizedPath: string,
    includeLocale: boolean,
  ): string {
    let path = "";
    // Always include locale prefix when localePrefix: 'always' is configured
    if (includeLocale) {
      path += `/${locale}`;
    }
    if (localizedPath !== "/" || path === "") {
      path += localizedPath;
    }
    return path;
  }

  /**
   * Apply trailing slash if needed
   */
  private applyTrailingSlash(path: string, trailingSlash: boolean): string {
    if (trailingSlash && !path.endsWith("/") && path !== "") {
      return `${path}/`;
    }
    return path;
  }

  /**
   * Build absolute URL
   */
  private buildAbsoluteURL(
    path: string,
    opts: Required<URLGeneratorOptions>,
  ): string {
    const host = opts.host || this.baseUrl.replace(/^https?:\/\//, "");
    return `${opts.protocol}://${host}${path}`;
  }

  /**
   * 生成页面URL
   */
  generatePageURL(
    pageType: PageType,
    locale: Locale,
    options: URLGeneratorOptions = {},
  ): string {
    const opts = this.mergeOptions(options);
    const localizedPath = this.getLocalizedPathForLocale(pageType, locale);

    let path = this.buildPath(locale, localizedPath, opts.includeLocale);
    path = this.applyTrailingSlash(path, opts.trailingSlash);

    if (opts.absolute) {
      return this.buildAbsoluteURL(path, opts);
    }

    return path || "/";
  }

  /**
   * Resolve page path for all runtime locales.
   *
   * Some locale content can share the default path before fully translated
   * pathnames exist. Runtime URL generation should still work for those
   * locales instead of blocking public SEO alternates.
   */
  private getLocalizedPathForLocale(
    pageType: PageType,
    locale: Locale,
  ): string {
    const paths = PATHS_CONFIG[pageType];
    if (paths && Object.prototype.hasOwnProperty.call(paths, locale)) {
      return paths[locale];
    }

    return getLocalizedPath(pageType, this.defaultLocale);
  }

  /**
   * 生成规范化URL（用于SEO）
   */
  generateCanonicalURL(pageType: PageType, locale: Locale): string {
    return this.generatePageURL(pageType, locale, {
      absolute: true,
      includeLocale: true,
      trailingSlash: false,
    });
  }

  /**
   * 生成所有语言版本的URL映射（含 x-default）
   */
  generateLanguageAlternates(
    pageType: PageType,
  ): Record<PublicSeoLocale | "x-default", string> {
    const alternates: Record<string, string> = {};

    this.publicLocales.forEach((locale) => {
      alternates[locale] = this.generateCanonicalURL(pageType, locale);
    });

    // x-default 指向默认语言版本
    alternates["x-default"] = this.generateCanonicalURL(
      pageType,
      this.defaultLocale,
    );

    return alternates as Record<PublicSeoLocale | "x-default", string>;
  }

  /**
   * 生成hreflang链接数组
   */
  generateHreflangLinks(pageType: PageType): HreflangLink[] {
    const links: HreflangLink[] = [];

    this.publicLocales.forEach((locale) => {
      links.push({
        href: this.generateCanonicalURL(pageType, locale),
        hreflang: locale,
      });
    });

    // 添加x-default链接（指向默认语言）
    links.push({
      href: this.generateCanonicalURL(pageType, this.defaultLocale),
      hreflang: "x-default",
    });

    return links;
  }

  /**
   * 生成sitemap条目
   */
  generateSitemapEntry(
    pageType: PageType,
    locale: Locale,
    options: {
      changefreq?: SitemapEntry["changefreq"];
      priority?: number;
      lastmod?: string;
    } = {},
  ): SitemapEntry {
    const url = this.generateCanonicalURL(pageType, locale);
    const alternateRefs = this.generateHreflangLinks(pageType);

    return {
      loc: url,
      changefreq:
        options.changefreq || SEO_CONSTANTS.URL_GENERATION.DEFAULT_CHANGEFREQ,
      priority:
        options.priority || SEO_CONSTANTS.URL_GENERATION.DEFAULT_PAGE_PRIORITY,
      lastmod: options.lastmod || new Date().toISOString(),
      alternateRefs,
    };
  }

  /**
   * 生成所有页面的sitemap条目
   */
  generateAllSitemapEntries(): SitemapEntry[] {
    const entries: SitemapEntry[] = [];

    // 为每个页面类型和语言生成条目
    Object.keys(PATHS_CONFIG).forEach((pageType) => {
      this.locales.forEach((locale) => {
        const entry = this.generateSitemapEntry(pageType as PageType, locale, {
          changefreq:
            pageType === "home"
              ? SEO_CONSTANTS.URL_GENERATION.HOME_CHANGEFREQ
              : SEO_CONSTANTS.URL_GENERATION.DEFAULT_CHANGEFREQ,
          priority:
            pageType === "home"
              ? SEO_CONSTANTS.URL_GENERATION.HOME_PAGE_PRIORITY
              : SEO_CONSTANTS.URL_GENERATION.DEFAULT_PAGE_PRIORITY,
        });
        entries.push(entry);
      });
    });

    return entries;
  }

  /**
   * 根据路径反向生成页面信息
   */
  parseURLToPageInfo(url: string): {
    pageType: PageType | null;
    locale: Locale;
    isValid: boolean;
  } {
    // 移除协议和域名
    let path = url.replace(/^https?:\/\/[^/]+/, "");

    // 移除查询参数和锚点
    const pathWithoutQuery = path.split("?")[0] || "";
    path = pathWithoutQuery.split("#")[0] || "";

    // 检测语言
    let locale: Locale = this.defaultLocale;
    let cleanPath = path;

    // 检查是否有语言前缀
    const localeMatch = path.match(/^\/([a-z]{2})(?=\/|$)/);
    if (localeMatch && this.locales.includes(localeMatch[1] as Locale)) {
      locale = localeMatch[1] as Locale;
      cleanPath = path.replace(/^\/[a-z]{2}/, "") || "/";
    }

    // 查找页面类型
    let pageType: PageType | null = null;

    if (cleanPath === "/" || cleanPath === "") {
      pageType = "home";
    } else {
      // 查找匹配的页面类型
      for (const [type, paths] of Object.entries(PATHS_CONFIG)) {
        if (
          Object.prototype.hasOwnProperty.call(paths, locale) &&
          paths[locale] === cleanPath
        ) {
          pageType = type as PageType;
          break;
        }
      }
    }

    return {
      pageType,
      locale,
      isValid: pageType !== null,
    };
  }

  /**
   * 验证URL是否有效
   */
  isValidURL(url: string): boolean {
    const { isValid } = this.parseURLToPageInfo(url);
    return isValid;
  }

  /**
   * 获取基础URL
   */
  getBaseURL(): string {
    return this.baseUrl;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLocales(): readonly Locale[] {
    return this.locales;
  }

  /**
   * 获取默认语言
   */
  getDefaultLocale(): Locale {
    return this.defaultLocale;
  }
}

// 导出单例实例
export const urlGenerator = new URLGenerator();

// 导出便捷函数
export const generatePageURL = urlGenerator.generatePageURL.bind(urlGenerator);
export const generateCanonicalURL =
  urlGenerator.generateCanonicalURL.bind(urlGenerator);
export const generateLanguageAlternates =
  urlGenerator.generateLanguageAlternates.bind(urlGenerator);
/**
 * @public SEO helper for downstream sitemap and hreflang customization.
 */
export const generateHreflangLinks =
  urlGenerator.generateHreflangLinks.bind(urlGenerator);
/**
 * @public SEO helper for downstream sitemap customization.
 */
export const generateSitemapEntry =
  urlGenerator.generateSitemapEntry.bind(urlGenerator);
/**
 * @public SEO helper for downstream sitemap customization.
 */
export const generateAllSitemapEntries =
  urlGenerator.generateAllSitemapEntries.bind(urlGenerator);
/**
 * @public Routing helper for downstream URL parsing customization.
 */
export const parseURLToPageInfo =
  urlGenerator.parseURLToPageInfo.bind(urlGenerator);
export const isValidURL = urlGenerator.isValidURL.bind(urlGenerator);

// 类型已在上面导出
