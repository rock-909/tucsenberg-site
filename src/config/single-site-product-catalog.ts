import type { ProductCatalog } from "@/config/site-types";
import {
  TUCSENBERG_PRODUCT_PAGES,
  type TucsenbergProductPageSlug,
} from "@/constants/tucsenberg-product-pages";

export type ProductMarketSlug = TucsenbergProductPageSlug;

export const singleSiteProductCatalog = {
  markets: Object.values(TUCSENBERG_PRODUCT_PAGES).map((page) => ({
    slug: page.slug,
    label: page.catalog.label,
    standardLabel: page.catalog.standardLabel,
    sizeSystem: page.catalog.sizeSystem,
    standardIds: page.catalog.standardIds,
  })),
} satisfies ProductCatalog;
