import type { MarketSpecs } from "@/constants/product-specs/types";
import {
  ABSORBENT_FLOOD_BAG_SPECS,
  ABS_FLOOD_BARRIER_SPECS,
  ALUMINUM_FLOOD_GATE_SPECS,
  FLOOD_TUBE_DAM_SPECS,
  FRP_FLOOD_BARRIER_SPECS,
} from "@/constants/product-specs/tucsenberg-product-lines";
import type { ProductMarketSlug } from "@/config/single-site-product-catalog";

export const MARKET_SPECS_BY_SLUG = Object.freeze({
  "abs-flood-barriers": ABS_FLOOD_BARRIER_SPECS,
  "aluminum-flood-gates": ALUMINUM_FLOOD_GATE_SPECS,
  "absorbent-flood-bags": ABSORBENT_FLOOD_BAG_SPECS,
  "flood-tube-dams": FLOOD_TUBE_DAM_SPECS,
  "frp-flood-barriers": FRP_FLOOD_BARRIER_SPECS,
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
