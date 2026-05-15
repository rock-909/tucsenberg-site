import { describe, expect, it } from "vitest";
import { PATHS_CONFIG } from "@/config/paths/paths-config";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import {
  SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES,
  SINGLE_SITE_PUBLIC_STATIC_PAGES,
  SINGLE_SITE_ROBOTS_DISALLOW_PATHS,
  SINGLE_SITE_SITEMAP_DEFAULT_CONFIG,
  SINGLE_SITE_SITEMAP_PAGE_CONFIG,
  SINGLE_SITE_STATIC_PAGE_LASTMOD,
} from "@/config/single-site-seo";
import { getAllMarketSlugs } from "@/constants/product-catalog";
import { getMarketSpecsBySlug } from "@/constants/product-specs/market-spec-registry";

describe("single-site-seo", () => {
  const RETIRED_BENDING_MACHINES_PATH = "/capabilities/bending-machines";

  it("keeps public static sitemap pages as an explicit route allowlist", () => {
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toEqual([
      "home",
      "about",
      "products",
      "blog",
      "contact",
      "privacy",
      "terms",
      "capabilities",
      "howItWorks",
      "customProject",
      "quote",
    ]);
    expect([...SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES].sort()).toEqual(
      Object.keys(PATHS_CONFIG).sort(),
    );

    const expectedPages = SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES.map(
      (pageType) => {
        const canonicalPath = getCanonicalPath(pageType);
        return canonicalPath === "/" ? "" : canonicalPath;
      },
    );

    expect(SINGLE_SITE_PUBLIC_STATIC_PAGES).toEqual(expectedPages);
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGES).not.toContain(
      RETIRED_BENDING_MACHINES_PATH,
    );
  });

  it("keeps sitemap configs explicit for special page types", () => {
    expect(SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("terms")]).toEqual({
      changeFrequency: "monthly",
      priority: 0.7,
    });
    expect(
      SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("capabilities")],
    ).toEqual({
      changeFrequency: "monthly",
      priority: 0.85,
    });
    expect(SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("blog")]).toEqual({
      changeFrequency: "weekly",
      priority: 0.85,
    });
    expect(
      SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("howItWorks")],
    ).toEqual({
      changeFrequency: "monthly",
      priority: 0.85,
    });
    expect(SINGLE_SITE_SITEMAP_PAGE_CONFIG.productMarket).toEqual({
      changeFrequency: "weekly",
      priority: 0.8,
    });
    expect(SINGLE_SITE_SITEMAP_DEFAULT_CONFIG).toEqual({
      changeFrequency: "weekly",
      priority: 0.5,
    });
  });

  it("keeps sidecar lastmod only for non-MDX static pages and product markets", () => {
    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD[getCanonicalPath("products")]).toBe(
      "2026-04-26T00:00:00Z",
    );
    expect(
      SINGLE_SITE_STATIC_PAGE_LASTMOD[getCanonicalPath("capabilities")],
    ).toBeUndefined();
    expect(
      SINGLE_SITE_STATIC_PAGE_LASTMOD[getCanonicalPath("howItWorks")],
    ).toBeUndefined();
    for (const marketSlug of getAllMarketSlugs()) {
      const specs = getMarketSpecsBySlug(marketSlug);

      expect(specs, `${marketSlug} should have market specs`).toBeDefined();
      expect(
        SINGLE_SITE_STATIC_PAGE_LASTMOD[getProductMarketPath(marketSlug)],
      ).toBe(specs?.updatedAt);
    }
    expect(SINGLE_SITE_ROBOTS_DISALLOW_PATHS).toEqual([
      "/api/",
      "/_next/",
      "/ops/",
      "/error-test/",
      "/zh/",
    ]);
  });
});
