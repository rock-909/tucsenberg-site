import type { TucsenbergProductPage } from "@/constants/tucsenberg-product-page-types";
import type { MarketDefinition } from "@/config/site-types";
import { ABS_FLOOD_BARRIERS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-abs-flood-barriers";
import { ABSORBENT_FLOOD_BAGS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-absorbent-flood-bags";
import { ALUMINUM_FLOOD_GATES_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-aluminum-flood-gates";
import { FLOOD_TUBE_DAMS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-flood-tube-dams";
import { FRP_FLOOD_BARRIERS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-frp-flood-barriers";

export type {
  TucsenbergProductCta,
  TucsenbergProductDiagram,
  TucsenbergProductDiagramKind,
  TucsenbergProductFaq,
  TucsenbergProductImage,
  TucsenbergProductPage,
  TucsenbergProductProseSection,
  TucsenbergProductSection,
  TucsenbergProductTable,
  TucsenbergProductTableSection,
} from "@/constants/tucsenberg-product-page-types";

function defineProductPages<
  const Pages extends Record<string, TucsenbergProductPage>,
>(
  pages: Pages & {
    readonly [Slug in keyof Pages]: TucsenbergProductPage<
      Extract<Slug, string>
    >;
  },
): Pages {
  return pages;
}

export const TUCSENBERG_PRODUCT_PAGES = defineProductPages({
  "abs-flood-barriers": ABS_FLOOD_BARRIERS_PRODUCT_PAGE,
  "aluminum-flood-gates": ALUMINUM_FLOOD_GATES_PRODUCT_PAGE,
  "absorbent-flood-bags": ABSORBENT_FLOOD_BAGS_PRODUCT_PAGE,
  "flood-tube-dams": FLOOD_TUBE_DAMS_PRODUCT_PAGE,
  "frp-flood-barriers": FRP_FLOOD_BARRIERS_PRODUCT_PAGE,
});

export type TucsenbergProductPageSlug = keyof typeof TUCSENBERG_PRODUCT_PAGES;
export type TucsenbergProductPageDefinition =
  TucsenbergProductPage<TucsenbergProductPageSlug> &
    (typeof TUCSENBERG_PRODUCT_PAGES)[TucsenbergProductPageSlug];

type TucsenbergMarketDefinition<ProductSlug extends string> = Omit<
  MarketDefinition,
  "slug"
> & { slug: ProductSlug };

export function toTucsenbergProductMarket<ProductSlug extends string>(
  page: TucsenbergProductPage<ProductSlug>,
): TucsenbergMarketDefinition<ProductSlug> {
  return {
    slug: page.slug,
    label: page.catalog.label,
    standardLabel: page.catalog.standardLabel,
    sizeSystem: page.catalog.sizeSystem,
    standardIds: page.catalog.standardIds,
  };
}

export function getTucsenbergProductPage(
  slug: string,
): TucsenbergProductPageDefinition | undefined {
  return Object.hasOwn(TUCSENBERG_PRODUCT_PAGES, slug)
    ? TUCSENBERG_PRODUCT_PAGES[slug as TucsenbergProductPageSlug]
    : undefined;
}
