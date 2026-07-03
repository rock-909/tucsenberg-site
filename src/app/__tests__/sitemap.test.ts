import { describe, expect, it, vi } from "vitest";
import {
  getBlogArticlePath,
  getCanonicalPath,
  getProductMarketPath,
} from "@/config/paths";
import {
  getAllMarketFamilyCombos,
  getAllMarketSlugs,
} from "@/constants/product-catalog";
import {
  getSingleSiteSitemapPageConfig,
  SINGLE_SITE_PUBLIC_STATIC_PAGES,
} from "@/config/single-site-seo";
import { getMdxPageLastModified } from "@/lib/content/page-dates";
import {
  getStarterBlogArticle,
  getStarterBlogArticleModifiedAt,
  getStarterBlogArticleSlugs,
} from "@/lib/blog/starter-blog";
import { getStaticPageLastModified } from "@/lib/sitemap-utils";
import sitemap, { generateSitemapForProfile } from "../sitemap";

const mockBlogArticleOverrides = vi.hoisted(
  () => new Map<string, { readonly updatedAt?: string }>(),
);

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
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
}));

vi.mock("@/lib/sitemap-utils", async () => {
  const { getCanonicalPath } = await import("@/config/paths/utils");
  const productsPath = getCanonicalPath("products");
  const blogPath = getCanonicalPath("blog");
  const resourcesPath = getCanonicalPath("resources");
  const staticLastmodPaths = new Set([
    "",
    productsPath,
    blogPath,
    resourcesPath,
  ]);

  return {
    getStaticPageLastModified: vi.fn((page: string) => {
      if (page === "") {
        return new Date("2024-12-01T00:00:00Z");
      }
      const marketSlug = page.startsWith(`${productsPath}/`)
        ? page.slice(productsPath.length + 1)
        : "";
      if (
        staticLastmodPaths.has(page) ||
        (marketSlug.length > 0 && !marketSlug.includes("/"))
      ) {
        return new Date("2024-11-01T00:00:00Z");
      }
      throw new Error(`Unexpected static lastmod fallback: ${page}`);
    }),
  };
});

vi.mock("@/lib/content/page-dates", async () => {
  const { getMdxPageSlugByStaticPath } = await import("@/config/pages.config");

  return {
    isMdxDrivenPage: vi.fn(
      (path: string) => path in getMdxPageSlugByStaticPath(),
    ),
    getMdxPageLastModified: vi.fn(async () => new Date("2026-04-20T00:00:00Z")),
  };
});

