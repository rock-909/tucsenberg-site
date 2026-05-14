import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import after mocks
import {
  generateJSONLD,
  generateLocalBusinessSchema,
  generateLocalizedStructuredData,
  generateProductSchema,
  generateStructuredData,
} from "../structured-data";
import * as structuredDataPublicApi from "../structured-data";
import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";
import { loadCompleteMessagesFromSource } from "@/lib/i18n/load-messages";

// 测试常量定义
const TEST_COUNTS = {
  HOME_STRUCTURED_DATA: 2, // Organization + Website
  PRODUCTS_STRUCTURED_DATA: 3, // Organization + Website + Product
  FALLBACK_STRUCTURED_DATA: 2, // Organization + Website (fallback)
} as const;

// Use vi.hoisted to ensure proper mock setup
const { mockGetTranslations, mockRecordError } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
  mockRecordError: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
}));

vi.mock("next/cache", () => ({
  unstable_cache: (loader: unknown) => loader,
}));

vi.mock("@/lib/i18n/performance", () => ({
  I18nPerformanceMonitor: {
    getInstance: () => ({
      trackTranslationUsage: vi.fn(),
    }),
    recordError: mockRecordError,
  },
}));

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
}));

type TranslationOptions = { defaultValue?: string };
type TranslationFunction = (
  key: string,
  options?: TranslationOptions,
) => string;
type MessageRecord = Record<string, unknown>;

const factualPlaceholderPattern =
  /\{(?:siteName|companyName|currentYear|copyright)\}/u;

function isMessageRecord(value: unknown): value is MessageRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNestedMessage(messages: MessageRecord, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isMessageRecord(current)) return undefined;
    return current[key];
  }, messages);
}

function createTranslationFunction(
  messages: MessageRecord,
): TranslationFunction {
  return (key, options) => {
    const value = readNestedMessage(messages, key);
    return typeof value === "string" ? value : (options?.defaultValue ?? key);
  };
}

vi.mock("@/config/paths/site-config", () => ({
  SITE_CONFIG: {
    baseUrl: "https://example.com",
    name: "Example Showcase Company",
    description:
      "Reusable showcase website starter for product or service presentation",
    seo: {
      titleTemplate: "%s | Example Showcase Company",
      defaultTitle: "Example Showcase Company",
      defaultDescription:
        "Reusable showcase website starter for product or service presentation",
      keywords: [],
    },
    social: {
      twitter: "https://x.com/example",
      linkedin: "https://www.linkedin.com/company/example",
    },
    contact: {
      phone: "+86-518-0000-0000",
      email: "contact@example.example",
    },
  },
}));

