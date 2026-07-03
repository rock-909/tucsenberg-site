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
    expect(
      getFamiliesForMarket("abs-flood-barriers").map((family) => family.slug),
    ).toEqual(["abs-boxwall"]);
  });
});
