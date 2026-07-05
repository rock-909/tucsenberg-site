import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PageType } from "@/config/paths";
// Import after mocks
import {
  createPageSEOConfig,
  createStaticPageMetadataConfig,
  generateLocalizedMetadata,
  generateMetadataForPath,
} from "../seo-metadata";

// Use vi.hoisted to ensure proper mock setup
const { mockGenerateCanonicalURL, mockGenerateLanguageAlternates } = vi.hoisted(
  () => ({
    mockGenerateCanonicalURL: vi.fn(),
    mockGenerateLanguageAlternates: vi.fn(),
  }),
);

vi.mock("@/config/paths", () => ({
  SITE_CONFIG: {
    baseUrl: "https://example.com",
    name: "Test Site",
    seo: {
      titleTemplate: "%s | Test Site",
      defaultTitle: "Default Title",
      defaultDescription: "Default Description",
      keywords: ["test", "site"],
    },
  },
}));

vi.mock("@/config/site-facts", () => ({
  siteFacts: {
    company: {
      established: 2021,
      employees: 0,
    },
    brandAssets: {
      ogImage: "/images/facts-og.png",
    },
    stats: {
      exportCountries: 0,
    },
  },
}));

vi.mock("@/lib/seo/url-generator", () => ({
  generateCanonicalURL: mockGenerateCanonicalURL,
  generateLanguageAlternates: mockGenerateLanguageAlternates,
}));

