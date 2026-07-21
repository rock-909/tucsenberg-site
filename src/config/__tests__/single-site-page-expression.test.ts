import { describe, expect, it } from "vitest";
import b2bLeadMessages from "../../../messages/profiles/b2b-lead/en/messages.json";
import catalogMessages from "../../../messages/profiles/catalog/en/messages.json";
import { ABS_FLOOD_BARRIERS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-abs-flood-barriers";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";
import { getTucsenbergProductPage } from "@/constants/tucsenberg-product-pages";
import {
  SINGLE_SITE_ABOUT_PAGE_EXPRESSION,
  SINGLE_SITE_ABOUT_STATS_ITEMS,
  SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS,
  SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS,
  SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS,
  SINGLE_SITE_HOME_HERO_PROOF_ITEMS,
  SINGLE_SITE_HOME_LINK_TARGETS,
  SINGLE_SITE_HOME_PRODUCT_LINES,
  SINGLE_SITE_HOME_SCENARIO_ITEMS,
  SINGLE_SITE_HOME_SECTION_ORDER,
  SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION,
  SINGLE_SITE_RESOURCES_PAGE_EXPRESSION,
} from "@/config/single-site-page-expression";

describe("single-site-page-expression", () => {
  it("keeps Aluminum homepage capabilities separate from ABS configurations", () => {
    const aluminumDescription =
      catalogMessages.home.productLines.items.aluminumFloodGates.description;
    const absProductPayload = JSON.stringify(ABS_FLOOD_BARRIERS_PRODUCT_PAGE);

    expect(aluminumDescription).toBe(
      "Demountable stacked-plank systems for doors, garages and loading docks, with wall channels or removable posts custom-cut to your opening schedule.",
    );
    expect(aluminumDescription).not.toMatch(/curv|gable[\s-]?end/iu);
    expect(absProductPayload).toMatch(/curve/iu);
    expect(absProductPayload).toMatch(/gable[\s-]?end/iu);
  });

  it("does not present the RFQ warranty as a catalog-wide 3-year warranty", () => {
    expect(b2bLeadMessages.requestQuote.page.confidenceWarranty).toBe(
      "Written product-specific warranty terms",
    );
  });

  it("keeps the homepage section order aligned with the active page runtime", () => {
    expect(SINGLE_SITE_HOME_SECTION_ORDER).toEqual([
      "hero",
      "productLines",
      "howToChoose",
      "buyingProcess",
      "buyerSegments",
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

  it("keeps homepage semantic tuples aligned with the live page runtime", () => {
    expect(SINGLE_SITE_HOME_PRODUCT_LINES).toEqual([
      {
        key: "absFloodBarriers",
        slug: "abs-flood-barriers",
      },
      {
        key: "aluminumFloodGates",
        slug: "aluminum-flood-gates",
      },
      {
        key: "absorbentFloodBags",
        slug: "absorbent-flood-bags",
      },
      {
        key: "floodTubeDams",
        slug: "flood-tube-dams",
      },
      {
        key: "frpFloodBarriers",
        slug: "frp-flood-barriers",
        hasBadge: true,
      },
    ]);

    for (const productLine of SINGLE_SITE_HOME_PRODUCT_LINES) {
      expect(getTucsenbergProductPage(productLine.slug)?.diagram).toBeDefined();
    }

    expect(SINGLE_SITE_HOME_BUYER_SEGMENT_KEYS).toEqual([
      "dealersDistributors",
      "importersBrands",
      "contractorsProjects",
      "smallBusinessBuyers",
    ]);

    expect(SINGLE_SITE_HOME_BUYING_PROCESS_STEP_KEYS).toEqual([
      "sendRfq",
      "quoteResponse",
      "paidSample",
      "productionQc",
      "shipment",
    ]);

    expect(SINGLE_SITE_HOME_HERO_PROOF_ITEMS).toEqual([
      "quoteSla",
      "warranty",
      "factoryPool",
      "oem",
    ]);
  });

  it("keeps homepage and about display item order explicit", () => {
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

    expect(SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.standardMarketSlugs).toEqual(
      allMarketSlugs,
    );
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
