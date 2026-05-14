import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { JsonLdScript } from "@/components/seo";
import { SITE_CONFIG } from "@/config/paths";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import type { MarketDefinition } from "@/constants/product-catalog";
import { buildBreadcrumbListSchema } from "@/lib/structured-data-generators";
import { CatalogBreadcrumbView } from "@/components/products/catalog-breadcrumb-view";

interface CatalogBreadcrumbProps {
  market?: MarketDefinition;
  marketLabel?: string;
  renderJsonLd?: boolean;
}

export async function buildCatalogBreadcrumbJsonLd({
  market,
  marketLabel,
}: CatalogBreadcrumbProps) {
  const { baseUrl } = SITE_CONFIG;
  const tBreadcrumb = await getTranslations("catalog.breadcrumb");

  // JSON-LD URLs use default locale for canonical representation
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

export async function CatalogBreadcrumb({
  market,
  marketLabel,
  renderJsonLd = true,
}: CatalogBreadcrumbProps) {
  const tBreadcrumb = await getTranslations("catalog.breadcrumb");
  const productsPath = getCanonicalPath("products");

  return (
    <>
      <CatalogBreadcrumbView
        homeLabel={tBreadcrumb("home")}
        productsLabel={tBreadcrumb("products")}
        productsHref={productsPath}
        {...(market ? { marketLabel: marketLabel || market.label } : {})}
      />

      {renderJsonLd ? (
        <JsonLdScript
          data={await buildCatalogBreadcrumbJsonLd(
            market ? { market, ...(marketLabel ? { marketLabel } : {}) } : {},
          )}
        />
      ) : null}
    </>
  );
}
