import { describe, expect, it } from "vitest";
import {
  getAllMarketSlugs,
  getFamiliesForMarket,
} from "@/constants/product-catalog";
import {
  getMarketSpecEntries,
  getMarketSpecsBySlug,
  MARKET_SPECS_BY_SLUG,
} from "@/constants/product-specs/market-spec-registry";

describe("market spec registry", () => {
  it("covers every catalog market exactly once", () => {
    const catalogSlugs = [...getAllMarketSlugs()].sort();
    const registrySlugs = Object.keys(MARKET_SPECS_BY_SLUG).sort();

    expect(registrySlugs).toEqual(catalogSlugs);
  });

  it("exposes stable entries for parity checks", () => {
    const entries = getMarketSpecEntries();
    const entrySlugs = entries.map(([marketSlug]) => marketSlug).sort();

    expect(entrySlugs).toEqual([...getAllMarketSlugs()].sort());
    for (const [, specs] of entries) {
      expect(specs.families.length).toBeGreaterThan(0);
      expect(Object.keys(specs.technical).length).toBeGreaterThan(0);
    }
  });

  it("keeps catalog family slugs aligned with market spec families per market", () => {
    for (const marketSlug of getAllMarketSlugs()) {
      const catalogFamilySlugs = getFamiliesForMarket(marketSlug)
        .map((family) => family.slug)
        .sort();
      const specFamilySlugs = (getMarketSpecsBySlug(marketSlug)?.families ?? [])
        .map((family) => family.slug)
        .sort();

      expect(specFamilySlugs, marketSlug).toEqual(catalogFamilySlugs);
    }
  });

  it("returns undefined for unknown and prototype-like market slugs", () => {
    expect(getMarketSpecsBySlug("unknown-market")).toBeUndefined();
    expect(getMarketSpecsBySlug("__proto__")).toBeUndefined();
    expect(getMarketSpecsBySlug("constructor")).toBeUndefined();
  });

  it("keeps live market spec families off the sample product illustration", () => {
    for (const [marketSlug, specs] of getMarketSpecEntries()) {
      for (const family of specs.families) {
        expect(family.images, `${marketSlug}/${family.slug}`).not.toContain(
          "/images/products/sample-product.svg",
        );
      }
    }
  });
});
