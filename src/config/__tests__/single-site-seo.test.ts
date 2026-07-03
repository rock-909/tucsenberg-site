import { describe, expect, it } from "vitest";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import {
  getSingleSitePublicSeoProfileId,
  getSingleSitePublicStaticPageRoutes,
  getSingleSitePublicStaticPages,
  getSingleSiteSitemapPageConfigByPath,
  getSingleSiteStaticPageLastmod,
  hasSingleSiteDynamicSurface,
  SINGLE_SITE_PUBLIC_SEO_PROFILE_ID,
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

  it("makes catalog the explicit default public SEO profile", () => {
    expect(SINGLE_SITE_PUBLIC_SEO_PROFILE_ID).toBe("catalog");
    expect(getSingleSitePublicSeoProfileId()).toBe("catalog");
  });

  it("uses Tucsenberg catalog public static sitemap pages by default", () => {
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toEqual([
      "home",
      "products",
      "oemWholesale",
      "materialsGuide",
      "specificationsGuide",
      "about",
      "requestQuote",
      "contact",
      "warranty",
      "privacy",
      "terms",
    ]);
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGES).toEqual([
      "",
      "/products",
      "/oem-wholesale",
      "/guides/flood-barrier-materials-guide",
      "/guides/flood-barrier-specifications",
      "/about",
      "/request-quote",
      "/contact",
      "/warranty",
      "/privacy",
      "/terms",
    ]);
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGES).not.toContain(
      RETIRED_BENDING_MACHINES_PATH,
    );
  });

  it("keeps default sitemap configs scoped to company-site pages", () => {
    expect(SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("terms")]).toEqual({
      changeFrequency: "monthly",
      priority: 0.7,
    });
    expect(SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("about")]).toEqual({
      changeFrequency: "monthly",
      priority: 0.8,
    });
    expect(
      SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("products")],
    ).toEqual({
      changeFrequency: "weekly",
      priority: 0.9,
    });
    expect(
      SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("requestQuote")],
    ).toEqual({
      changeFrequency: "monthly",
      priority: 0.9,
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

  it("keeps default sidecar lastmod scoped to catalog static and product pages", () => {
    const expectedProductLastmod = Object.fromEntries(
      getAllMarketSlugs().map((marketSlug) => [
        getProductMarketPath(marketSlug),
        getMarketSpecsBySlug(marketSlug)?.updatedAt,
      ]),
    );

    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD).toEqual({
      "": "2026-04-26T00:00:00Z",
      "/products": "2026-04-26T00:00:00Z",
      "/request-quote": "2026-04-26T00:00:00Z",
      ...expectedProductLastmod,
    });
    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD[getCanonicalPath("products")]).toBe(
      "2026-04-26T00:00:00Z",
    );
    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD["/capabilities"]).toBeUndefined();
    expect(SINGLE_SITE_ROBOTS_DISALLOW_PATHS).toEqual([
      "/api/",
      "/_next/",
      "/ops/",
      "/error-test/",
    ]);
  });

  it("can derive explicit catalog static pages and product market sidecar lastmod", () => {
    expect(getSingleSitePublicStaticPageRoutes("catalog")).toEqual([
      ...SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES,
    ]);
    expect(getSingleSitePublicStaticPages("catalog")).toContain(
      getCanonicalPath("products"),
    );
    expect(
      getSingleSiteSitemapPageConfigByPath("catalog").productMarket,
    ).toEqual({
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const catalogLastmod = getSingleSiteStaticPageLastmod("catalog");
    for (const marketSlug of getAllMarketSlugs()) {
      const specs = getMarketSpecsBySlug(marketSlug);

      expect(specs, `${marketSlug} should have market specs`).toBeDefined();
      expect(catalogLastmod[getProductMarketPath(marketSlug)]).toBe(
        specs?.updatedAt,
      );
    }
  });

  it("derives minimal static sitemap pages without product markets", () => {
    expect(getSingleSitePublicStaticPageRoutes("minimal")).toEqual([
      "home",
      "privacy",
      "terms",
    ]);
    expect(getSingleSitePublicStaticPages("minimal")).toEqual([
      "",
      "/privacy",
      "/terms",
    ]);
    expect(getSingleSitePublicStaticPages("minimal")).not.toContain(
      "/products",
    );
    expect(
      getSingleSiteSitemapPageConfigByPath("minimal").productMarket,
    ).toBeUndefined();
    expect(
      getSingleSiteStaticPageLastmod("minimal")[getCanonicalPath("products")],
    ).toBeUndefined();
  });

  it("derives dynamic surface ownership by profile", () => {
    expect(hasSingleSiteDynamicSurface("productMarket")).toBe(true);
    expect(hasSingleSiteDynamicSurface("productMarket", "catalog")).toBe(true);
    expect(hasSingleSiteDynamicSurface("productMarket", "minimal")).toBe(false);
    expect(hasSingleSiteDynamicSurface("blogArticle", "catalog")).toBe(false);
    expect(
      getSingleSiteSitemapPageConfigByPath("catalog").blogArticle,
    ).toBeUndefined();
  });
});
