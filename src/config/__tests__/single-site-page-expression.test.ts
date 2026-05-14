import { describe, expect, it } from "vitest";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";
import {
  SINGLE_SITE_ABOUT_PAGE_EXPRESSION,
  SINGLE_SITE_ABOUT_STATS_ITEMS,
  SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS,
  SINGLE_SITE_HOME_FINAL_TRUST_ITEMS,
  SINGLE_SITE_HOME_GRID_SECTION_ORDER,
  SINGLE_SITE_HOME_HERO_PROOF_ITEMS,
  SINGLE_SITE_HOME_LINK_TARGETS,
  SINGLE_SITE_HOME_QUALITY_COMMITMENT_ITEMS,
  SINGLE_SITE_HOME_QUALITY_PROOF_STRIP_ITEMS,
  SINGLE_SITE_HOME_QUALITY_STANDARD_ITEMS,
  SINGLE_SITE_HOME_SCENARIO_ITEMS,
  SINGLE_SITE_HOME_TRAILING_SECTION_ORDER,
  SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION,
  SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION,
} from "@/config/single-site-page-expression";

describe("single-site-page-expression", () => {
  it("keeps homepage section order explicit and non-empty", () => {
    expect(SINGLE_SITE_HOME_GRID_SECTION_ORDER).toEqual([
      "hero",
      "starterBoundary",
      "chain",
      "products",
      "resources",
      "sampleCta",
      "scenarios",
      "quality",
    ]);
    expect(SINGLE_SITE_HOME_TRAILING_SECTION_ORDER).toEqual(["finalCta"]);
    expect(SINGLE_SITE_HOME_LINK_TARGETS).toEqual({
      contact: "/contact",
      products: "/products",
    });
  });

  it("keeps homepage and about display item order explicit", () => {
    expect(SINGLE_SITE_HOME_HERO_PROOF_ITEMS).toEqual([
      "est",
      "countries",
      "range",
      "production",
    ]);
    expect(SINGLE_SITE_HOME_FINAL_TRUST_ITEMS).toEqual(["countries"]);
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
    expect(SINGLE_SITE_HOME_SCENARIO_ITEMS).toEqual([
      "item1",
      "item2",
      "item3",
    ]);
    expect(SINGLE_SITE_HOME_QUALITY_COMMITMENT_ITEMS).toEqual([
      "commitment1",
      "commitment2",
      "commitment3",
      "commitment4",
      "commitment5",
    ]);
    expect(SINGLE_SITE_HOME_QUALITY_STANDARD_ITEMS).toEqual([
      "exampleA",
      "exampleB",
      "exampleC",
      "exampleD",
    ]);
    expect(SINGLE_SITE_HOME_QUALITY_PROOF_STRIP_ITEMS).toEqual([
      "iso9001",
      "standards",
      "countries",
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
      "/contact",
    );
    expect(SINGLE_SITE_ABOUT_PAGE_EXPRESSION.ctaHref).toBe("/products");
    expect(SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION.ctaHref).toBe("/contact");
  });
});
