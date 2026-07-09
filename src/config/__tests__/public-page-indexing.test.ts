import { describe, expect, it } from "vitest";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import { shouldIndexPublicPageForProfile } from "@/config/single-site-seo";
import { getAllMarketSlugs } from "@/constants/product-catalog";

describe("public page indexing by starter profile", () => {
  it("indexes Tucsenberg catalog static pages by default", () => {
    expect(
      shouldIndexPublicPageForProfile("products", getCanonicalPath("products")),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile("about", getCanonicalPath("about")),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "oemWholesale",
        getCanonicalPath("oemWholesale"),
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "materialsGuide",
        getCanonicalPath("materialsGuide"),
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "specificationsGuide",
        getCanonicalPath("specificationsGuide"),
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "requestQuote",
        getCanonicalPath("requestQuote"),
      ),
    ).toBe(true);
  });

  it("indexes product market pages under the default catalog profile", () => {
    const [marketSlug] = getAllMarketSlugs();

    expect(marketSlug).toBeDefined();
    expect(
      shouldIndexPublicPageForProfile(
        "products",
        getProductMarketPath(marketSlug ?? ""),
      ),
    ).toBe(true);
  });

  it("does not index retired blog or demo paths", () => {
    expect(shouldIndexPublicPageForProfile("blog", "/blog")).toBe(false);
    expect(
      shouldIndexPublicPageForProfile("capabilities", "/capabilities"),
    ).toBe(false);
  });
});
