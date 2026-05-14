import { buildCatalogBreadcrumbJsonLd } from "@/components/products/catalog-breadcrumb";
import { SITE_CONFIG } from "@/config/paths";
import { generateProductGroupData } from "@/lib/structured-data-generators";
import type { MarketPageData } from "@/app/[locale]/products/[market]/market-page-data";

export interface MarketPageJsonLdLabels {
  marketDescription: string;
  marketLabel: string;
}

export async function buildMarketPageJsonLdData({
  data,
  labels,
  marketUrl,
  t,
}: {
  data: Pick<MarketPageData, "families" | "familySpecsMap" | "market">;
  labels: MarketPageJsonLdLabels;
  marketUrl: string;
  t: (key: string) => string;
}): Promise<unknown[]> {
  const { families, familySpecsMap, market } = data;
  const productGroupSchema = generateProductGroupData({
    name: labels.marketLabel,
    description: labels.marketDescription,
    url: marketUrl,
    brand: SITE_CONFIG.name,
    products: families.map((family) => {
      const image = familySpecsMap.get(family.slug)?.images[0];

      return {
        name: t(`families.${market.slug}.${family.slug}.label`),
        description: t(`families.${market.slug}.${family.slug}.description`),
        ...(image ? { image: `${SITE_CONFIG.baseUrl}${image}` } : {}),
        url: `${marketUrl}#${family.slug}`,
      };
    }),
  });
  const breadcrumbSchema = await buildCatalogBreadcrumbJsonLd({
    market,
    marketLabel: labels.marketLabel,
  });

  return [productGroupSchema, breadcrumbSchema];
}
