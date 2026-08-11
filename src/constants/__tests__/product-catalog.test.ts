import { describe, expect, it } from "vitest";
import {
  getAllMarketSlugs,
  getMarketBySlug,
  isProductMarketSlug,
  PRODUCT_CATALOG,
} from "@/constants/product-catalog";
import { singleSiteProductCatalog } from "@/config/single-site-product-catalog";
import type { MarketDefinition } from "@/config/site-types";
import { TUCSENBERG_PRODUCT_PAGES } from "@/constants/tucsenberg-product-pages";

describe("product-catalog wrapper", () => {
  it("derives the lightweight catalog from product pages in page order", () => {
    const productPages = Object.values(TUCSENBERG_PRODUCT_PAGES) as readonly {
      slug: string;
      catalog: Omit<MarketDefinition, "slug"> & {
        homeMessageKey: string;
        homeBadge?: true;
      };
    }[];

    expect(singleSiteProductCatalog.markets).toEqual(
      productPages.map((page) => ({
        slug: page.slug,
        label: page.catalog.label,
        standardLabel: page.catalog.standardLabel,
        sizeSystem: page.catalog.sizeSystem,
        standardIds: page.catalog.standardIds,
      })),
    );
    expect(PRODUCT_CATALOG).toBe(singleSiteProductCatalog);
  });

  it("recognizes only current catalog slugs", () => {
    expect(isProductMarketSlug("abs-flood-barriers")).toBe(true);
    expect(isProductMarketSlug("forged-product")).toBe(false);
  });

  it("keeps market lookups aligned with the single-site catalog", () => {
    expect(getMarketBySlug("abs-flood-barriers")?.standardLabel).toBe(
      "TB-BW series",
    );
    expect(getAllMarketSlugs()).toEqual([
      "abs-flood-barriers",
      "aluminum-flood-gates",
      "absorbent-flood-bags",
      "flood-tube-dams",
      "frp-flood-barriers",
    ]);
  });
});