vi.mock("@/lib/blog/starter-blog", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/blog/starter-blog")>();

  return {
    ...actual,
    getStarterBlogArticle: (locale: "en" | "zh", slug: string) => ({
      ...actual.getStarterBlogArticle(locale, slug),
      ...mockBlogArticleOverrides.get(`${locale}:${slug}`),
    }),
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

    it("should include default company-site static pages for all locales", async () => {
      const result = await sitemap();

      for (const locale of ["en", "zh"]) {
        for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
          expect(findEntry(result, locale, pagePath)).toBeDefined();
        }
      }
    });

    it("should exclude optional demo static pages by default", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      for (const pagePath of SINGLE_SITE_PUBLIC_STATIC_PAGES) {
        expect(urls).toContain(localizedUrl(defaultLocale, pagePath));
      }
      expect(urls).not.toContain(RETIRED_BENDING_MACHINES_URL);
      expect(findEntry(result, "en", "/products")).toBeDefined();
      expect(findEntry(result, "zh", "/products")).toBeDefined();
      expect(findEntry(result, "en", "/blog")).toBeDefined();
      expect(findEntry(result, "zh", "/blog")).toBeDefined();
      expect(findEntry(result, "en", "/resources")).toBeDefined();
      expect(findEntry(result, "zh", "/resources")).toBeDefined();
      expect(urls).not.toContain(localizedUrl(defaultLocale, "/capabilities"));
      expect(urls).not.toContain(localizedUrl(defaultLocale, "/how-it-works"));
      expect(urls).not.toContain(
        localizedUrl(defaultLocale, "/custom-project-support"),
      );
    });

    it("pins representative default sitemap contract entries with fixed values", async () => {
      const result = await sitemap();

      expect(findEntry(result, "en", "")).toMatchObject({
        url: "https://example.com/en",
        priority: 1.0,
        changeFrequency: "daily",
      });
      expect(findEntry(result, "zh", "/about")).toMatchObject({
        url: "https://example.com/zh/about",
        priority: 0.8,
        changeFrequency: "monthly",
        lastModified: new Date("2026-04-20T00:00:00Z"),
      });
      expect(findEntry(result, "en", "/contact")).toMatchObject({
        url: "https://example.com/en/contact",
        priority: 0.8,
        changeFrequency: "monthly",
        lastModified: new Date("2026-04-20T00:00:00Z"),
      });
      expect(findEntry(result, "en", "/terms")).toMatchObject({
        url: "https://example.com/en/terms",
        priority: 0.7,
        changeFrequency: "monthly",
      });
      expect(findEntry(result, "en", "/capabilities")).toBeUndefined();
      expect(findEntry(result, "en", "/how-it-works")).toBeUndefined();
      expect(
        findEntry(result, "en", "/products/north-america"),
      ).toBeUndefined();
    });

    it("includes starter blog article pages by default and keeps old generated pages absent", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      expect(urls).toContain("https://example.com/en/blog");
      expect(urls).toContain("https://example.com/zh/blog");

      for (const slug of getStarterBlogArticleSlugs()) {
        const articlePath = getBlogArticlePath(slug);

        expect(urls).toContain(localizedUrl("en", articlePath));
        expect(urls).toContain(localizedUrl("zh", articlePath));
      }

      const [contractSlug] = getStarterBlogArticleSlugs();

      expect(contractSlug).toBeDefined();
      if (!contractSlug) {
        throw new Error("Expected at least one starter blog article");
      }

      const contractPath = getBlogArticlePath(contractSlug);
      for (const locale of ["en", "zh"] as const) {
        const article = getStarterBlogArticle(locale, contractSlug);

        expect(findEntry(result, locale, contractPath)).toMatchObject({
          changeFrequency: "weekly",
          priority: 0.7,
          lastModified: new Date(getStarterBlogArticleModifiedAt(article)),
        });
      }

      expect(urls).not.toContain("https://example.com/en/blog/post-a");
      expect(urls).not.toContain("https://example.com/zh/blog/post-a");
    });

    it("uses blog article updatedAt for sitemap lastModified when present", async () => {
      mockBlogArticleOverrides.set("en:prepare-before-launch", {
        updatedAt: "2026-05-20",
      });

      const result = await sitemap();
      const articlePath = getBlogArticlePath("prepare-before-launch");

      expect(findEntry(result, "en", articlePath)).toMatchObject({
        lastModified: new Date("2026-05-20"),
      });
      expect(findEntry(result, "zh", articlePath)).toMatchObject({
        lastModified: new Date("2026-05-05"),
      });

      mockBlogArticleOverrides.clear();
    });

    it("should exclude product catalog market pages by default", async () => {
      const result = await sitemap();
      const urls = result.map((entry) => entry.url);

      for (const marketSlug of getAllMarketSlugs()) {
        expect(urls).not.toContain(
          localizedUrl(defaultLocale, getProductMarketPath(marketSlug)),
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

    it("should include x-default in alternates", async () => {
      const result = await sitemap();
      const enHome = findEntry(result, defaultLocale, "");

      expect(enHome?.alternates?.languages?.["x-default"]).toBeDefined();
    });

    it("should set home page priority to 1.0", async () => {
      const result = await sitemap();
      const homePath = sitemapPathForCanonical(getCanonicalPath("home"));
      const home = findEntry(result, defaultLocale, homePath);
      const homeConfig = getSingleSiteSitemapPageConfig(homePath);

      expect(home?.priority).toBe(homeConfig.priority);
    });

    it("should expose products listing priority in the default sitemap", async () => {
      const result = await sitemap();
      const productsPath = getCanonicalPath("products");
      const products = findEntry(result, defaultLocale, productsPath);
      const productsConfig = getSingleSiteSitemapPageConfig(productsPath);

      expect(products).toMatchObject({
        priority: productsConfig.priority,
        changeFrequency: productsConfig.changeFrequency,
      });
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

    it("should use MDX dates for default active MDX pages and sidecar dates for static pages", async () => {
      const result = await sitemap();
      const aboutPath = getCanonicalPath("about");
      const contactPath = getCanonicalPath("contact");
      const productsPath = getCanonicalPath("products");
      const blogPath = getCanonicalPath("blog");
      const resourcesPath = getCanonicalPath("resources");
      const [marketSlug] = getAllMarketSlugs();
      const marketPath = getProductMarketPath(marketSlug ?? "");
      const about = findEntry(result, defaultLocale, aboutPath);
      const contact = findEntry(result, defaultLocale, contactPath);
      const products = findEntry(result, defaultLocale, productsPath);
      const blog = findEntry(result, defaultLocale, blogPath);
      const resources = findEntry(result, defaultLocale, resourcesPath);
      const market = findEntry(result, defaultLocale, marketPath);

      expect(marketSlug).toBeDefined();
      expect(getMdxPageLastModified).toHaveBeenCalledWith(aboutPath);
      expect(getMdxPageLastModified).toHaveBeenCalledWith(contactPath);
      expect(getStaticPageLastModified).toHaveBeenCalledWith(
        productsPath,
        expect.any(Map),
      );
      expect(getStaticPageLastModified).toHaveBeenCalledWith(
        blogPath,
        expect.any(Map),
      );
      expect(getStaticPageLastModified).toHaveBeenCalledWith(
        resourcesPath,
        expect.any(Map),
      );
      expect(getStaticPageLastModified).not.toHaveBeenCalledWith(
        marketPath,
        expect.any(Map),
      );
      expect(about?.lastModified).toEqual(new Date("2026-04-20T00:00:00Z"));
      expect(contact?.lastModified).toEqual(new Date("2026-04-20T00:00:00Z"));
      expect(products?.lastModified).toEqual(new Date("2024-11-01T00:00:00Z"));
      expect(blog?.lastModified).toEqual(new Date("2024-11-01T00:00:00Z"));
      expect(resources?.lastModified).toEqual(new Date("2024-11-01T00:00:00Z"));
      expect(market).toBeUndefined();
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

    it("should exclude custom-project-support from the default sitemap", async () => {
      const result = await sitemap();
      const customProjectPath = getCanonicalPath("customProject");
      const customProject = findEntry(result, defaultLocale, customProjectPath);

      expect(customProject).toBeUndefined();
    });

    it("can generate showcase-full sitemap entries for demo static pages and product markets", async () => {
      const result = await generateSitemapForProfile("showcase-full");
      const urls = result.map((entry) => entry.url);

      expect(urls).toContain(localizedUrl(defaultLocale, "/products"));
      expect(urls).toContain(localizedUrl(defaultLocale, "/blog"));
      expect(urls).toContain(localizedUrl(defaultLocale, "/capabilities"));
      expect(urls).toContain(localizedUrl(defaultLocale, "/how-it-works"));
      expect(urls).toContain(
        localizedUrl(defaultLocale, "/custom-project-support"),
      );

      for (const marketSlug of getAllMarketSlugs()) {
        expect(urls).toContain(
          localizedUrl(defaultLocale, getProductMarketPath(marketSlug)),
        );
        expect(urls).toContain(
          localizedUrl("zh", getProductMarketPath(marketSlug)),
        );
      }
    });

    it("can generate content-marketing sitemap entries with blog but without products", async () => {
      const result = await generateSitemapForProfile("content-marketing");
      const urls = result.map((entry) => entry.url);

      expect(urls).toContain(localizedUrl(defaultLocale, "/blog"));
      expect(urls).toContain(localizedUrl(defaultLocale, "/about"));
      expect(urls).toContain(localizedUrl(defaultLocale, "/contact"));
      expect(urls).toContain(localizedUrl(defaultLocale, "/privacy"));
      expect(urls).toContain(localizedUrl(defaultLocale, "/terms"));
      expect(urls).not.toContain(localizedUrl(defaultLocale, "/products"));

      for (const marketSlug of getAllMarketSlugs()) {
        expect(urls).not.toContain(
          localizedUrl(defaultLocale, getProductMarketPath(marketSlug)),
        );
      }

      for (const slug of getStarterBlogArticleSlugs()) {
        const articlePath = getBlogArticlePath(slug);

        expect(urls).toContain(localizedUrl("en", articlePath));
        expect(urls).toContain(localizedUrl("zh", articlePath));
      }
    });

    it("can generate catalog sitemap entries with product markets but without blog", async () => {
      const result = await generateSitemapForProfile("catalog");
      const urls = result.map((entry) => entry.url);

      expect(urls).toContain(localizedUrl(defaultLocale, "/products"));
      expect(urls).not.toContain(localizedUrl(defaultLocale, "/blog"));
      expect(urls).not.toContain(localizedUrl(defaultLocale, "/about"));

      for (const marketSlug of getAllMarketSlugs()) {
        expect(urls).toContain(
          localizedUrl(defaultLocale, getProductMarketPath(marketSlug)),
        );
      }

      for (const slug of getStarterBlogArticleSlugs()) {
        const articlePath = getBlogArticlePath(slug);

        expect(urls).not.toContain(localizedUrl("en", articlePath));
        expect(urls).not.toContain(localizedUrl("zh", articlePath));
      }
    });
  });
});
