import { describe, expect, it } from "vitest";
import type { Locale } from "@/config/paths";
import {
  DYNAMIC_PATHS_CONFIG,
  getCanonicalPath,
  getLocaleCurrency,
  getLocaleTimeZone,
  getLocalizedPath,
  getPageTypeFromPath,
  getPathnames,
  getProductMarketPath,
  LOCALES_CONFIG,
  PATHS_CONFIG,
  SITE_CONFIG,
  validatePathsConfig,
  type PageType,
} from "../paths";

/**
 * 这个文件 2026-07-29 从 57 条收到 30 条。删掉的分三类：
 *
 * 1. TypeScript 已经保证的：`const enLocale: Locale = "en"` 然后断言它等于 "en"、
 *    对字面量数组逐项 `typeof === "string"`、`toHaveProperty` 一串编译期就固定的
 *    字段、`Object.freeze` 会不会抛。
 * 2. 自认无效的：三条测试的注释自己写着「would require mocking」「might not work
 *    as expected」，函数体只剩 `typeof` 和 `isArray`；还有两条的断言包在
 *    `if (!validation.isValid)` 里，而当前配置恒 valid，函数体一条都不跑。
 * 3. 文件内重复：`en: "UTC"` 被断言了三次，社交链接和联系方式各两次，
 *    `getRoutingConfig()` 逐字段等于 `LOCALES_CONFIG`（那个函数就是原样透传）。
 *
 * 留下的是有业务语义的：canonical 路径、locale 合约、SEO 可索引性、公开 URL 安全、
 * 原型污染，以及 PageType 穷尽性——新增页面漏配路径会被它抓到。
 */

