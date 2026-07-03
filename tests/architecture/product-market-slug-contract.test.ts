import { describe, expect, it } from "vitest";
import { singleSiteProductCatalog as PRODUCT_CATALOG } from "@/config/single-site-product-catalog";
import {
  getMarketSpecsBySlug,
  MARKET_SPECS_BY_SLUG,
} from "@/constants/product-specs/market-spec-registry";
import enCriticalMessages from "@messages/en/critical.json";

function sorted(values: readonly string[]): string[] {
  return values.toSorted();
}

function getCatalogFamilySlugs(marketSlug: string): string[] {
  const familySlugs: string[] = [];

  for (const family of PRODUCT_CATALOG.families) {
    if (family.marketSlug === marketSlug) {
      familySlugs.push(family.slug);
    }
  }

  return familySlugs;
}

function getMessageValue(
  messages: unknown,
  pathSegments: readonly string[],
): unknown {
  let current: unknown = messages;

  for (const segment of pathSegments) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function expectNonEmptyMessage(
  messages: unknown,
  pathSegments: readonly string[],
  label: string,
): void {
  const value = getMessageValue(messages, pathSegments);

  expect(
    typeof value === "string" && value.trim().length > 0,
    `${label}: ${pathSegments.join(".")}`,
  ).toBe(true);
}

describe("product market slug contract", () => {
  it("keeps catalog market slugs equal to market spec registry keys", () => {
    const catalogMarketSlugs = PRODUCT_CATALOG.markets.map(
      (market) => market.slug,
    );
    const specRegistrySlugs = Object.keys(MARKET_SPECS_BY_SLUG);

    expect(sorted(catalogMarketSlugs)).toEqual(sorted(specRegistrySlugs));
  });

  it("keeps every catalog market labeled in English critical messages", () => {
    for (const market of PRODUCT_CATALOG.markets) {
      expectNonEmptyMessage(
        enCriticalMessages,
        ["catalog", "markets", market.slug, "label"],
        `missing English market label for ${market.slug}`,
      );
      expectNonEmptyMessage(
        enCriticalMessages,
        ["catalog", "markets", market.slug, "description"],
        `missing English market description for ${market.slug}`,
      );
    }
  });

  it("keeps each market family slug aligned with the matching market specs", () => {
    for (const market of PRODUCT_CATALOG.markets) {
      const catalogFamilySlugs = getCatalogFamilySlugs(market.slug);
      const marketSpecs = getMarketSpecsBySlug(market.slug);
      expect(marketSpecs).toBeDefined();
      const specFamilySlugs =
        marketSpecs?.families.map((family) => family.slug) ?? [];

      expect(
        sorted(catalogFamilySlugs),
        `catalog families must match market.familySlugs for ${market.slug}`,
      ).toEqual(sorted(market.familySlugs));
      expect(
        sorted(catalogFamilySlugs),
        `catalog families must match specs for ${market.slug}`,
      ).toEqual(sorted(specFamilySlugs));
    }
  });

  it("keeps every market family labeled in English critical messages", () => {
    for (const family of PRODUCT_CATALOG.families) {
      const basePath = ["catalog", "families", family.marketSlug, family.slug];
      const labelPath = [...basePath, "label"];
      const descriptionPath = [...basePath, "description"];

      expectNonEmptyMessage(
        enCriticalMessages,
        labelPath,
        `missing English family label for ${family.marketSlug}/${family.slug}`,
      );
      expectNonEmptyMessage(
        enCriticalMessages,
        descriptionPath,
        `missing English family description for ${family.marketSlug}/${family.slug}`,
      );
    }
  });
});
