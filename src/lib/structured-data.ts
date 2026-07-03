import { getTranslations } from "next-intl/server";
import {
  generateOrganizationData,
  generateWebSiteData,
} from "@/lib/structured-data-generators";
import {
  generateLocalizedStructuredData,
  generateProductSchema,
} from "@/lib/structured-data-helpers";
import type { Locale } from "@/lib/structured-data-types";
import { type PageType } from "@/config/paths";
import { COUNT_TWO } from "@/constants";

export type { Locale } from "@/lib/structured-data-types";

export { generateLocalizedStructuredData };

/**
 * 生成JSON-LD脚本标签
 * 包含 XSS 转义处理，防止 </script> 注入攻击
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
export function generateJSONLD(structuredData: unknown): string {
  const JSON_INDENT = COUNT_TWO;
  const jsonString = JSON.stringify(structuredData, null, JSON_INDENT);
  // Escape HTML-sensitive characters and JS line separators before embedding
  // JSON-LD in a script tag so every call site shares the same hardening.
  return jsonString
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// 重新导出便捷函数
export {
  createArticleStructuredData,
  createBreadcrumbStructuredData,
  generateLocalBusinessSchema,
  generateProductSchema,
} from "@/lib/structured-data-helpers";

// 函数重载：根据页面类型返回不同长度的元组，便于测试中按索引访问
export function generateStructuredData(
  _page: "home",
  _locale: Locale,
): Promise<[Record<string, unknown>, Record<string, unknown>]>;
export function generateStructuredData(
  _page: "products",
  _locale: Locale,
  _extras: {
    product: {
      name: string;
      description: string;
      image?: string;
      price?: string | number;
      currency?: string;
      availability?: string;
      brand?: string;
      sku?: string;
    };
  },
): Promise<
  [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>]
>;
export async function generateStructuredData(
  page: PageType,
  locale: Locale,
  extras?: {
    product?: {
      name: string;
      description: string;
      image?: string;
      price?: string | number;
      currency?: string;
      availability?: string;
      brand?: string;
      sku?: string;
    };
  },
): Promise<Array<Record<string, unknown>>> {
  const t = await getTranslations({ locale, namespace: "structured-data" });
  const organization = generateOrganizationData(t, {});
  const website = generateWebSiteData(t, {});

  const base = [organization, website] as Array<Record<string, unknown>>;

  if (page === "products" && extras?.product) {
    const product = await generateProductSchema(extras.product, locale);
    return [...base, product];
  }

  return base;
}
