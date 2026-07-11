/**
 * SEO URL 生成
 *
 * 仅保留 SEO 元数据实际消费的两个函数：规范化 URL 与语言备用映射。
 */

import {
  getLocalizedPath,
  LOCALES_CONFIG,
  SITE_CONFIG,
  type Locale,
  type PageType,
} from "@/config/paths";

/**
 * 生成规范化 URL（含语言前缀的绝对地址，用于 SEO canonical）。
 */
export function generateCanonicalURL(
  pageType: PageType,
  locale: Locale,
): string {
  const localizedPath = getLocalizedPath(pageType, locale);

  let path = "";
  if (LOCALES_CONFIG.localePrefix !== "never") {
    path += `/${locale}`;
  }
  if (localizedPath !== "/" || path === "") {
    path += localizedPath;
  }

  const host = SITE_CONFIG.baseUrl.replace(/^https?:\/\//, "");
  return `https://${host}${path}`;
}

/**
 * 生成所有语言版本的 URL 映射（含 x-default，指向默认语言）。
 */
export function generateLanguageAlternates(
  pageType: PageType,
): Record<Locale | "x-default", string> {
  const alternates: Record<string, string> = {};

  for (const locale of LOCALES_CONFIG.locales) {
    alternates[locale] = generateCanonicalURL(pageType, locale);
  }
  alternates["x-default"] = generateCanonicalURL(
    pageType,
    LOCALES_CONFIG.defaultLocale,
  );

  return alternates as Record<Locale | "x-default", string>;
}
