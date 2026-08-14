import { describe, expect, it } from "vitest";
import type { Locale } from "@/config/paths";
import {
  getCanonicalPath,
  getLocaleCurrency,
  getLocaleTimeZone,
  getLocalizedPath,
  getPageTypeFromPath,
  getProductMarketPath,
  LOCALES_CONFIG,
  PATHS_CONFIG,
  type PageType,
} from "../paths";

/**
 * 这个文件 2026-07-29 从 57 条收到 30 条。删掉的分三类：
 *
 * 1. TypeScript 已经保证的：`const enLocale: Locale = "en"` 然后断言它等于 "en"、
 *    对字面量数组逐项 `typeof === "string"`、`toHaveProperty` 一串编译期就固定的
 *    字段。注意「运行时冻结」不在此列：`LocalizedPath.en` 在类型层不是 readonly，
 *    真正拦住写入的是 `Object.freeze`，所以那两条留下来了，只是改成直接断言冻结
 *    合同，不再靠给全局配置赋值来试。
 * 2. 自认无效的：三条测试的注释自己写着「would require mocking」「might not work
 *    as expected」，函数体只剩 `typeof` 和 `isArray`；还有两条的断言包在
 *    `if (!validation.isValid)` 里，而当前配置恒 valid，函数体一条都不跑。
 * 3. 文件内重复：`en: "UTC"` 被断言了三次，社交链接和联系方式各两次。
 *
 * 另有两个函数连同它们的测试一起退役：`getRoutingConfig()` 和
 * `validatePathsConfig()` 在生产代码里一个调用者都没有，只被两处再导出。给没人调
 * 的函数留测试，等于把「实现可以被掏空成一句 return」这件事写进绿灯里。
 *
 * 留下的是有业务语义的：canonical 路径、locale 合约、SEO 可索引性、公开 URL 安全、
 * 原型污染，以及 PageType 穷尽性——新增页面漏配路径会被它抓到。
 */

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

    // `PATHNAMES` 在模块加载时就把路径表缓存下来了，而 `getLocalizedPath()` 每次
    // 都现读 `PATHS_CONFIG`。少一个 Object.freeze，运行时改掉一条路径就会让路由表、
    // canonical 和导航链接各说各的。类型层拦不住这件事：`LocalizedPath.en` 不是
    // readonly。
    it("freezes every path entry against runtime mutation", () => {
      expect(Object.isFrozen(PATHS_CONFIG)).toBe(true);
      Object.values(PATHS_CONFIG).forEach((paths) => {
        expect(Object.isFrozen(paths)).toBe(true);
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

    it("resolves locale metadata through helpers", () => {
      expect(getLocaleTimeZone("en")).toBe("UTC");
      expect(getLocaleCurrency("en")).toBe("USD");
    });

    it("freezes the locale registry against runtime mutation", () => {
      expect(Object.isFrozen(LOCALES_CONFIG)).toBe(true);
      expect(Object.isFrozen(LOCALES_CONFIG.locales)).toBe(true);
      expect(Object.isFrozen(LOCALES_CONFIG.timeZones)).toBe(true);
      expect(Object.isFrozen(LOCALES_CONFIG.currencies)).toBe(true);
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
  });
});