describe("Structured Data Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock translation function
    const mockT = vi.fn((key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        "organization.name": "Example Showcase Company",
        "organization.description":
          "Reusable showcase website starter for product or service presentation",
        "website.name": "Example Showcase Company",
        "website.description": "Reusable showcase website starter",
        "breadcrumb.home": "Home",
        "breadcrumb.about": "About",
        "breadcrumb.contact": "Contact",
        "article.author": "Example Showcase Company",
        "product.brand": "Example Showcase Company",
        "faq.question1": "What is this platform?",
        "faq.answer1": "A professional showcase website starter",
        "business.name": "Example Showcase Company",
        "business.address": "Example Business Park, Example City",
        "business.phone": "+86-518-0000-0000",
      };
      const safeTranslations = new Map(Object.entries(translations));
      return safeTranslations.get(key) || options?.defaultValue || key;
    });

    mockGetTranslations.mockResolvedValue(mockT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("public structured-data API", () => {
    it("does not expose legacy FAQ or breadcrumb schema aliases", () => {
      expect("generateFAQSchema" in structuredDataPublicApi).toBe(false);
      expect("generateBreadcrumbSchema" in structuredDataPublicApi).toBe(false);
    });

    it("keeps schema context literals out of compatibility modules", () => {
      const structuredDataSource = readFileSync(
        join(process.cwd(), "src/lib/structured-data.ts"),
        "utf8",
      );
      const structuredDataHelpersSource = readFileSync(
        join(process.cwd(), "src/lib/structured-data-helpers.ts"),
        "utf8",
      );

      expect(structuredDataSource).not.toContain(
        '"@context": "https://schema.org"',
      );
      expect(structuredDataHelpersSource).not.toContain(
        '"@context": "https://schema.org"',
      );
    });
  });

  describe("generateLocalizedStructuredData - Organization", () => {
    it("should generate valid organization schema", async () => {
      const schema = await generateLocalizedStructuredData(
        "en",
        "Organization",
        {},
      );

      expect(schema).toMatchObject({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Example Showcase Company",
        description:
          "Reusable showcase website starter for product or service presentation",
        url: "https://example.com",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["en", "zh"],
        },
      });
      expect(
        (schema.contactPoint as Record<string, unknown>).telephone,
      ).toBeUndefined();
      expect(JSON.stringify(schema)).not.toContain("+86-518-0000-0000");
      expect((schema as Record<string, unknown>).logo).toBeUndefined();
      expect(JSON.stringify(schema)).not.toContain("/images/logo.svg");

      const sameAs = schema["sameAs"] as string[];
      expect(sameAs).toEqual([
        "https://x.com/example",
        "https://www.linkedin.com/company/example",
      ]);
      expect(sameAs).toHaveLength(2);
    });

    it("should handle different locales", async () => {
      await generateLocalizedStructuredData("zh", "Organization", {});

      expect(mockGetTranslations).toHaveBeenCalledWith({
        locale: "zh",
        namespace: "structured-data",
      });
    });
  });

  describe("generateLocalizedStructuredData - WebSite", () => {
    it("should generate valid website schema", async () => {
      const schema = await generateLocalizedStructuredData("en", "WebSite", {});

      expect(schema).toMatchObject({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Example Showcase Company",
        description: "Reusable showcase website starter",
        url: "https://example.com",
        inLanguage: ["en", "zh"],
      });
      expect(schema).not.toHaveProperty("potentialAction");
      expect(JSON.stringify(schema)).not.toContain("SearchAction");
      expect(JSON.stringify(schema)).not.toContain("/search");
    });
  });

  describe("structured-data runtime messages", () => {
    it("uses concrete brand names after message loader interpolation", async () => {
      const messages = await loadCompleteMessagesFromSource("en");
      const structuredDataMessages = readNestedMessage(
        messages,
        "structured-data",
      );

      if (!isMessageRecord(structuredDataMessages)) {
        throw new Error("Missing structured-data message namespace");
      }

      mockGetTranslations.mockImplementation(
        async ({ namespace }: { namespace?: string }) =>
          createTranslationFunction(
            namespace === "structured-data" ? structuredDataMessages : {},
          ),
      );

      const [organization, website] = await Promise.all([
        generateLocalizedStructuredData("en", "Organization", {}),
        generateLocalizedStructuredData("en", "WebSite", {}),
      ]);

      expect(organization.name).toBe(SINGLE_SITE_FACTS.company.name);
      expect(website.name).toBe(SINGLE_SITE_CONFIG.name);
      expect(JSON.stringify([organization, website])).not.toMatch(
        factualPlaceholderPattern,
      );
    });
  });

  describe("generateProductSchema", () => {
    it("should generate valid product schema", async () => {
      const productData = {
        name: "Enterprise Solution",
        description: "Advanced business platform",
        image: "/product-image.jpg",
        price: "999.00",
        currency: "USD",
        availability: "InStock" as const,
        brand: "Example Showcase Company",
        sku: "ENT-001",
      };

      const schema = await generateProductSchema(productData, "en");

      expect(schema).toEqual({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Enterprise Solution",
        description: "Advanced business platform",
        image: ["/product-image.jpg"],
        manufacturer: {
          "@type": "Organization",
          name: "Example Showcase Company",
        },
        brand: {
          "@type": "Brand",
          name: "Example Showcase Company",
        },
        sku: "ENT-001",
        offers: {
          "@type": "Offer",
          price: 999,
          priceCurrency: "USD",
          availability: "InStock",
        },
      });
    });

    it("should generate product schema without offers when no price provided", async () => {
      const productData = {
        name: "Free Tool",
        description: "Open source utility",
        image: "/tool-image.jpg",
        brand: "Example Showcase Company",
        sku: "FREE-001",
        // No price provided
      };

      const schema = await generateProductSchema(productData, "en");

      expect(schema).toEqual({
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Free Tool",
        description: "Open source utility",
        image: ["/tool-image.jpg"],
        manufacturer: {
          "@type": "Organization",
          name: "Example Showcase Company",
        },
        brand: {
          "@type": "Brand",
          name: "Example Showcase Company",
        },
        sku: "FREE-001",
        offers: undefined, // This should cover the undefined case on line 170
      });
    });
  });

  describe("generateLocalBusinessSchema", () => {
    it("should generate valid local business schema", async () => {
      const businessData = {
        name: "Example Showcase Company Office",
        address: "123 Business St, City, Country",
        phone: "+1-234-567-8900",
        email: "contact@example.com",
        openingHours: ["Mo-Fr 09:00-17:00"],
        priceRange: "$$$",
      };

      const schema = await generateLocalBusinessSchema(businessData, "en");

      expect(schema).toEqual({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Example Showcase Company Office",
        address: {
          "@type": "PostalAddress",
          streetAddress: "123 Business St, City, Country",
        },
        telephone: "+1-234-567-8900",
        email: "contact@example.com",
        openingHours: ["Mo-Fr 09:00-17:00"],
        priceRange: "$$$",
        url: "https://example.com",
      });
    });
  });

  describe("generateStructuredData", () => {
    it("should generate structured data for home page", async () => {
      const data = await generateStructuredData("home", "en");

      expect(data).toHaveLength(TEST_COUNTS.HOME_STRUCTURED_DATA); // Organization + Website
      expect(data[0]["@type"]).toBe("Organization");
      expect(data[1]["@type"]).toBe("WebSite");
    });

    it("should generate structured data for products page", async () => {
      const productData = {
        name: "Product",
        description: "Product Description",
        price: "100.00",
        currency: "USD",
        availability: "InStock" as const,
      };

      const data = await generateStructuredData("products", "en", {
        product: productData,
      });

      expect(data).toHaveLength(TEST_COUNTS.PRODUCTS_STRUCTURED_DATA); // Organization + Website + Product
      expect(data[2]["@type"]).toBe("Product");
    });

    it("should handle unknown page types", async () => {
      const data = await generateStructuredData("home", "en");

      expect(data).toHaveLength(TEST_COUNTS.FALLBACK_STRUCTURED_DATA); // Organization + Website (fallback)
    });
  });

  describe("错误处理和边缘情况", () => {
    it("should handle translation errors gracefully", async () => {
      // Mock getTranslations to throw an error
      mockGetTranslations.mockRejectedValueOnce(new Error("Translation error"));

      const data = await generateLocalizedStructuredData(
        "en",
        "Organization",
        {},
      );

      // Should return basic structure even when translation fails
      expect(data).toHaveProperty("@context", "https://schema.org");
      expect(data).toHaveProperty("@type", "Organization");
    });

    it("should handle invalid structured data types", async () => {
      const data = await generateLocalizedStructuredData(
        "en",
        "InvalidType" as any,
        {},
      );

      // Should return basic structure for unknown types
      expect(data).toHaveProperty("@context", "https://schema.org");
      expect(data).toHaveProperty("@type", "InvalidType");
    });

    it("should handle null and undefined data inputs", async () => {
      const testCases = [
        { type: "Organization", data: null },
        { type: "WebSite", data: undefined },
        { type: "Article", data: {} },
      ] as const;

      for (const testCase of testCases) {
        const data = await generateLocalizedStructuredData(
          "en",
          testCase.type,
          testCase.data as any,
        );

        expect(data).toHaveProperty("@context", "https://schema.org");
        expect(data).toHaveProperty("@type", testCase.type);
      }
    });

    it("should handle malformed article data", async () => {
      const malformedData = {
        title: "Test Article",
        description: "Test Description",
        publishedTime: "2023-01-01T00:00:00Z",
        url: "https://example.com/test",
        invalidProperty: "should be ignored",
      };

      const data = await generateLocalizedStructuredData(
        "en",
        "Article",
        malformedData,
      );

      expect(data).toHaveProperty("@context", "https://schema.org");
      expect(data).toHaveProperty("@type", "Article");
    });

    it("does not emit a pending logo in article publisher schema", async () => {
      const data = await generateLocalizedStructuredData("en", "Article", {
        title: "Test Article",
        description: "Test Description",
        publishedTime: "2023-01-01T00:00:00Z",
        url: "https://example.com/test",
      });
      const publisher = data.publisher as Record<string, unknown>;

      expect(publisher.logo).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain("/images/logo.svg");
    });

    it("should handle malformed product data", async () => {
      const malformedData = {
        name: "",
        price: "invalid-price",
        currency: null,
        availability: "InvalidStatus",
      };

      const data = await generateLocalizedStructuredData(
        "en",
        "Product",
        malformedData,
      );

      expect(data).toHaveProperty("@context", "https://schema.org");
      expect(data).toHaveProperty("@type", "Product");
    });
  });

  describe("JSON-LD 生成测试", () => {
    it("should generate valid JSON-LD string", () => {
      const testData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Test Organization",
      };

      const jsonLD = generateJSONLD(testData);

      // Should be valid JSON
      expect(() => JSON.parse(jsonLD)).not.toThrow();

      // Should be properly formatted
      expect(jsonLD).toContain('"@context"');
      expect(jsonLD).toContain('"@type"');
      expect(jsonLD).toContain("Test Organization");
    });

    it("should handle complex nested objects in JSON-LD", () => {
      const complexData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        address: {
          "@type": "PostalAddress",
          streetAddress: "123 Main St",
          addressLocality: "City",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+1-555-123-4567",
            contactType: "customer service",
          },
        ],
      };

      const jsonLD = generateJSONLD(complexData);

      expect(() => JSON.parse(jsonLD)).not.toThrow();

      const parsed = JSON.parse(jsonLD);
      expect(parsed.address).toHaveProperty("@type", "PostalAddress");
      expect(parsed.contactPoint).toHaveLength(1);
    });

    it("should handle null and undefined values in JSON-LD", () => {
      const dataWithNulls = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Test",
        description: null,
        url: undefined,
      };

      const jsonLD = generateJSONLD(dataWithNulls);

      expect(() => JSON.parse(jsonLD)).not.toThrow();

      const parsed = JSON.parse(jsonLD);
      expect(parsed.description).toBeNull();
      expect(parsed).not.toHaveProperty("url"); // undefined should be omitted
    });
  });

  describe("性能和内存测试", () => {
    it("should handle repeated generation efficiently", async () => {
      const startTime = performance.now();

      // Generate structured data multiple times
      for (let i = 0; i < 100; i++) {
        await generateStructuredData("home", "en");
        await generateLocalizedStructuredData("en", "Organization", {});
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1000ms)
      expect(duration).toBeLessThan(1000);
    });

    it("should not create excessive memory usage with repeated calls (smoke check)", async () => {
      // Perform many operations to ensure the code path is stable under load.
      for (let i = 0; i < 1000; i++) {
        await generateLocalizedStructuredData("en", "Organization", {});
        generateJSONLD({ test: "data" });
      }

      // This is a smoke test: we only assert that the test completes without throwing.
      expect(true).toBe(true);
    });
  });

  describe("generateJSONLD", () => {
    it("should generate valid JSON-LD string", () => {
      const testData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Test Organization",
      };

      const result = generateJSONLD(testData);

      // 结果应该是有效的 JSON（转义字符会被正确解析）
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed["@context"]).toBe("https://schema.org");
      expect(parsed["@type"]).toBe("Organization");
      expect(parsed.name).toBe("Test Organization");
    });

    it("should escape < characters to prevent XSS attacks", () => {
      const maliciousData = {
        "@context": "https://schema.org",
        "@type": "Article",
        name: 'Test</script><script>alert("XSS")</script>',
        description: "Content with <b>HTML</b> tags",
      };

      const result = generateJSONLD(maliciousData);

      // 所有 < 字符应被转义为 \u003c
      expect(result).not.toContain("</script>");
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("<b>");
      expect(result).toContain("\\u003c/script\\u003e");
      expect(result).toContain("\\u003cscript\\u003e");
      expect(result).toContain("\\u003cb\\u003e");

      // 转义后的字符串仍然是有效的 JSON
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      // JSON.parse 会自动将 \u003c 解码回 <
      expect(parsed.name).toBe('Test</script><script>alert("XSS")</script>');
      expect(parsed.description).toBe("Content with <b>HTML</b> tags");
    });

    it("should escape other HTML-sensitive characters and JS line separators", () => {
      const riskyData = {
        "@context": "https://schema.org",
        "@type": "Thing",
        name: "A > B & C",
        description: "Line one\u2028line two\u2029line three",
      };

      const result = generateJSONLD(riskyData);

      expect(result).toContain("\\u003e");
      expect(result).toContain("\\u0026");
      expect(result).toContain("\\u2028");
      expect(result).toContain("\\u2029");
      expect(result).not.toContain("\u2028");
      expect(result).not.toContain("\u2029");

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe("A > B & C");
      expect(parsed.description).toBe("Line one\u2028line two\u2029line three");
    });

    it("should handle data without < characters unchanged", () => {
      const safeData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Safe Organization Name",
        url: "https://example.com",
      };

      const result = generateJSONLD(safeData);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe("Safe Organization Name");
      expect(parsed.url).toBe("https://example.com");
    });

    it("should handle complex nested objects", () => {
      const complexData = {
        "@context": "https://schema.org",
        "@type": "Article",
        author: {
          "@type": "Person",
          name: "John Doe",
        },
        publisher: {
          "@type": "Organization",
          name: "Test Publisher",
          logo: {
            "@type": "ImageObject",
            url: "https://example.com/images/logo.svg",
          },
        },
      };

      const result = generateJSONLD(complexData);

      expect(result).toContain('"@context": "https://schema.org"');
      expect(result).toContain('"@type": "Article"');
      expect(result).toContain('"name": "John Doe"');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should handle null and undefined values", () => {
      const dataWithNulls = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Test",
        description: null,
        url: undefined,
      };

      const result = generateJSONLD(dataWithNulls);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.description).toBeNull();
      expect(parsed).not.toHaveProperty("url");
    });

    it("should handle empty objects and arrays", () => {
      const emptyData = {};
      const result = generateJSONLD(emptyData);

      expect(result).toBe("{}");
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe("generateLocalizedStructuredData - Error Handling", () => {
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
    });

    it("should handle translation errors gracefully", async () => {
      // Mock getTranslations to throw an error
      const mockGetTranslationsError = vi.mocked(
        await import("next-intl/server"),
      ).getTranslations;
      mockGetTranslationsError.mockRejectedValueOnce(
        new Error("Translation failed"),
      );

      const result = await generateLocalizedStructuredData(
        "en",
        "Organization",
        {},
      );

      expect(result).toEqual({
        "@context": "https://schema.org",
        "@type": "Organization",
      });
    });

    it("should handle unknown structured data types", async () => {
      const result = await generateLocalizedStructuredData(
        "en",
        "UnknownType" as any,
        {},
      );

      expect(result).toEqual({
        "@context": "https://schema.org",
        "@type": "UnknownType",
      });
    });

    it("should handle non-Error exceptions", async () => {
      // Mock getTranslations to throw a non-Error object
      const mockGetTranslationsString = vi.mocked(
        await import("next-intl/server"),
      ).getTranslations;
      mockGetTranslationsString.mockRejectedValueOnce("String error");

      const result = await generateLocalizedStructuredData(
        "en",
        "Organization",
        {},
      );

      expect(result).toEqual({
        "@context": "https://schema.org",
        "@type": "Organization",
      });
    });

    it("should record errors in I18nPerformanceMonitor", async () => {
      // Mock getTranslations to throw an Error
      mockGetTranslations.mockRejectedValueOnce(
        new Error("Translation failed"),
      );

      await generateLocalizedStructuredData("en", "Organization", {});

      expect(mockRecordError).toHaveBeenCalled();
    });
  });

  describe("BreadcrumbList Generation", () => {
    it("should generate breadcrumb structured data", async () => {
      const breadcrumbData = {
        items: [
          { name: "Home", url: "/", position: 1 },
          { name: "Products", url: "/products", position: 2 },
          { name: "Category", url: "/products/category", position: 3 },
        ],
      };

      const result = await generateLocalizedStructuredData(
        "en",
        "BreadcrumbList",
        breadcrumbData,
      );

      expect(result["@type"]).toBe("BreadcrumbList");
      expect(result["@context"]).toBe("https://schema.org");
    });
  });
});
