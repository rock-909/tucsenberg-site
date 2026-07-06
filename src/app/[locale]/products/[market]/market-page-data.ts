import {
  getFamiliesForMarket,
  getMarketBySlug,
  type ProductFamilyDefinition,
} from "@/constants/product-catalog";

export interface MarketPageData {
  market: NonNullable<ReturnType<typeof getMarketBySlug>>;
  families: readonly ProductFamilyDefinition[];
}

export function getMarketPageData(marketSlug: string): MarketPageData {
  const market = getMarketBySlug(marketSlug);
  if (!market) {
    throw new Error(`Unknown market slug: ${marketSlug}`);
  }

  const families = getFamiliesForMarket(marketSlug);

  return {
    market,
    families,
  };
}
