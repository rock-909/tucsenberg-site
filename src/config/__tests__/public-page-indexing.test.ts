import { describe, expect, it } from "vitest";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import { shouldIndexPublicPageForProfile } from "@/config/single-site-seo";
import { getAllMarketSlugs } from "@/constants/product-catalog";

describe("public page indexing by starter profile", () => {
  it("indexes company-site static pages but not showcase-full demo pages by default", () => {
    expect(
      shouldIndexPublicPageForProfile("products", getCanonicalPath("products")),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile("blog", getCanonicalPath("blog")),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "resources",
        getCanonicalPath("resources"),
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "capabilities",
        getCanonicalPath("capabilities"),
      ),
    ).toBe(false);
    expect(
      shouldIndexPublicPageForProfile(
        "howItWorks",
        getCanonicalPath("howItWorks"),
      ),
    ).toBe(false);
    expect(
      shouldIndexPublicPageForProfile(
        "customProject",
        getCanonicalPath("customProject"),
      ),
    ).toBe(false);
  });

  it("does not index product market pages under the default profile", () => {
    const [marketSlug] = getAllMarketSlugs();

    expect(marketSlug).toBeDefined();
    expect(
      shouldIndexPublicPageForProfile(
        "products",
        getProductMarketPath(marketSlug ?? ""),
      ),
    ).toBe(false);
  });

  it("indexes showcase-full demo pages and product markets", () => {
    expect(
      shouldIndexPublicPageForProfile(
        "products",
        getCanonicalPath("products"),
        "showcase-full",
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "blog",
        getCanonicalPath("blog"),
        "showcase-full",
      ),
    ).toBe(true);

    const [marketSlug] = getAllMarketSlugs();
    expect(marketSlug).toBeDefined();
    expect(
      shouldIndexPublicPageForProfile(
        "products",
        getProductMarketPath(marketSlug ?? ""),
        "showcase-full",
      ),
    ).toBe(true);
  });

  it("indexes content-marketing blog pages but not products", () => {
    expect(
      shouldIndexPublicPageForProfile(
        "blog",
        getCanonicalPath("blog"),
        "content-marketing",
      ),
    ).toBe(true);
    expect(
      shouldIndexPublicPageForProfile(
        "products",
        getCanonicalPath("products"),
        "content-marketing",
      ),
    ).toBe(false);

    const [marketSlug] = getAllMarketSlugs();
    expect(marketSlug).toBeDefined();
    expect(
      shouldIndexPublicPageForProfile(
        "products",
        getProductMarketPath(marketSlug ?? ""),
        "content-marketing",
      ),
    ).toBe(false);
  });
});