const PLACEHOLDER_PATTERN = /\[[A-Z0-9_]+\]/;
const isPlaceholder = (value: string) => PLACEHOLDER_PATTERN.test(value);
const isHttpUrl = (value: string) => /^https?:\/\/.+/.test(value);
const isOptionalUrl = (value: string) => value === "" || isHttpUrl(value);
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value: string) =>
  /^\+\d{1,3}[-\s]?\(?[\d]{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9}$/.test(value);
const isOptionalPhone = (value: string) => value === "" || isPhone(value);
const isOwnerTodo = (value: string) => value === "TODO-OWNER";

const CURRENT_PRODUCTION_LOCALE_CONTRACT = {
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "never",
  timeZones: {
    en: "UTC",
  },
  currencies: {
    en: "USD",
  },
} as const satisfies {
  locales: readonly Locale[];
  defaultLocale: Locale;
  localePrefix: "never";
  timeZones: Record<Locale, string>;
  currencies: Record<Locale, string>;
};

const EXPECTED_STATIC_PAGE_TYPES = [
  "home",
  "about",
  "products",
  "oemWholesale",
  "materialsGuide",
  "specificationsGuide",
  "requestQuote",
  "contact",
  "warranty",
  "privacy",
  "terms",
] as const satisfies readonly PageType[];

describe("paths configuration", () => {
  describe("PATHS_CONFIG", () => {
    // 大小写和连字符不是风格问题：混进大写或下划线的 URL 会被搜索引擎当成另一个页面。
    it("keeps every path lowercase and hyphenated", () => {
      Object.entries(PATHS_CONFIG).forEach(([pageType, paths]) => {
        if (pageType !== "home") {
          expect(paths.en).toMatch(/^\/[a-z/-]+$/);
        } else {
          expect(paths.en).toBe("/");
        }
      });
    });

    it("exposes only the configured locale", () => {
      Object.entries(PATHS_CONFIG).forEach(([_pageType, paths]) => {
        expect(Object.keys(paths)).toEqual(["en"]);
      });
    });
  });

  describe("LOCALES_CONFIG", () => {
    it("matches the current production locale contract", () => {
      expect(LOCALES_CONFIG.locales).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.locales,
      );
      expect(LOCALES_CONFIG.defaultLocale).toBe(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.defaultLocale,
      );
      expect(LOCALES_CONFIG.localePrefix).toBe(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.localePrefix,
      );
      expect(LOCALES_CONFIG.timeZones).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.timeZones,
      );
      expect(LOCALES_CONFIG.currencies).toEqual(
        CURRENT_PRODUCTION_LOCALE_CONTRACT.currencies,
      );
    });

    // zh 是退役 locale，middleware 对 /zh 直接 404。它留在这里是为了让退役这件事
    // 有单一真源，不是为了将来还能开回来。
    it("keeps zh recorded as retired rather than absent", () => {
      expect(LOCALES_CONFIG.retiredLocales).toEqual(["zh"]);
    });

    it("resolves locale metadata through helpers", () => {
      expect(getLocaleTimeZone("en")).toBe("UTC");
      expect(getLocaleCurrency("en")).toBe("USD");
    });
  });

  describe("SITE_CONFIG", () => {
    it("carries the brand facts pages render", () => {
      expect(SITE_CONFIG.name).toBe("Tucsenberg");
      expect(SITE_CONFIG.description).toMatch(/flood barrier/iu);
    });

    it("keeps a usable SEO title template", () => {
      expect(SITE_CONFIG.seo.titleTemplate).toContain("%s");
      expect(SITE_CONFIG.seo.defaultTitle).toBeTruthy();
      expect(SITE_CONFIG.seo.defaultDescription).toBeTruthy();
      expect(Array.isArray(SITE_CONFIG.seo.defaultDescription)).toBe(false);
      expect(SITE_CONFIG.seo.defaultDescription.length).toBeGreaterThan(0);
    });

    // 占位符是允许的，半成品 URL 不是：footer 会把这些值直接渲染成链接。
    it("only ships social links that are placeholders or real URLs", () => {
      Object.values(SITE_CONFIG.social).forEach((link) => {
        expect(isPlaceholder(link) || isOptionalUrl(link)).toBe(true);
      });
    });

    it("only ships contact details that are placeholders or well-formed", () => {
      const { contact } = SITE_CONFIG;

      expect(
        isPlaceholder(contact.phone) ||
          isOwnerTodo(contact.phone) ||
          isOptionalPhone(contact.phone),
      ).toBe(true);
      expect(isPlaceholder(contact.email) || isEmail(contact.email)).toBe(true);
    });
  });

  describe("getLocalizedPath", () => {
    it("returns the canonical path for each page type", () => {
      expect(getLocalizedPath("home", "en")).toBe("/");
      expect(getLocalizedPath("products", "en")).toBe("/products");
      expect(getLocalizedPath("oemWholesale", "en")).toBe("/oem-wholesale");
      expect(getLocalizedPath("materialsGuide", "en")).toBe(
        "/guides/flood-barrier-materials-guide",
      );
      expect(getLocalizedPath("specificationsGuide", "en")).toBe(
        "/guides/flood-barrier-specifications",
      );
      expect(getLocalizedPath("requestQuote", "en")).toBe("/request-quote");
      expect(getLocalizedPath("about", "en")).toBe("/about");
    });

    it("throws a named error for an unknown page type", () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getLocalizedPath("invalid", "en");
      }).toThrow("Unknown page type: invalid");
    });

    it("throws a named error for an unknown locale", () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getLocalizedPath("home", "fr");
      }).toThrow("Unknown locale: fr");
    });

    // 用 Object.prototype 上的名字当 key，必须走 throw 分支而不是取到继承来的值。
    it("refuses prototype keys instead of resolving them", () => {
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

  describe("getPathnames", () => {
    it("derives static pathnames from PATHS_CONFIG", () => {
      const pathnames = getPathnames();
      const expectedStaticPaths = Object.values(PATHS_CONFIG).map((paths) =>
        paths.en === "/" ? "/" : paths.en,
      );

      for (const path of expectedStaticPaths) {
        expect(pathnames[path]).toBe(path);
      }
    });

    it("derives dynamic route patterns from DYNAMIC_PATHS_CONFIG", () => {
      const pathnames = getPathnames();

      for (const config of Object.values(DYNAMIC_PATHS_CONFIG)) {
        expect(pathnames[config.pattern]).toBe(config.pattern);
      }
    });

    it("does not advertise product family pages without a real route", () => {
      const pathnames = getPathnames();
      const removedFamilyRoute = `/products/${"[market]"}/${"[family]"}`;

      expect(pathnames).not.toHaveProperty(removedFamilyRoute);
    });
  });

  describe("getCanonicalPath", () => {
    it("resolves route IDs to canonical non-localized paths", () => {
      expect(getCanonicalPath("home")).toBe("/");
      expect(getCanonicalPath("contact")).toBe("/contact");
      expect(getCanonicalPath("products")).toBe("/products");
      expect(getCanonicalPath("oemWholesale")).toBe("/oem-wholesale");
      expect(getCanonicalPath("requestQuote")).toBe("/request-quote");
    });

    it("derives product market paths from the products route", () => {
      expect(getProductMarketPath("abs-flood-barriers")).toBe(
        `${getCanonicalPath("products")}/abs-flood-barriers`,
      );
    });
  });

  describe("getPageTypeFromPath", () => {
    it("maps every live path back to its page type", () => {
      expect(getPageTypeFromPath("/", "en")).toBe("home");
      expect(getPageTypeFromPath("", "en")).toBe("home");
      expect(getPageTypeFromPath("/about", "en")).toBe("about");
      expect(getPageTypeFromPath("/contact", "en")).toBe("contact");
      expect(getPageTypeFromPath("/request-quote", "en")).toBe("requestQuote");
      expect(getPageTypeFromPath("/products", "en")).toBe("products");
      expect(getPageTypeFromPath("/warranty", "en")).toBe("warranty");
    });

    it("returns null for paths that do not exist", () => {
      expect(getPageTypeFromPath("/invalid", "en")).toBeNull();
      expect(getPageTypeFromPath("/nonexistent", "en")).toBeNull();
    });

    // 下面四条都是同一个意图：只有精确匹配算数。近似形式解析成真页面会让
    // canonical 标签和 sitemap 指向一个并不存在的 URL。
    it("treats a trailing slash as a different path", () => {
      expect(getPageTypeFromPath("/about/", "en")).toBeNull();
      expect(getPageTypeFromPath("/contact/", "en")).toBeNull();
    });

    it("treats query strings and hashes as part of the path", () => {
      expect(getPageTypeFromPath("/about?param=value", "en")).toBeNull();
      expect(getPageTypeFromPath("/contact#section", "en")).toBeNull();
    });

    it("stays case sensitive", () => {
      expect(getPageTypeFromPath("/About", "en")).toBeNull();
      expect(getPageTypeFromPath("/CONTACT", "en")).toBeNull();
    });

    it("rejects percent-encoded and punctuation-bearing lookalikes", () => {
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

    it("throws rather than guessing on null input", () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        getPageTypeFromPath(null, "en");
      }).toThrow();

      expect(() => {
        // @ts-expect-error - Testing invalid input
        getPageTypeFromPath("/about", null);
      }).toThrow();
    });

    it("does not choke on an extremely long path", () => {
      const longPath = `/${"a".repeat(1000)}`;
      expect(getPageTypeFromPath(longPath, "en")).toBeNull();
    });
  });

  describe("validatePathsConfig", () => {
    it("reports the shipped configuration as valid", () => {
      const result = validatePathsConfig();

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("configuration integrity", () => {
    it("round-trips every page type through path and back", () => {
      const pageTypes: PageType[] = [...EXPECTED_STATIC_PAGE_TYPES];
      const locales: Locale[] = [...LOCALES_CONFIG.locales];

      pageTypes.forEach((pageType) => {
        locales.forEach((locale) => {
          const path = getLocalizedPath(pageType, locale);
          const foundPageType = getPageTypeFromPath(path, locale);
          expect(foundPageType).toBe(pageType);
        });
      });
    });

    // 穷尽性：加了新页面却忘了配路径，或者配了路径却没登记页面类型，都在这里红。
    it("covers every PageType and nothing more", () => {
      const configKeys = Object.keys(PATHS_CONFIG) as PageType[];
      const expectedTypes: PageType[] = [...EXPECTED_STATIC_PAGE_TYPES];

      expectedTypes.forEach((type) => {
        expect(configKeys).toContain(type);
      });

      expect(configKeys.length).toBe(expectedTypes.length);
    });

    it("gives every supported locale runtime registry coverage", () => {
      LOCALES_CONFIG.locales.forEach((locale) => {
        expect(LOCALES_CONFIG.timeZones).toHaveProperty(locale);
        expect(LOCALES_CONFIG.currencies).toHaveProperty(locale);
      });
    });
  });
});
