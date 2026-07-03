import { AUSTRALIA_NZ_SPECS } from "@/constants/product-specs/australia-new-zealand";
import { EUROPE_SPECS } from "@/constants/product-specs/europe";
import { MEXICO_SPECS } from "@/constants/product-specs/mexico";
import { NORTH_AMERICA_SPECS } from "@/constants/product-specs/north-america";
import { SPECIALTY_PRODUCT_SPECS } from "@/constants/product-specs/specialty-product-systems";
import type { MarketSpecs } from "@/constants/product-specs/types";
import type { ProductMarketSlug } from "@/config/single-site-product-catalog";

export const MARKET_SPECS_BY_SLUG = Object.freeze({
  "north-america": NORTH_AMERICA_SPECS,
  "australia-new-zealand": AUSTRALIA_NZ_SPECS,
  mexico: MEXICO_SPECS,
  europe: EUROPE_SPECS,
  "specialty-product-systems": SPECIALTY_PRODUCT_SPECS,
} as const satisfies Record<ProductMarketSlug, MarketSpecs>);

export type MarketSpecSlug = keyof typeof MARKET_SPECS_BY_SLUG;

export function getMarketSpecsBySlug(
  marketSlug: string,
): MarketSpecs | undefined {
  if (!Object.hasOwn(MARKET_SPECS_BY_SLUG, marketSlug)) {
    return undefined;
  }

  return MARKET_SPECS_BY_SLUG[marketSlug as MarketSpecSlug];
}

export function getMarketSpecEntries(): ReadonlyArray<
  readonly [MarketSpecSlug, MarketSpecs]
> {
  return Object.entries(MARKET_SPECS_BY_SLUG) as Array<
    [MarketSpecSlug, MarketSpecs]
  >;
}
