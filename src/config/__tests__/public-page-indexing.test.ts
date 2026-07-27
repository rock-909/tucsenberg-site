import { describe, expect, it } from "vitest";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import { shouldIndexPublicPage } from "@/config/single-site-seo";
import { getAllMarketSlugs } from "@/constants/product-catalog";

describe("public page indexing by starter profile", () => {
  it("indexes Tucsenberg catalog static pages by default", () => {
    expect(
      shouldIndexPublicPage("products", getCanonicalPath("products")),
    ).toBe(true);
    expect(shouldIndexPublicPage("about", getCanonicalPath("about"))).toBe(
      true,
    );
    expect(
      shouldIndexPublicPage("oemWholesale", getCanonicalPath("oemWholesale")),
    ).toBe(true);
    expect(
      shouldIndexPublicPage(
        "materialsGuide",
        getCanonicalPath("materialsGuide"),
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPage(
        "specificationsGuide",
        getCanonicalPath("specificationsGuide"),
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPage("requestQuote", getCanonicalPath("requestQuote")),
    ).toBe(true);
  });

  it("indexes product market pages under the default catalog profile", () => {
    const [marketSlug] = getAllMarketSlugs();

    expect(marketSlug).toBeDefined();
    expect(
      shouldIndexPublicPage("products", getProductMarketPath(marketSlug ?? "")),
    ).toBe(true);
  });

  // Fails closed: anything not on the public allow-list stays out of the index,
  // whether it is a retired path or one that never existed.
  it("does not index page types outside the public allow-list", () => {
    expect(shouldIndexPublicPage("blog", "/blog")).toBe(false);
    expect(shouldIndexPublicPage("capabilities", "/capabilities")).toBe(false);
    expect(shouldIndexPublicPage("never-existed", "/never-existed")).toBe(
      false,
    );
  });
});
