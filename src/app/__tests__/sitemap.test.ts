import { describe, expect, it, vi } from "vitest";
import {
  getCanonicalPath,
  getCompatibleBrandPath,
  getMembraneProductPath,
  getProductMarketPath,
} from "@/config/paths/utils";
import {
  canonicalProductSlug,
  oemBrands,
  productVariants,
} from "@/data/product-compatibility";
import {
  getAllMarketFamilyCombos,
  getAllMarketSlugs,
} from "@/constants/product-catalog";
import {
  getSingleSiteSitemapPageConfig,
  SINGLE_SITE_PUBLIC_STATIC_PAGES,
} from "@/config/single-site-seo";
import { getMdxPageLastModified } from "@/lib/content/page-dates";
import { getStaticPageLastModified } from "@/lib/sitemap-utils";
import sitemap from "../sitemap";

// The product-compatibility data layer parses fixtures with zod at module load;
// the global zod mock would break those parses, so opt out for this suite.
vi.unmock("zod");

// Mock dependencies before imports
vi.mock("@/config/paths", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/paths")>();

  return {
    ...actual,
    SITE_CONFIG: {
      ...actual.SITE_CONFIG,
      baseUrl: "https://example.com",
    },
  };
});

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "es", "zh"],
    defaultLocale: "en",
  },
}));

vi.mock("@/lib/sitemap-utils", async () => {
  const { getCanonicalPath } = await import("@/config/paths/utils");
  const productsPath = getCanonicalPath("products");

  return {
    getStaticPageLastModified: vi.fn((page: string) => {
      if (page === "") {
        return new Date("2024-12-01T00:00:00Z");
      }
      const marketSlug = page.startsWith(`${productsPath}/`)
        ? page.slice(productsPath.length + 1)
        : "";
      if (
        page === productsPath ||
        (marketSlug.length > 0 && !marketSlug.includes("/"))
      ) {
        return new Date("2024-11-01T00:00:00Z");
      }
      throw new Error(`Unexpected static lastmod fallback: ${page}`);
    }),
  };
});

vi.mock("@/lib/content/page-dates", async () => {
  const { getCanonicalPath } = await import("@/config/paths/utils");
  const productsPath = getCanonicalPath("products");

  return {
    isMdxDrivenPage: vi.fn(
      (path: string) =>
        path !== "" &&
        path !== productsPath &&
        !path.startsWith(`${productsPath}/`),
    ),
    getMdxPageLastModified: vi.fn(async () => new Date("2026-04-20T00:00:00Z")),
  };
});

