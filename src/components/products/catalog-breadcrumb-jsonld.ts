import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_CONFIG } from "@/config/paths";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import type { CatalogBreadcrumbProps } from "@/components/products/catalog-breadcrumb-types";
import { buildBreadcrumbListSchema } from "@/lib/structured-data-generators";

export async function buildCatalogBreadcrumbJsonLd({
  market,
  marketLabel,
}: CatalogBreadcrumbProps) {
  const { baseUrl } = SITE_CONFIG;
  const tBreadcrumb = await getTranslations("catalog.breadcrumb");

  // JSON-LD URLs use default locale for canonical representation.
  const canonicalBase = `${baseUrl}/${routing.defaultLocale}`;
  const productsPath = getCanonicalPath("products");

  const entries: Array<{ name: string; url: string }> = [
    { name: tBreadcrumb("home"), url: canonicalBase },
    { name: tBreadcrumb("products"), url: `${canonicalBase}${productsPath}` },
  ];

  if (market) {
    entries.push({
      name: marketLabel || market.label,
      url: `${canonicalBase}${getProductMarketPath(market.slug)}`,
    });
  }

  return buildBreadcrumbListSchema(entries);
}