describe("SEO Metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGenerateCanonicalURL.mockReturnValue("https://example.com/canonical");
    mockGenerateLanguageAlternates.mockReturnValue({
      en: "https://example.com/",
      "x-default": "https://example.com/",
    });

    // Mock environment variables
    process.env.GOOGLE_SITE_VERIFICATION = "google-verification-code";
    process.env.YANDEX_VERIFICATION = "yandex-verification-code";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_SITE_VERIFICATION;
    delete process.env.YANDEX_VERIFICATION;
    delete process.env.APP_ENV;
  });

  describe("generateLocalizedMetadata", () => {
    it("should generate basic metadata from SITE_CONFIG fallback", () => {
      const metadata = generateLocalizedMetadata("en", "home");

      expect(metadata.title).toBe("Default Title");
      expect(metadata.description).toBe("Default Description");
      expect(metadata.keywords).toEqual(["test", "site"]);
      expect(metadata.openGraph?.title).toBe("Default Title");
      expect(metadata.openGraph?.description).toBe("Default Description");
      expect(metadata.openGraph?.siteName).toBe("Test Site");
      expect(metadata.openGraph?.locale).toBe("en");
      expect(metadata.alternates?.canonical).toBe(
        "https://example.com/canonical",
      );
      expect(metadata.robots).toEqual({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      });
      expect(metadata.verification).toEqual({
        google: "google-verification-code",
        yandex: "yandex-verification-code",
      });
    });

    it("should use config title and description when provided", () => {
      const config = {
        title: "Custom Title",
        description: "Custom Description",
        keywords: ["custom", "keywords"],
        image: "/custom-image.jpg",
        type: "article" as const,
        publishedTime: "2023-01-01",
        modifiedTime: "2023-01-02",
        authors: ["Author 1", "Author 2"],
        section: "Technology",
      };

      const metadata = generateLocalizedMetadata("en", "products", config);

      expect(metadata.title).toBe("Custom Title");
      expect(metadata.description).toBe("Custom Description");
      expect(metadata.keywords).toEqual(["custom", "keywords"]);
      expect((metadata.openGraph as any)?.type).toBe("article");
      expect(metadata.openGraph?.images).toEqual([
        { url: "/custom-image.jpg" },
      ]);
      expect((metadata.openGraph as any)?.publishedTime).toBe("2023-01-01");
      expect((metadata.openGraph as any)?.modifiedTime).toBe("2023-01-02");
      expect((metadata.openGraph as any)?.authors).toEqual([
        "Author 1",
        "Author 2",
      ]);
      expect((metadata.openGraph as any)?.section).toBe("Technology");
      expect(metadata.twitter?.images).toEqual(["/custom-image.jpg"]);
    });

    it("should interpolate SITE_CONFIG-owned config strings", () => {
      const metadata = generateLocalizedMetadata("en", "about", {
        title: "Established in {established}",
        description:
          "Exports to {countries}+ countries with {employees}+ staff",
      });

      expect(metadata.title).toBe("Established in 2021");
      expect(metadata.description).toBe(
        "Exports to 0+ countries with 0+ staff",
      );
    });

    it("should handle product type correctly", () => {
      const config = {
        type: "product" as const,
      };

      const metadata = generateLocalizedMetadata("en", "products", config);

      // Product type should be converted to website for OpenGraph
      expect((metadata.openGraph as any)?.type).toBe("website");
    });

    it("should localize metadata chrome without reading SEO translations", () => {
      const metadataZh = generateLocalizedMetadata("zh", "about");
      const metadataEn = generateLocalizedMetadata("en", "about");

      expect(metadataZh.openGraph?.locale).toBe("en");
      expect(metadataZh.title).toBe("Default Title");
      expect(metadataZh.openGraph?.siteName).toBe("Test Site");

      expect(metadataEn.openGraph?.locale).toBe("en");
      expect(metadataEn.title).toBe("Default Title");
      expect(metadataEn.openGraph?.siteName).toBe("Test Site");
    });

    it("should handle missing environment variables", () => {
      delete process.env.GOOGLE_SITE_VERIFICATION;
      delete process.env.YANDEX_VERIFICATION;

      const metadata = generateLocalizedMetadata("en", "home");

      expect(metadata.verification).toEqual({
        google: undefined,
        yandex: undefined,
      });
    });

    it("should call URL generation functions with correct parameters", () => {
      generateLocalizedMetadata("en", "contact");

      expect(mockGenerateCanonicalURL).toHaveBeenCalledWith("contact", "en");
      expect(mockGenerateLanguageAlternates).toHaveBeenCalledWith("contact");
    });

    it("should fall back to SITE_CONFIG values for unknown pages", () => {
      const metadata = generateLocalizedMetadata("en", "unknown" as any);

      expect(metadata.title).toBe("Default Title");
      expect(metadata.description).toBe("Default Description");
    });

    it("should use SITE_CONFIG fallback for every page type without config", () => {
      const pageTypes = [
        "home",
        "about",
        "contact",
        "products",
        "privacy",
        "terms",
      ] as const;

      pageTypes.forEach((pageType) => {
        const metadata = generateLocalizedMetadata("en", pageType);
        expect(metadata.title).toBe("Default Title");
        expect(metadata.description).toBe("Default Description");
      });
    });
  });

  describe("generateMetadataForPath", () => {
    it("noindexes active catalog pages outside production", () => {
      process.env.APP_ENV = "preview";

      const metadata = generateMetadataForPath({
        locale: "en",
        pageType: "products",
        path: "/products",
      });

      expect(metadata.robots).toMatchObject({
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      });
    });

    it("keeps active catalog pages indexable in production", () => {
      process.env.APP_ENV = "production";

      const metadata = generateMetadataForPath({
        locale: "en",
        pageType: "products",
        path: "/products",
      });

      expect(metadata.robots).toMatchObject({
        index: true,
        follow: true,
      });
    });

    it("should keep default Tucsenberg catalog pages indexable", () => {
      process.env.APP_ENV = "production";
      const productsMetadata = generateMetadataForPath({
        locale: "en",
        pageType: "products",
        path: "/products",
      });
      const requestQuoteMetadata = generateMetadataForPath({
        locale: "en",
        pageType: "requestQuote",
        path: "/request-quote",
      });

      expect(productsMetadata.robots).toMatchObject({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      });
      expect(requestQuoteMetadata.robots).toMatchObject({
        index: true,
        follow: true,
      });
    });

    it("should index product market pages in the default public SEO profile", () => {
      process.env.APP_ENV = "production";
      const metadata = generateMetadataForPath({
        locale: "en",
        pageType: "products",
        path: "/products/abs-flood-barriers",
      });

      expect(metadata.robots).toMatchObject({
        index: true,
        follow: true,
      });
    });

    it("should noindex showcase-full demo pages outside the default public SEO profile", () => {
      const capabilitiesMetadata = generateMetadataForPath({
        locale: "en",
        pageType: "capabilities",
        path: "/capabilities",
      });

      expect(capabilitiesMetadata.robots).toMatchObject({
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      });
    });

    it("should keep active b2b-lead pages indexable", () => {
      process.env.APP_ENV = "production";
      const aboutMetadata = generateMetadataForPath({
        locale: "en",
        pageType: "about",
        path: "/about",
      });

      expect(aboutMetadata.robots).toEqual({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      });
    });

    it("should override canonical/hreflang and set openGraph.url from path", () => {
      const metadata = generateMetadataForPath({
        locale: "en",
        pageType: "about",
        path: "/about",
        config: {
          title: "Custom About",
          description: "Custom About Description",
        },
      });

      expect(metadata.alternates?.canonical).toBe("https://example.com/about");
      expect(metadata.alternates?.languages).toEqual({
        en: "https://example.com/about",
        "x-default": "https://example.com/about",
      });

      const openGraph = metadata.openGraph as unknown as { url?: string };
      expect(openGraph.url).toBe("https://example.com/about");
    });
  });

  describe("createPageSEOConfig", () => {
    it("should build title and description from static page SEO overrides by default", () => {
      expect(
        createStaticPageMetadataConfig({
          title: "Page title",
          description: "Page description",
          seo: {
            title: "SEO title",
            description: "SEO description",
            keywords: ["seo"],
            ogImage: "/seo.jpg",
          },
        }),
      ).toEqual({
        title: "SEO title",
        description: "SEO description",
      });
    });

    it("should include static page keywords and image only when a route opts in", () => {
      expect(
        createStaticPageMetadataConfig(
          {
            title: "Page title",
            description: "Page description",
            seo: {
              title: "SEO title",
              description: "SEO description",
              keywords: ["seo"],
              ogImage: "/seo.jpg",
            },
          },
          { includeKeywords: true, includeImage: true },
        ),
      ).toEqual({
        title: "SEO title",
        description: "SEO description",
        keywords: ["seo"],
        image: "/seo.jpg",
      });
    });

    it("should fall back to static page title and description when SEO overrides are absent", () => {
      expect(
        createStaticPageMetadataConfig({
          title: "Page title",
          description: "Page description",
        }),
      ).toEqual({
        title: "Page title",
        description: "Page description",
      });
    });

    it("should omit empty static page descriptions by default", () => {
      expect(
        createStaticPageMetadataConfig({
          title: "Page title",
          description: "",
        }),
      ).toEqual({
        title: "Page title",
      });
    });

    it("should preserve empty static page descriptions when a route opts in", () => {
      expect(
        createStaticPageMetadataConfig(
          {
            title: "Page title",
            description: "Page description",
            seo: {
              description: "",
            },
          },
          { includeEmptyDescription: true },
        ),
      ).toEqual({
        title: "Page title",
        description: "",
      });
    });

    it("should return home page config by default", () => {
      const config = createPageSEOConfig("home");

      expect(config).toEqual({
        type: "website",
        keywords: ["test", "site", "B2B Solution"],
        image: "/images/facts-og.png",
      });
    });

    it("should return specific page config", () => {
      const config = createPageSEOConfig("products");

      expect(config).toEqual({
        type: "website",
        keywords: ["Products", "Flood Barriers", "Flood Gates", "B2B"],
      });
    });

    it("should fall retired public demo pages back to home config", () => {
      expect(createPageSEOConfig("capabilities")).toEqual({
        type: "website",
        keywords: ["test", "site", "B2B Solution"],
        image: "/images/facts-og.png",
      });
      expect(createPageSEOConfig("howItWorks")).toEqual({
        type: "website",
        keywords: ["test", "site", "B2B Solution"],
        image: "/images/facts-og.png",
      });
    });

    it("should merge custom config with base config", () => {
      const customConfig = {
        title: "Custom Title",
        description: "Custom Description",
        keywords: ["custom", "keywords"],
      };

      const config = createPageSEOConfig("about", customConfig);

      expect(config).toEqual({
        type: "website",
        keywords: ["custom", "keywords"], // Custom keywords override base
        title: "Custom Title",
        description: "Custom Description",
      });
    });

    it("should handle unknown page types", () => {
      const config = createPageSEOConfig("unknown" as PageType);

      // Should fallback to home config
      expect(config.type).toBe("website");
      expect(config.keywords).toContain("B2B Solution");
    });

    it("should exclude developer-stack keywords from every page type", () => {
      const bannedKeywords = [
        "shadcn/ui",
        "Radix UI",
        "Modern Web",
        "Enterprise Platform",
      ];
      const pageTypes: PageType[] = [
        "home",
        "capabilities",
        "howItWorks",
        "about",
        "contact",
        "products",
        "privacy",
        "terms",
        "customProject",
      ];

      pageTypes.forEach((pageType) => {
        const config = createPageSEOConfig(pageType);

        bannedKeywords.forEach((keyword) => {
          expect(config.keywords).not.toContain(keyword);
        });
      });
    });

    it("should return correct config for all page types", () => {
      const pageTypes: PageType[] = [
        "home",
        "capabilities",
        "howItWorks",
        "about",
        "contact",
        "products",
        "privacy",
        "terms",
      ];

      pageTypes.forEach((pageType) => {
        const config = createPageSEOConfig(pageType);

        expect(config).toBeDefined();
        expect(config.type).toBeDefined();
        expect(config.keywords).toBeDefined();
        expect(Array.isArray(config.keywords)).toBe(true);
      });
    });

    it("should handle partial custom config", () => {
      const customConfig = {
        title: "Custom Title",
        // Only title provided, other fields should come from base config
      };

      const config = createPageSEOConfig("privacy", customConfig);

      expect(config.title).toBe("Custom Title");
      expect(config.type).toBe("website"); // From base config
      expect(config.keywords).toEqual(["Privacy", "Policy", "Data Protection"]); // From base config
    });

    it("should handle empty custom config", () => {
      const config = createPageSEOConfig("products", {});

      expect(config).toEqual({
        type: "website",
        keywords: ["Products", "Flood Barriers", "Flood Gates", "B2B"],
      });
    });

    it("should preserve all custom config properties", () => {
      const customConfig = {
        title: "Custom Title",
        description: "Custom Description",
        keywords: ["custom"],
        image: "/custom.jpg",
        type: "article" as const,
        publishedTime: "2023-01-01",
        modifiedTime: "2023-01-02",
        authors: ["Author"],
        section: "Tech",
      };

      const config = createPageSEOConfig("privacy", customConfig);

      expect(config).toEqual(customConfig);
    });

    it("should handle null and undefined custom config", () => {
      const config1 = createPageSEOConfig("privacy");
      const config2 = createPageSEOConfig("privacy", undefined);

      expect(config1).toEqual(config2);
      expect(config1.type).toBe("website");
      expect(config1.keywords).toEqual([
        "Privacy",
        "Policy",
        "Data Protection",
      ]);
    });

    it("should handle explicit null custom config", () => {
      // Explicitly test the null branch in mergeSEOConfig (line 152)
      const config = createPageSEOConfig("terms", null as any);

      expect(config.type).toBe("website");
      expect(config.keywords).toEqual(["Terms", "Conditions", "Legal"]);
      // Should not have title/description since null customConfig means no overrides
      expect(config.title).toBeUndefined();
      expect(config.description).toBeUndefined();
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle URL generation errors synchronously", () => {
      mockGenerateCanonicalURL.mockImplementation(() => {
        throw new Error("URL generation error");
      });

      expect(() => generateLocalizedMetadata("en", "home")).toThrow(
        "URL generation error",
      );
    });

    it("should handle complex custom config merging", () => {
      const customConfig = {
        image: null as any, // Null value
        type: "website" as const,
      };

      const config = createPageSEOConfig("terms", customConfig);

      // Terms page has default keywords, custom config doesn't override them
      expect(config.keywords).toEqual(["Terms", "Conditions", "Legal"]);
      expect(config.image).toBeNull();
      expect(config.type).toBe("website");
    });

    it("should merge base config with image field", () => {
      // Test applyBaseFields with image defined (line 119-120)
      const config = createPageSEOConfig("home");

      expect(config.image).toBe("/images/facts-og.png");
    });
  });

  describe("SITE_CONFIG fallback branches", () => {
    it("should use SITE_CONFIG.name for OpenGraph siteName", () => {
      const metadata = generateLocalizedMetadata("en", "home");

      expect(metadata.openGraph?.siteName).toBe("Test Site");
    });

    it("should use config keywords before SITE_CONFIG keywords", () => {
      const metadata = generateLocalizedMetadata("en", "home", {
        keywords: ["custom", "keywords"],
      });

      expect(metadata.keywords).toEqual(["custom", "keywords"]);
    });

    it("should use SITE_CONFIG keywords when config keywords are absent", () => {
      const metadata = generateLocalizedMetadata("en", "home");

      expect(metadata.keywords).toEqual(["test", "site"]);
    });
  });
});