describe("sitemap.ts", () => {
  const BASE_URL = "https://example.com";
  const RETIRED_BENDING_MACHINES_URL = `${BASE_URL}/en/capabilities/bending-machines`;
  const defaultLocale = "en";

  function sitemapPathForCanonical(path: string): string {
    return path === "/" ? "" : path;
  }

  function localizedUrl(locale: string, path: string): string {
    return `${BASE_URL}/${locale}${path}`;
  }

  function findEntry(
    entries: Awaited<ReturnType<typeof sitemap>>,
    locale: string,
    path: string,
  ) {
    return entries.find((entry) => entry.url === localizedUrl(locale, path));
  }

  describe("sitemap()", () => {
    it("should return sitemap array", async () => {
      const result = await sitemap();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include static pages for public SEO locales only", async () => {
      const result = await sitemap();

      for (const locale of ["en", "es"]) {
        for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
          expect(findEntry(result, locale, pagePath)).toBeDefined();
        }
      }
      for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
        expect(findEntry(result, "zh", pagePath)).toBeUndefined();
      }
    });

    it("should include static pages", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
        expect(urls).toContain(localizedUrl(defaultLocale, pagePath));
      }
      expect(urls).not.toContain(RETIRED_BENDING_MACHINES_URL);
    });

    it("pins representative sitemap contract entries with fixed values", async () => {
      const result = await sitemap();

      expect(findEntry(result, "en", "")).toMatchObject({
        url: "https://example.com/en",
        priority: 1.0,
        changeFrequency: "daily",
      });
      expect(findEntry(result, "es", "/about")).toMatchObject({
        url: "https://example.com/es/about",
        priority: 0.8,
        changeFrequency: "monthly",
        lastModified: new Date("2026-04-20T00:00:00Z"),
      });
      expect(findEntry(result, "en", "/capabilities")).toMatchObject({
        url: "https://example.com/en/capabilities",
        priority: 0.85,
        changeFrequency: "monthly",
        lastModified: new Date("2026-04-20T00:00:00Z"),
      });
      expect(findEntry(result, "en", "/how-it-works")).toMatchObject({
        url: "https://example.com/en/how-it-works",
        priority: 0.85,
        changeFrequency: "monthly",
        lastModified: new Date("2026-04-20T00:00:00Z"),
      });
      expect(findEntry(result, "en", "/products/north-america")).toMatchObject({
        url: "https://example.com/en/products/north-america",
        priority: 0.8,
        changeFrequency: "weekly",
        lastModified: new Date("2024-11-01T00:00:00Z"),
      });
      expect(findEntry(result, "en", "/terms")).toMatchObject({
        url: "https://example.com/en/terms",
        priority: 0.7,
        changeFrequency: "monthly",
      });
    });

    it("should include the blog index but not old generated blog detail pages", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      expect(urls).toContain("https://example.com/en/blog");
      expect(urls).toContain("https://example.com/es/blog");
      expect(urls).not.toContain("https://example.com/en/blog/post-a");
      expect(urls).not.toContain("https://example.com/zh/blog/post-a");
    });

    it("should include product catalog market pages", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      for (const marketSlug of getAllMarketSlugs()) {
        expect(urls).toContain(
          localizedUrl(defaultLocale, getProductMarketPath(marketSlug)),
        );
        expect(urls).toContain(
          localizedUrl("es", getProductMarketPath(marketSlug)),
        );
        expect(urls).not.toContain(
          localizedUrl("zh", getProductMarketPath(marketSlug)),
        );
      }
    });

    it("should not include product catalog family pages (removed route)", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);
      const productsPath = getCanonicalPath("products");
      const [familyCombo] = getAllMarketFamilyCombos();

      expect(familyCombo).toBeDefined();
      expect(urls).not.toContain(
        localizedUrl(
          defaultLocale,
          `${productsPath}/${familyCombo?.market}/${familyCombo?.family}`,
        ),
      );
    });

    it("should have lastModified for entries", async () => {
      const result = await sitemap();

      for (const entry of result) {
        expect(entry.lastModified).toBeDefined();
        expect(entry.lastModified).toBeInstanceOf(Date);
      }
    });

    it("should have changeFrequency for entries", async () => {
      const result = await sitemap();
      const validFrequencies = [
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ];

      for (const entry of result) {
        expect(validFrequencies).toContain(entry.changeFrequency);
      }
    });

    it("should have priority for entries", async () => {
      const result = await sitemap();

      for (const entry of result) {
        expect(entry.priority).toBeDefined();
        expect(entry.priority).toBeGreaterThanOrEqual(0);
        expect(entry.priority).toBeLessThanOrEqual(1);
      }
    });

    it("should have alternates with languages", async () => {
      const result = await sitemap();

      for (const entry of result) {
        expect(entry.alternates).toBeDefined();
        expect(entry.alternates?.languages).toBeDefined();
      }
    });

    it("should include public SEO locales and x-default in alternates", async () => {
      const result = await sitemap();
      const enHome = findEntry(result, defaultLocale, "");

      expect(enHome?.alternates?.languages).toEqual({
        en: "https://example.com/en",
        es: "https://example.com/es",
        "x-default": "https://example.com/en",
      });
    });

    it("should not expose zh URLs in sitemap entries or alternates", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      expect(urls.some((url) => url.includes("/zh"))).toBe(false);
      for (const entry of result) {
        expect(entry.alternates?.languages).not.toHaveProperty("zh");
        expect(
          Object.values(entry.alternates?.languages ?? {}).some((url) =>
            url.includes("/zh"),
          ),
        ).toBe(false);
      }
    });

    it("should set home page priority to 1.0", async () => {
      const result = await sitemap();
      const homePath = sitemapPathForCanonical(getCanonicalPath("home"));
      const home = findEntry(result, defaultLocale, homePath);
      const homeConfig = getSingleSiteSitemapPageConfig(homePath);

      expect(home?.priority).toBe(homeConfig.priority);
    });

    it("should set products listing priority from sitemap config", async () => {
      const result = await sitemap();
      const productsPath = getCanonicalPath("products");
      const products = findEntry(result, defaultLocale, productsPath);
      const productsConfig = getSingleSiteSitemapPageConfig(productsPath);

      expect(products?.priority).toBe(productsConfig.priority);
    });

    it("should set home page changeFrequency from sitemap config", async () => {
      const result = await sitemap();
      const homePath = sitemapPathForCanonical(getCanonicalPath("home"));
      const home = findEntry(result, defaultLocale, homePath);
      const homeConfig = getSingleSiteSitemapPageConfig(homePath);

      expect(home?.changeFrequency).toBe(homeConfig.changeFrequency);
    });

    it("should set about page changeFrequency from sitemap config", async () => {
      const result = await sitemap();
      const aboutPath = getCanonicalPath("about");
      const about = findEntry(result, defaultLocale, aboutPath);
      const aboutConfig = getSingleSiteSitemapPageConfig(aboutPath);

      expect(about?.changeFrequency).toBe(aboutConfig.changeFrequency);
    });

    it("should use MDX updatedAt for MDX-driven page lastmod", async () => {
      const result = await sitemap();
      const aboutPath = getCanonicalPath("about");
      const about = findEntry(result, defaultLocale, aboutPath);

      expect(getMdxPageLastModified).toHaveBeenCalledWith(aboutPath);
      expect(about?.lastModified).toEqual(new Date("2026-04-20T00:00:00Z"));
    });

    it("should use MDX dates for public demo pages and sidecar dates for non-MDX pages", async () => {
      const result = await sitemap();
      const capabilitiesPath = getCanonicalPath("capabilities");
      const howItWorksPath = getCanonicalPath("howItWorks");
      const productsPath = getCanonicalPath("products");
      const [marketSlug] = getAllMarketSlugs();
      const marketPath = getProductMarketPath(marketSlug ?? "");
      const capabilities = findEntry(result, defaultLocale, capabilitiesPath);
      const howItWorks = findEntry(result, defaultLocale, howItWorksPath);
      const products = findEntry(result, defaultLocale, productsPath);
      const market = findEntry(result, defaultLocale, marketPath);

      expect(marketSlug).toBeDefined();
      expect(getMdxPageLastModified).toHaveBeenCalledWith(capabilitiesPath);
      expect(getMdxPageLastModified).toHaveBeenCalledWith(howItWorksPath);
      expect(getStaticPageLastModified).not.toHaveBeenCalledWith(
        capabilitiesPath,
        expect.any(Map),
      );
      expect(getStaticPageLastModified).not.toHaveBeenCalledWith(
        howItWorksPath,
        expect.any(Map),
      );
      expect(getStaticPageLastModified).toHaveBeenCalledWith(
        productsPath,
        expect.any(Map),
      );
      expect(getStaticPageLastModified).toHaveBeenCalledWith(
        marketPath,
        expect.any(Map),
      );
      expect(capabilities?.lastModified).toEqual(
        new Date("2026-04-20T00:00:00Z"),
      );
      expect(howItWorks?.lastModified).toEqual(
        new Date("2026-04-20T00:00:00Z"),
      );
      expect(products?.lastModified).toEqual(new Date("2024-11-01T00:00:00Z"));
      expect(market?.lastModified).toEqual(new Date("2024-11-01T00:00:00Z"));
    });

    it("should keep terms page SEO defaults explicit", async () => {
      const result = await sitemap();
      const termsPath = getCanonicalPath("terms");
      const terms = findEntry(result, defaultLocale, termsPath);
      const termsConfig = getSingleSiteSitemapPageConfig(termsPath);

      expect(terms?.priority).toBe(termsConfig.priority);
      expect(terms?.changeFrequency).toBe(termsConfig.changeFrequency);
    });

    it("should not have duplicate entries", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);
      const uniqueUrls = new Set(urls);

      expect(uniqueUrls.size).toBe(urls.length);
    });

    it("should include standalone pages with correct config", async () => {
      const result = await sitemap();
      const customProjectPath = getCanonicalPath("customProject");
      const customProject = findEntry(result, defaultLocale, customProjectPath);
      const customProjectConfig =
        getSingleSiteSitemapPageConfig(customProjectPath);

      expect(customProject).toBeDefined();
      expect(customProject?.priority).toBe(customProjectConfig.priority);
      expect(customProject?.changeFrequency).toBe(
        customProjectConfig.changeFrequency,
      );
    });

    it("should include a canonical descriptive membrane URL per productVariant for public locales only", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      expect(productVariants.length).toBeGreaterThan(0);
      for (const variant of productVariants) {
        const path = getMembraneProductPath(canonicalProductSlug(variant));
        expect(urls).toContain(localizedUrl("en", path));
        expect(urls).toContain(localizedUrl("es", path));
        expect(urls).not.toContain(localizedUrl("zh", path));

        // The legacy SKU slug is a redirect source and must NOT be emitted.
        const skuPath = getMembraneProductPath(variant.slug);
        expect(urls).not.toContain(localizedUrl("en", skuPath));
        expect(urls).not.toContain(localizedUrl("es", skuPath));
      }
    });

    it("should include a compatible brand URL per oemBrand slug for public locales only", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      expect(oemBrands.length).toBeGreaterThan(0);
      for (const brand of oemBrands) {
        const path = getCompatibleBrandPath(brand.slug);
        expect(urls).toContain(localizedUrl("en", path));
        expect(urls).toContain(localizedUrl("es", path));
        expect(urls).not.toContain(localizedUrl("zh", path));
      }
    });

    it("should expose membrane/brand alternates without zh", async () => {
      const result = await sitemap();
      const [variant] = productVariants;
      const [brand] = oemBrands;

      expect(variant).toBeDefined();
      expect(brand).toBeDefined();
      const variantPath = variant
        ? getMembraneProductPath(canonicalProductSlug(variant))
        : "";
      const variantEntry = findEntry(result, defaultLocale, variantPath);
      const brandEntry = findEntry(
        result,
        defaultLocale,
        getCompatibleBrandPath(brand?.slug ?? ""),
      );

      expect(variantEntry?.alternates?.languages).toEqual({
        en: localizedUrl("en", variantPath),
        es: localizedUrl("es", variantPath),
        "x-default": localizedUrl("en", variantPath),
      });
      expect(brandEntry?.alternates?.languages).not.toHaveProperty("zh");
    });

    it("maps every emitted sitemap URL to a real route pattern (no orphans)", async () => {
      const result = await sitemap();
      const productsPath = getCanonicalPath("products");
      const staticPaths = new Set(
        SINGLE_SITE_PUBLIC_STATIC_PAGES.map((page) =>
          page === "" ? "" : page,
        ),
      );
      const marketPaths = new Set(
        getAllMarketSlugs().map((slug) => getProductMarketPath(slug)),
      );
      const membranePaths = new Set(
        productVariants.map((variant) =>
          getMembraneProductPath(canonicalProductSlug(variant)),
        ),
      );
      const brandPaths = new Set(
        oemBrands.map((brand) => getCompatibleBrandPath(brand.slug)),
      );

      function isKnownRoute(path: string): boolean {
        if (staticPaths.has(path)) {
          return true;
        }
        if (path === productsPath || marketPaths.has(path)) {
          return true;
        }
        return membranePaths.has(path) || brandPaths.has(path);
      }

      const localePrefixes = ["en", "es"].map(
        (locale) => `${BASE_URL}/${locale}`,
      );

      for (const entry of result) {
        const prefix = localePrefixes.find(
          (candidate) =>
            entry.url === candidate || entry.url.startsWith(`${candidate}/`),
        );
        expect(
          prefix,
          `URL not under a public locale: ${entry.url}`,
        ).toBeDefined();
        const path = entry.url.slice((prefix ?? "").length);
        expect(
          isKnownRoute(path),
          `Orphan sitemap URL has no backing route: ${entry.url}`,
        ).toBe(true);
      }
    });
  });
});
