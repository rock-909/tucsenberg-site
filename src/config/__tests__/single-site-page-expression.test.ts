import { describe, expect, it } from "vitest";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";
import {
  SINGLE_SITE_ABOUT_PAGE_EXPRESSION,
  SINGLE_SITE_ABOUT_STATS_ITEMS,
  SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS,
  SINGLE_SITE_HOME_LINK_TARGETS,
  SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION,
  SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION,
} from "@/config/single-site-page-expression";

describe("single-site-page-expression", () => {
  it("keeps shared home link targets explicit", () => {
    expect(SINGLE_SITE_HOME_LINK_TARGETS).toEqual({
      contact: "#coming-soon",
      products: "#coming-soon",
    });
  });

  it("keeps about display item order explicit", () => {
    expect(SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS).toEqual([
      "quality",
      "innovation",
      "service",
      "integrity",
    ]);
    expect(SINGLE_SITE_ABOUT_STATS_ITEMS).toEqual([
      {
        key: "years",
        valueSource: "yearsInBusiness",
        labelKey: "yearsExperience",
        suffix: "+",
      },
      {
        key: "countries",
        valueSource: "exportCountries",
        labelKey: "countriesServed",
        suffix: "+",
      },
      {
        key: "team",
        valueSource: "employees",
        labelKey: "happyClients",
        suffix: "+",
      },
      {
        key: "footprint",
        valueSource: "exampleFootprint",
        labelKey: "productsDelivered",
        suffix: "",
      },
    ]);
  });

  it("keeps product page grouping aligned with the catalog", () => {
    const allMarketSlugs = PRODUCT_CATALOG.markets.map((market) => market.slug);
    const groupedMarketSlugs = [
      ...SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.standardMarketSlugs,
      SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.specialtyMarketSlug,
    ];

    expect(groupedMarketSlugs.sort()).toEqual(allMarketSlugs.sort());
    expect(SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.marketLanding.ctaHref).toBe(
      "#coming-soon",
    );
    expect(SINGLE_SITE_ABOUT_PAGE_EXPRESSION.ctaHref).toBe("#coming-soon");
    expect(SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION.ctaHref).toBe(
      "#coming-soon",
    );
  });
});
