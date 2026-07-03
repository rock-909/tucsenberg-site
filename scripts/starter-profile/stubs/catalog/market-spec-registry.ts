import type { MarketSpecs } from "@/constants/product-specs/types";

export const MARKET_SPECS_BY_SLUG = Object.freeze(
  {} as const satisfies Record<string, MarketSpecs>,
);

export type MarketSpecSlug = keyof typeof MARKET_SPECS_BY_SLUG;

export function getMarketSpecsBySlug(
  _marketSlug: string,
): MarketSpecs | undefined {
  return undefined;
}

export function getMarketSpecEntries(): ReadonlyArray<
  readonly [MarketSpecSlug, MarketSpecs]
> {
  return [];
}
