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

  it("makes company-site the explicit default public SEO profile", () => {
    expect(SINGLE_SITE_PUBLIC_SEO_PROFILE_ID).toBe("company-site");
    expect(getSingleSitePublicSeoProfileId()).toBe("company-site");
  });

  it("uses company-site public static sitemap pages by default", () => {
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGE_ROUTES).toEqual([
      "home",
      "about",
      "products",
      "blog",
      "resources",
      "contact",
      "privacy",
      "terms",
    ]);
    expect(SINGLE_SITE_PUBLIC_STATIC_PAGES).toEqual([
      "",
      "/about",
      "/products",
      "/blog",
      "/resources",
      "/contact",
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
    expect(SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("blog")]).toEqual({
      changeFrequency: "weekly",
      priority: 0.85,
    });
    expect(
      SINGLE_SITE_SITEMAP_PAGE_CONFIG[getCanonicalPath("resources")],
    ).toEqual({
      changeFrequency: "weekly",
      priority: 0.8,
    });
    expect(SINGLE_SITE_SITEMAP_PAGE_CONFIG.productMarket).toBeUndefined();
    expect(SINGLE_SITE_SITEMAP_DEFAULT_CONFIG).toEqual({
      changeFrequency: "weekly",
      priority: 0.5,
    });
  });

  it("keeps default sidecar lastmod scoped to company-site static pages", () => {
    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD).toEqual({
      "": "2026-04-26T00:00:00Z",
      "/products": "2026-04-26T00:00:00Z",
      "/blog": "2026-04-26T00:00:00Z",
      "/resources": "2026-04-26T00:00:00Z",
    });
    expect(SINGLE_SITE_STATIC_PAGE_LASTMOD[getCanonicalPath("products")]).toBe(
      "2026-04-26T00:00:00Z",
    );
    expect(
      SINGLE_SITE_STATIC_PAGE_LASTMOD[getCanonicalPath("capabilities")],
    ).toBeUndefined();
    expect(SINGLE_SITE_ROBOTS_DISALLOW_PATHS).toEqual([
      "/api/",
      "/_next/",
      "/ops/",
      "/error-test/",
    ]);
  });

  it("can derive showcase-full static pages and product market sidecar lastmod", () => {
    expect(getSingleSitePublicStaticPageRoutes("showcase-full")).toEqual([
      "home",
      "about",
      "products",
      "blog",
      "resources",
      "contact",
      "privacy",
      "terms",
      "capabilities",
      "howItWorks",
      "customProject",
    ]);
    expect(getSingleSitePublicStaticPages("showcase-full")).toContain(
      getCanonicalPath("products"),
    );
    expect(getSingleSitePublicStaticPages("showcase-full")).toContain(
      getCanonicalPath("blog"),
    );
    expect(
      getSingleSiteSitemapPageConfigByPath("showcase-full").productMarket,
    ).toEqual({
      changeFrequency: "weekly",
      priority: 0.8,
    });

    const showcaseLastmod = getSingleSiteStaticPageLastmod("showcase-full");
    for (const marketSlug of getAllMarketSlugs()) {
      const specs = getMarketSpecsBySlug(marketSlug);

      expect(specs, `${marketSlug} should have market specs`).toBeDefined();
      expect(showcaseLastmod[getProductMarketPath(marketSlug)]).toBe(
        specs?.updatedAt,
      );
    }
  });

  it("derives content-marketing static sitemap pages without products", () => {
    expect(getSingleSitePublicStaticPageRoutes("content-marketing")).toEqual([
      "home",
      "blog",
      "about",
      "contact",
      "privacy",
      "terms",
    ]);
    expect(getSingleSitePublicStaticPages("content-marketing")).toEqual([
      "",
      "/blog",
      "/about",
      "/contact",
      "/privacy",
      "/terms",
    ]);
    expect(getSingleSitePublicStaticPages("content-marketing")).not.toContain(
      "/products",
    );
    expect(
      getSingleSiteSitemapPageConfigByPath("content-marketing").productMarket,
    ).toBeUndefined();
    expect(
      getSingleSiteStaticPageLastmod("content-marketing")[
        getCanonicalPath("products")
      ],
    ).toBeUndefined();
  });

  it("derives dynamic surface ownership by profile", () => {
    expect(hasSingleSiteDynamicSurface("productMarket")).toBe(false);
    expect(hasSingleSiteDynamicSurface("productMarket", "catalog")).toBe(true);
    expect(hasSingleSiteDynamicSurface("productMarket", "showcase-full")).toBe(
      true,
    );
    expect(
      hasSingleSiteDynamicSurface("productMarket", "content-marketing"),
    ).toBe(false);
    expect(
      hasSingleSiteDynamicSurface("blogArticle", "content-marketing"),
    ).toBe(true);
    expect(
      getSingleSiteSitemapPageConfigByPath("company-site").blogArticle,
    ).toEqual({
      changeFrequency: "weekly",
      priority: 0.7,
    });
    expect(getSingleSiteSitemapPageConfigByPath("catalog").blogArticle).toBe(
      undefined,
    );
  });
});
