import { describe, expect, it } from "vitest";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";
import {
  SINGLE_SITE_ABOUT_PAGE_EXPRESSION,
  SINGLE_SITE_ABOUT_STATS_ITEMS,
  SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS,
  SINGLE_SITE_HOME_FINAL_TRUST_ITEMS,
  SINGLE_SITE_HOME_HERO_PROOF_ITEMS,
  SINGLE_SITE_HOME_LINK_TARGETS,
  SINGLE_SITE_HOME_SCENARIO_ITEMS,
  SINGLE_SITE_HOME_SECTION_ORDER,
  SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION,
  SINGLE_SITE_RESOURCES_PAGE_EXPRESSION,
} from "@/config/single-site-page-expression";

describe("single-site-page-expression", () => {
  it("keeps the homepage section order aligned with the active page runtime", () => {
    expect(SINGLE_SITE_HOME_SECTION_ORDER).toEqual([
      "hero",
      "problems",
      "howToChoose",
      "startPath",
      "answer",
      "verify",
      "faq",
      "finalCta",
    ]);
    expect(SINGLE_SITE_HOME_LINK_TARGETS).toEqual({
      contact: "/contact",
      oemWholesale: "/oem-wholesale",
      products: "/products",
      requestQuote: "/request-quote",
      primaryCta: "/request-quote",
      secondaryCta: "/oem-wholesale",
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
  });

  it("keeps product page grouping aligned with the catalog", () => {
    const allMarketSlugs = PRODUCT_CATALOG.markets.map((market) => market.slug);
    const groupedMarketSlugs = [
      ...SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.standardMarketSlugs,
      SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.specialtyMarketSlug,
    ].filter(Boolean);

    expect(groupedMarketSlugs.sort()).toEqual(allMarketSlugs.sort());
    expect(SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.marketLanding.ctaHref).toBe(
      "/contact",
    );
    expect(SINGLE_SITE_ABOUT_PAGE_EXPRESSION.ctaHref).toBe("/products");
  });

  it("keeps resources page display order and CTA targets centralized", () => {
    expect(SINGLE_SITE_RESOURCES_PAGE_EXPRESSION).toEqual({
      cardKeys: ["brochure", "productSheet", "buyerGuide"],
      pathwayStepKeys: ["learn", "compare", "ask"],
      replacementItemKeys: ["files", "proof", "owner"],
      cardHrefs: {
        brochure: "/contact",
        productSheet: "/products",
        buyerGuide: "/contact",
      },
      ctaHref: "/contact",
    });
  });
});
