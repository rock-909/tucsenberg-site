import { buildCatalogBreadcrumbJsonLd } from "@/components/products/catalog-breadcrumb-jsonld";
import { SITE_CONFIG } from "@/config/paths";
import type { MarketDefinition } from "@/constants/product-catalog";
import type {
  TucsenbergProductPage,
  TucsenbergProductSection,
} from "@/constants/tucsenberg-product-pages";
import { generateProductGroupData } from "@/lib/structured-data-generators";

function getJsonLdProductImage(productPage: TucsenbergProductPage) {
  if (productPage.image.status !== "real") {
    return undefined;
  }

  if (!isSafeRootRelativeImageSrc(productPage.image.src)) {
    return undefined;
  }

  return new URL(productPage.image.src, SITE_CONFIG.baseUrl).toString();
}

function isSafeRootRelativeImageSrc(src: string): boolean {
  const pathname = src.split(/[?#]/u)[0] ?? "";

  return /^\/(?!\/)/u.test(src) && !pathname.split("/").includes("..");
}

function getSectionTableSummary(section: TucsenbergProductSection) {
  if (!section.table) {
    return undefined;
  }

  const rows = section.table.rows.map((row) => row.join(" | ")).join("; ");
  return `${section.title}: ${rows}`;
}

function getProductJsonLdDescription(productPage: TucsenbergProductPage) {
  return [
    productPage.subtitle,
    productPage.lead,
    ...productPage.sections
      .map((section) => getSectionTableSummary(section))
      .filter((summary): summary is string => Boolean(summary)),
  ].join(" ");
}

export async function buildMarketPageJsonLdData({
  market,
  marketUrl,
  productPage,
}: {
  market: MarketDefinition;
  marketUrl: string;
  productPage: TucsenbergProductPage;
}): Promise<unknown[]> {
  const image = getJsonLdProductImage(productPage);
  const productGroupSchema = generateProductGroupData({
    name: productPage.title,
    description: productPage.lead,
    url: marketUrl,
    brand: SITE_CONFIG.name,
    products: [
      {
        name: productPage.title,
        description: getProductJsonLdDescription(productPage),
        ...(image ? { image } : {}),
        url: marketUrl,
      },
    ],
  });
  const breadcrumbSchema = await buildCatalogBreadcrumbJsonLd({
    market,
    marketLabel: productPage.title,
  });

  return [productGroupSchema, breadcrumbSchema];
}
