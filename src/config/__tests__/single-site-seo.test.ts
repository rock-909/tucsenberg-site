import { describe, expect, it } from "vitest";
import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";
import {
  getSingleSitePublicStaticPageRoutes,
  getSingleSitePublicStaticPages,
  getSingleSiteSitemapPageConfigByPath,
  getSingleSiteStaticPageLastmod,
  hasSingleSiteDynamicSurface,
  SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES,
  SINGLE_SITE_PUBLIC_STATIC_PAGES,
  SINGLE_SITE_ROBOTS_DISALLOW_PATHS,
  SINGLE_SITE_SITEMAP_DEFAULT_CONFIG,
  SINGLE_SITE_SITEMAP_PAGE_CONFIG,
  SINGLE_SITE_STATIC_PAGE_LASTMOD,
} from "@/config/single-site-seo";
import { TUCSENBERG_PRODUCT_PAGES } from "@/constants/tucsenberg-product-pages";

describe("single-site-seo", () => {
  const RETIRED_BENDING_MACHINES_PATH = "/capabilities/bending-machines";

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

  it("keeps catalog sitemap config scoped to current public pages", () => {
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
      Object.values(TUCSENBERG_PRODUCT_PAGES).map((productPage) => [
        getProductMarketPath(productPage.slug),
        productPage.meta.updatedAt,
      ]),
    );

    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD).toEqual({
      "": "2026-07-05T00:00:00Z",
      "/products": "2026-07-05T00:00:00Z",
      "/request-quote": "2026-07-05T00:00:00Z",
      ...expectedProductLastmod,
    });
    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD[getCanonicalPath("products")]).toBe(
      "2026-07-05T00:00:00Z",
    );
    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD["/capabilities"]).toBeUndefined();
    expect(SINGLE_SITE_ROBOTS_DISALLOW_PATHS).toEqual(["/api/", "/_next/"]);
  });

  it("can derive explicit catalog static pages and product market sidecar lastmod", () => {
    expect(getSingleSitePublicStaticPageRoutes()).toEqual([
      ...SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES,
    ]);
    expect(getSingleSitePublicStaticPages()).toContain(
      getCanonicalPath("products"),
    );
    expect(getSingleSiteSitemapPageConfigByPath().productMarket).toEqual({
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const catalogLastmod = getSingleSiteStaticPageLastmod();
    for (const productPage of Object.values(TUCSENBERG_PRODUCT_PAGES)) {
      expect(catalogLastmod[getProductMarketPath(productPage.slug)]).toBe(
        productPage.meta.updatedAt,
      );
    }
  });

  it("owns the product-market dynamic surface and no blog surface", () => {
    expect(hasSingleSiteDynamicSurface("productMarket")).toBe(true);
    expect(getSingleSiteSitemapPageConfigByPath().productMarket).toEqual({
      changeFrequency: "weekly",
      priority: 0.8,
    });
    expect(getSingleSiteSitemapPageConfigByPath().blogArticle).toBeUndefined();
  });
});
