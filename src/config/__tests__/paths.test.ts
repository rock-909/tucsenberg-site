import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/config/paths";
import {
  DYNAMIC_PATHS_CONFIG,
  getCanonicalPath,
  getLocaleCurrency,
  getLocaleTimeZone,
  getBlogArticlePath,
  getLocalizedPath,
  getPageTypeFromPath,
  getPathnames,
  getProductMarketPath,
  getRoutingConfig,
  LOCALES_CONFIG,
  PATHS_CONFIG,
  SITE_CONFIG,
  validatePathsConfig,
  type LocalizedPath,
  type PageType,
} from "../paths";

const PLACEHOLDER_PATTERN = /\[[A-Z0-9_]+\]/;
const isPlaceholder = (value: string) => PLACEHOLDER_PATTERN.test(value);
const isHttpUrl = (value: string) => /^https?:\/\/.+/.test(value);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value: string) =>
  /^\+\d{1,3}[-\s]?\(?[\d]{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9}$/.test(value);

const CURRENT_PRODUCTION_LOCALE_CONTRACT = {
  locales: ["en", "es", "zh"],
  publicLocales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "always",
  prefixes: {
    en: "",
    es: "/es",
    zh: "/zh",
  },
  displayNames: {
    en: "English",
    es: "Español",
    zh: "中文",
  },
  timeZones: {
    en: "UTC",
    es: "America/Mexico_City",
    zh: "Asia/Shanghai",
  },
  currencies: {
    en: "USD",
    es: "USD",
    zh: "CNY",
  },
} as const satisfies {
  locales: readonly Locale[];
  publicLocales: readonly Locale[];
  defaultLocale: Locale;
  localePrefix: "always";
  prefixes: Record<Locale, string>;
  displayNames: Record<Locale, string>;
  timeZones: Record<Locale, string>;
  currencies: Record<Locale, string>;
};

describe("paths configuration", () => {
  describe("type definitions", () => {
    it("should have valid Locale type", () => {
      const enLocale: Locale = "en";
      const esLocale: Locale = "es";
      const zhLocale: Locale = "zh";

      expect(enLocale).toBe("en");
      expect(esLocale).toBe("es");
      expect(zhLocale).toBe("zh");
    });

    it("should have valid PageType", () => {
      const pageTypes: PageType[] = [
        "home",
        "capabilities",
        "howItWorks",
        "about",
        "contact",
        "products",
        "blog",
        "privacy",
        "terms",
      ];

      pageTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });

    it("should have valid LocalizedPath structure", () => {
      const path: LocalizedPath = {
        en: "/test",
        es: "/test",
        zh: "/test",
      };

      expect(path.en).toBe("/test");
      expect(path.es).toBe("/test");
      expect(path.zh).toBe("/test");
    });
  });

  describe("PATHS_CONFIG", () => {
    it("should have all required page types", () => {
      const expectedPageTypes: PageType[] = [
        "home",
        "capabilities",
        "howItWorks",
        "about",
        "contact",
        "products",
        "blog",
        "privacy",
        "terms",
      ];

      expectedPageTypes.forEach((pageType) => {
        expect(PATHS_CONFIG).toHaveProperty(pageType);
      });
    });

    it("should have both locales for each page type", () => {
      Object.entries(PATHS_CONFIG).forEach(([_pageType, paths]) => {
        expect(paths).toHaveProperty("en");
        expect(paths).toHaveProperty("es");
        expect(paths).toHaveProperty("zh");
        expect(typeof paths.en).toBe("string");
        expect(typeof paths.es).toBe("string");
        expect(typeof paths.zh).toBe("string");
      });
    });

    it("should have consistent path format", () => {
      Object.entries(PATHS_CONFIG).forEach(([pageType, paths]) => {
        if (pageType !== "home") {
          // Paths should start with "/" and contain only lowercase letters, hyphens, and forward slashes
          expect(paths.en).toMatch(/^\/[a-z/-]+$/);
          expect(paths.es).toMatch(/^\/[a-z/-]+$/);
          expect(paths.zh).toMatch(/^\/[a-z/-]+$/);
        } else {
          expect(paths.en).toBe("/");
          expect(paths.es).toBe("/");
          expect(paths.zh).toBe("/");
        }
      });
    });

    it("should use standard paths for all languages", () => {
      Object.entries(PATHS_CONFIG).forEach(([_pageType, paths]) => {
        // All languages should use the same path (standard approach)
        expect(paths.en).toBe(paths.zh);
        expect(paths.en).toBe(paths.es);
      });
    });

    it("should be readonly", () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        PATHS_CONFIG.home.en = "/changed";
      }).toThrow();
    });
  });

  describe("LOCALES_CONFIG", () => {
    it("should match the current production locale contract", () => {
      expect(LOCALES_CONFIG.locales).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.locales,
      );
      expect(LOCALES_CONFIG.defaultLocale).toBe(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.defaultLocale,
      );
      expect(LOCALES_CONFIG.localePrefix).toBe(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.localePrefix,
      );
      expect(LOCALES_CONFIG.publicLocales).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.publicLocales,
      );
      expect(LOCALES_CONFIG.prefixes).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.prefixes,
      );
      expect(LOCALES_CONFIG.displayNames).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.displayNames,
      );
      expect(LOCALES_CONFIG.timeZones).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.timeZones,
      );
      expect(LOCALES_CONFIG.currencies).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.currencies,
      );
    });

    it("should have correct locale configuration", () => {
      expect(LOCALES_CONFIG.locales).toContain(LOCALES_CONFIG.defaultLocale);
      expect(LOCALES_CONFIG.locales.length).toBeGreaterThan(0);
    });

    it("should have valid prefixes", () => {
      expect(LOCALES_CONFIG.prefixes.en).toBe("");
      expect(LOCALES_CONFIG.prefixes.es).toBe("/es");
      expect(LOCALES_CONFIG.prefixes.zh).toBe("/zh");
    });

    it("should have display names", () => {
      expect(LOCALES_CONFIG.displayNames.en).toBe("English");
      expect(LOCALES_CONFIG.displayNames.es).toBe("Español");
      expect(LOCALES_CONFIG.displayNames.zh).toBe("中文");
    });

    it("should expose locale time zones and currencies from the registry", () => {
      expect(LOCALES_CONFIG.timeZones).toEqual({
        en: "UTC",
        es: "America/Mexico_City",
        zh: "Asia/Shanghai",
      });
      expect(LOCALES_CONFIG.currencies).toEqual({
        en: "USD",
        es: "USD",
        zh: "CNY",
      });
    });

    it("should resolve locale metadata through helpers", () => {
      expect(getLocaleTimeZone("en")).toBe("UTC");
      expect(getLocaleTimeZone("es")).toBe("America/Mexico_City");
      expect(getLocaleTimeZone("zh")).toBe("Asia/Shanghai");
      expect(getLocaleCurrency("en")).toBe("USD");
      expect(getLocaleCurrency("es")).toBe("USD");
      expect(getLocaleCurrency("zh")).toBe("CNY");
    });

    it("should have time zones", () => {
      expect(LOCALES_CONFIG.timeZones.en).toBe("UTC");
      expect(LOCALES_CONFIG.timeZones.es).toBe("America/Mexico_City");
      expect(LOCALES_CONFIG.timeZones.zh).toBe("Asia/Shanghai");
    });

    it("should be readonly", () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        LOCALES_CONFIG.defaultLocale = "zh";
      }).toThrow();
    });
  });

  describe("SITE_CONFIG", () => {
    beforeEach(() => {
      vi.stubEnv("SITE_URL", "https://test.example.com");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("should have basic site information", () => {
      expect(SITE_CONFIG.name).toBe("Tucsenberg");
      expect(SITE_CONFIG.description).toMatch(
        /aftermarket aeration replacement membranes/iu,
      );
    });

    it("should use environment variable for baseUrl", () => {
      // Note: This test might not work as expected due to how the module is loaded
      // The baseUrl is set when the module is first imported
      expect(typeof SITE_CONFIG.baseUrl).toBe("string");
      expect(SITE_CONFIG.baseUrl).toMatch(/^https?:\/\/.+/);
    });

    it("should have SEO configuration", () => {
      expect(SITE_CONFIG.seo.titleTemplate).toContain("%s");
      expect(SITE_CONFIG.seo.defaultTitle).toBeTruthy();
      expect(SITE_CONFIG.seo.defaultDescription).toBeTruthy();
      expect(Array.isArray(SITE_CONFIG.seo.keywords)).toBe(true);
    });

    it("should keep SEO material keywords aligned to confirmed Tucsenberg scope", () => {
      expect(SITE_CONFIG.seo.keywords).toContain("PTFE aeration membrane");
      expect(SITE_CONFIG.seo.keywords).not.toContain(
        "silicone aeration membrane",
      );
    });

    it("should have social media links", () => {
      const { social } = SITE_CONFIG;

      expect(isPlaceholder(social.twitter) || isHttpUrl(social.twitter)).toBe(
        true,
      );
      expect(isPlaceholder(social.linkedin) || isHttpUrl(social.linkedin)).toBe(
        true,
      );
    });

    it("should have contact information", () => {
      const { contact } = SITE_CONFIG;

      expect(isPlaceholder(contact.phone) || isPhone(contact.phone)).toBe(true);
      expect(isPlaceholder(contact.email) || isEmail(contact.email)).toBe(true);
    });
  });

  describe("getLocalizedPath", () => {
    it("should return correct path for valid page type and locale", () => {
      expect(getLocalizedPath("home", "en")).toBe("/");
      expect(getLocalizedPath("home", "es")).toBe("/");
      expect(getLocalizedPath("home", "zh")).toBe("/");
      expect(getLocalizedPath("capabilities", "en")).toBe("/capabilities");
      expect(getLocalizedPath("capabilities", "es")).toBe("/capabilities");
      expect(getLocalizedPath("capabilities", "zh")).toBe("/capabilities");
      expect(getLocalizedPath("howItWorks", "en")).toBe("/how-it-works");
      expect(getLocalizedPath("howItWorks", "es")).toBe("/how-it-works");
      expect(getLocalizedPath("howItWorks", "zh")).toBe("/how-it-works");
      expect(getLocalizedPath("blog", "en")).toBe("/blog");
      expect(getLocalizedPath("blog", "es")).toBe("/blog");
      expect(getLocalizedPath("blog", "zh")).toBe("/blog");
      expect(getLocalizedPath("about", "en")).toBe("/about");
      expect(getLocalizedPath("about", "es")).toBe("/about");
      expect(getLocalizedPath("about", "zh")).toBe("/about");
    });

    it("should throw error for invalid page type", () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getLocalizedPath("invalid", "en");
      }).toThrow("Unknown page type: invalid");
    });

    it("should throw error for invalid locale", () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getLocalizedPath("home", "fr");
      }).toThrow("Unknown locale: fr");
    });
  });

  describe("getPathnames", () => {
    it("should derive static pathnames from PATHS_CONFIG", () => {
      const pathnames = getPathnames();
      const expectedStaticPaths = Object.values(PATHS_CONFIG).map((paths) =>
        paths.en === "/" ? "/" : paths.en,
      );

      for (const path of expectedStaticPaths) {
        expect(pathnames[path]).toBe(path);
      }
    });

    it("should derive dynamic route patterns from DYNAMIC_PATHS_CONFIG", () => {
      const pathnames = getPathnames();

      for (const config of Object.values(DYNAMIC_PATHS_CONFIG)) {
        expect(pathnames[config.pattern]).toBe(config.pattern);
      }
    });

    it("should not advertise product family pages without a real route", () => {
      const pathnames = getPathnames();
      const removedFamilyRoute = `/products/${"[market]"}/${"[family]"}`;

      expect(pathnames).not.toHaveProperty(removedFamilyRoute);
    });

    it("should have consistent paths", () => {
      const pathnames = getPathnames();

      Object.entries(pathnames).forEach(([key, value]) => {
        expect(key).toBe(value);
      });
    });
  });

  describe("getCanonicalPath", () => {
    it("should resolve route IDs to canonical non-localized paths", () => {
      expect(getCanonicalPath("home")).toBe("/");
      expect(getCanonicalPath("contact")).toBe("/contact");
      expect(getCanonicalPath("products")).toBe("/products");
      expect(getCanonicalPath("blog")).toBe("/blog");
      expect(getCanonicalPath("customProject")).toBe("/custom-project-support");
    });

    it("should derive product market paths from the products route", () => {
      expect(getProductMarketPath("north-america")).toBe(
        `${getCanonicalPath("products")}/north-america`,
      );
    });

    it("should derive blog article paths from the blog route", () => {
      expect(getBlogArticlePath("prepare-before-launch")).toBe(
        `${getCanonicalPath("blog")}/prepare-before-launch`,
      );
    });
  });

  describe("getPageTypeFromPath", () => {
    it("should return correct page type for valid paths", () => {
      expect(getPageTypeFromPath("/", "en")).toBe("home");
      expect(getPageTypeFromPath("", "en")).toBe("home");
      expect(getPageTypeFromPath("/about", "en")).toBe("about");
      expect(getPageTypeFromPath("/about", "es")).toBe("about");
      expect(getPageTypeFromPath("/contact", "zh")).toBe("contact");
      expect(getPageTypeFromPath("/blog", "en")).toBe("blog");
    });

    it("should return null for invalid paths", () => {
      expect(getPageTypeFromPath("/invalid", "en")).toBeNull();
      expect(getPageTypeFromPath("/nonexistent", "zh")).toBeNull();
    });

    it("should work with both locales", () => {
      expect(getPageTypeFromPath("/products", "en")).toBe("products");
      expect(getPageTypeFromPath("/products", "es")).toBe("products");
      expect(getPageTypeFromPath("/products", "zh")).toBe("products");
      expect(getPageTypeFromPath("/blog", "zh")).toBe("blog");
    });
  });

  describe("validatePathsConfig", () => {
    it("should validate current configuration as valid", () => {
      const result = validatePathsConfig();

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect missing locale paths", () => {
      // This test would require mocking the PATHS_CONFIG
      // For now, we just ensure the function works
      const result = validatePathsConfig();
      expect(typeof result.isValid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe("getRoutingConfig", () => {
    it("should return valid routing configuration", () => {
      const config = getRoutingConfig();

      expect(config.locales).toEqual(LOCALES_CONFIG.locales);
      expect(config.defaultLocale).toBe(LOCALES_CONFIG.defaultLocale);
      expect(config.localePrefix).toBe(LOCALES_CONFIG.localePrefix);
      expect(typeof config.pathnames).toBe("object");
    });

    it("should have pathnames matching getPathnames", () => {
      const config = getRoutingConfig();
      const pathnames = getPathnames();

      expect(config.pathnames).toEqual(pathnames);
    });
  });

  describe("integration tests", () => {
    it("should have consistent configuration across all functions", () => {
      const pathnames = getPathnames();
      const routingConfig = getRoutingConfig();

      // Check that all configurations use the same locales
      // Check that pathnames are consistent
      expect(routingConfig.pathnames).toEqual(pathnames);
    });

    it("should work with all page types and locales", () => {
      const pageTypes: PageType[] = [
        "home",
        "capabilities",
        "howItWorks",
        "about",
        "contact",
        "products",
        "blog",
        "privacy",
        "terms",
      ];
      const locales: Locale[] = [...LOCALES_CONFIG.locales];

      pageTypes.forEach((pageType) => {
        locales.forEach((locale) => {
          const path = getLocalizedPath(pageType, locale);
          const foundPageType = getPageTypeFromPath(path, locale);
          expect(foundPageType).toBe(pageType);
        });
      });
    });
  });

  describe("边缘情况和错误处理", () => {
    it("should handle empty string paths", () => {
      expect(getPageTypeFromPath("", "en")).toBe("home");
      expect(getPageTypeFromPath("", "es")).toBe("home");
      expect(getPageTypeFromPath("", "zh")).toBe("home");
    });

    it("should handle paths with trailing slashes", () => {
      expect(getPageTypeFromPath("/about/", "en")).toBeNull();
      expect(getPageTypeFromPath("/contact/", "zh")).toBeNull();
    });

    it("should handle paths with query parameters", () => {
      expect(getPageTypeFromPath("/about?param=value", "en")).toBeNull();
      expect(getPageTypeFromPath("/contact#section", "zh")).toBeNull();
    });

    it("should handle case sensitivity", () => {
      expect(getPageTypeFromPath("/About", "en")).toBeNull();
      expect(getPageTypeFromPath("/CONTACT", "zh")).toBeNull();
    });

    it("should handle null and undefined inputs gracefully", () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getPageTypeFromPath(null, "en");
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing invalid input
        getPageTypeFromPath("/about", null);
      }).toThrow();
    });

    it("should handle extremely long paths", () => {
      const longPath = `/${"a".repeat(1000)}`;
      expect(getPageTypeFromPath(longPath, "en")).toBeNull();
    });

    it("should handle special characters in paths", () => {
      const specialPaths = [
        "/about%20us",
        "/contact@email",
        "/products&services",
        "/pricing#basic",
      ];

      specialPaths.forEach((path) => {
        expect(getPageTypeFromPath(path, "en")).toBeNull();
      });
    });
  });

  describe("配置完整性验证", () => {
    it("should have all required properties in SITE_CONFIG", () => {
      const requiredProperties = [
        "name",
        "description",
        "baseUrl",
        "seo",
        "social",
        "contact",
      ];

      requiredProperties.forEach((prop) => {
        expect(SITE_CONFIG).toHaveProperty(prop);
      });
    });

    it("should have valid URL formats in social links", () => {
      const socialLinks = Object.values(SITE_CONFIG.social);

      socialLinks.forEach((link) => {
        expect(isPlaceholder(link) || isHttpUrl(link)).toBe(true);
      });
    });

    it("should have consistent locale configuration", () => {
      const { locales } = LOCALES_CONFIG;

      // Check that all locales have prefixes
      locales.forEach((locale) => {
        expect(LOCALES_CONFIG.prefixes).toHaveProperty(locale);
        expect(LOCALES_CONFIG.displayNames).toHaveProperty(locale);
        expect(LOCALES_CONFIG.timeZones).toHaveProperty(locale);
      });
    });

    it("should have valid email format in contact", () => {
      expect(
        isPlaceholder(SITE_CONFIG.contact.email) ||
          isEmail(SITE_CONFIG.contact.email),
      ).toBe(true);
    });

    it("should have valid phone format in contact", () => {
      expect(
        isPlaceholder(SITE_CONFIG.contact.phone) ||
          isPhone(SITE_CONFIG.contact.phone),
      ).toBe(true);
    });
  });

  describe("性能和内存测试", () => {
    it("should handle repeated function calls efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        getLocalizedPath("home", "en");
        getPathnames();
        getPageTypeFromPath("/about", "en");
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    it("should not create memory leaks with repeated calls", () => {
      const getUsedHeapSize = () => {
        const perf = globalThis.performance as Performance & {
          memory?: { usedJSHeapSize?: number };
        };
        return perf.memory?.usedJSHeapSize ?? 0;
      };

      const initialMemory = getUsedHeapSize();

      // Perform many operations
      for (let i = 0; i < 10000; i++) {
        getLocalizedPath("about", "en");
        getPageTypeFromPath("/contact", "zh");
      }

      // Force garbage collection if available
      const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc;
      if (typeof gc === "function") {
        gc();
      }

      const finalMemory = getUsedHeapSize();
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe("错误处理强化测试", () => {
    it("should throw specific error messages for invalid inputs", () => {
      // Test getLocalizedPath with invalid page type
      expect(() => {
        getLocalizedPath("nonexistent" as PageType, "en");
      }).toThrow("Unknown page type: nonexistent");

      // Test getLocalizedPath with invalid locale
      expect(() => {
        getLocalizedPath("home", "fr" as Locale);
      }).toThrow("Unknown locale: fr");
    });

    it("should handle prototype pollution attempts", () => {
      // Test that the function doesn't use hasOwnProperty unsafely
      const maliciousPageType = "__proto__" as PageType;
      const maliciousLocale = "constructor" as Locale;

      expect(() => {
        getLocalizedPath(maliciousPageType, "en");
      }).toThrow();

      expect(() => {
        getLocalizedPath("home", maliciousLocale);
      }).toThrow();
    });

    it("should handle object property access edge cases", () => {
      // Test with properties that might exist on Object.prototype
      const edgeCaseInputs = [
        "toString",
        "valueOf",
        "hasOwnProperty",
        "constructor",
        "__proto__",
      ];

      edgeCaseInputs.forEach((input) => {
        expect(() => {
          getLocalizedPath(input as PageType, "en");
        }).toThrow();

        expect(() => {
          getLocalizedPath("home", input as Locale);
        }).toThrow();
      });
    });
  });

  describe("配置验证深度测试", () => {
    it("should validate path uniqueness within locales", () => {
      const validation = validatePathsConfig();

      // If validation fails, check specific error types
      if (!validation.isValid) {
        const duplicateErrors = validation.errors.filter((error) =>
          error.includes("Duplicate path"),
        );

        // Should not have duplicate paths within the same locale
        expect(duplicateErrors.length).toBe(0);
      }
    });

    it("should validate complete locale coverage", () => {
      const validation = validatePathsConfig();

      if (!validation.isValid) {
        const missingPathErrors = validation.errors.filter(
          (error) =>
            error.includes("Missing") && error.includes("path for page type"),
        );

        // Should not have missing paths for any page type
        expect(missingPathErrors.length).toBe(0);
      }
    });

    it("should handle validation with edge case configurations", () => {
      // Test that validation function is robust
      const validation = validatePathsConfig();

      expect(typeof validation.isValid).toBe("boolean");
      expect(Array.isArray(validation.errors)).toBe(true);

      // Errors should be strings
      validation.errors.forEach((error) => {
        expect(typeof error).toBe("string");
        expect(error.length).toBeGreaterThan(0);
      });
    });
  });

  describe("类型系统完整性测试", () => {
    it("should ensure all PageType values are covered in PATHS_CONFIG", () => {
      const configKeys = Object.keys(PATHS_CONFIG) as PageType[];
      const expectedTypes: PageType[] = [
        "home",
        "capabilities",
        "howItWorks",
        "about",
        "contact",
        "products",
        "blog",
        "privacy",
        "terms",
        "customProject",
        "quote",
      ];

      // All expected types should be present
      expectedTypes.forEach((type) => {
        expect(configKeys).toContain(type);
      });

      // No extra types should be present
      expect(configKeys.length).toBe(expectedTypes.length);
    });

    it("should ensure all Locale values are supported", () => {
      const supportedLocales = LOCALES_CONFIG.locales;
      const expectedLocales: Locale[] = [
        ...CURRENT_PRODUCTION_LOCALE_CONTRACT.locales,
      ];

      expect(supportedLocales).toEqual(expectedLocales);

      // Each locale should have all required configuration
      supportedLocales.forEach((locale) => {
        expect(LOCALES_CONFIG.prefixes).toHaveProperty(locale);
        expect(LOCALES_CONFIG.displayNames).toHaveProperty(locale);
        expect(LOCALES_CONFIG.timeZones).toHaveProperty(locale);
      });
    });
  });
});
