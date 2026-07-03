import { describe, expect, it } from "vitest";
import {
  getAllMarketSlugs,
  getFamiliesForMarket,
  getMarketBySlug,
  PRODUCT_CATALOG,
} from "@/constants/product-catalog";
import { SINGLE_SITE_PRODUCT_CATALOG } from "@/config/single-site";

describe("product-catalog wrapper", () => {
  it("uses the single-site catalog as runtime truth during cutover", () => {
    expect(PRODUCT_CATALOG).toBe(SINGLE_SITE_PRODUCT_CATALOG);
  });

  it("keeps market lookups aligned with the single-site catalog", () => {
    expect(getMarketBySlug("north-america")?.standardLabel).toBe(
      "Example Standard A",
    );
    expect(getAllMarketSlugs()).toContain("specialty-product-systems");
    expect(
      getFamiliesForMarket("north-america").map((family) => family.slug),
    ).toContain("sample-product-shapes");
  });
});
