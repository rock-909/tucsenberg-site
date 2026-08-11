import type { ProductCatalog } from "@/config/site-types";
import {
  TUCSENBERG_PRODUCT_PAGES,
  toTucsenbergProductMarket,
  type TucsenbergProductPageSlug,
} from "@/constants/tucsenberg-product-pages";

export type ProductMarketSlug = TucsenbergProductPageSlug;

export const singleSiteProductCatalog = {
  markets: Object.values(TUCSENBERG_PRODUCT_PAGES).map(
    toTucsenbergProductMarket,
  ),
} satisfies ProductCatalog;
