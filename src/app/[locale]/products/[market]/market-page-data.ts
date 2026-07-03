import {
  getFamiliesForMarket,
  getMarketBySlug,
  type ProductFamilyDefinition,
} from "@/constants/product-catalog";
import { getMarketSpecsBySlug } from "@/constants/product-specs/market-spec-registry";
import type { MarketSpecs } from "@/constants/product-specs/types";

export interface MarketPageData {
  market: NonNullable<ReturnType<typeof getMarketBySlug>>;
  families: readonly ProductFamilyDefinition[];
  marketSpecs: MarketSpecs | undefined;
  familySpecsMap: Map<string, MarketSpecs["families"][number]>;
}

export function getMarketPageData(marketSlug: string): MarketPageData {
  const market = getMarketBySlug(marketSlug);
  if (!market) {
    throw new Error(`Unknown market slug: ${marketSlug}`);
  }

  const families = getFamiliesForMarket(marketSlug);
  const marketSpecs = getMarketSpecsBySlug(marketSlug);
  const familySpecsMap = new Map(
    marketSpecs?.families.map((familySpecs) => [familySpecs.slug, familySpecs]),
  );

  return {
    market,
    families,
    marketSpecs,
    familySpecsMap,
  };
}
