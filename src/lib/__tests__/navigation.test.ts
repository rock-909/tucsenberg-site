import { describe, expect, it, vi } from "vitest";
import {
  TEST_COUNT_CONSTANTS,
  TEST_SCREEN_CONSTANTS,
  TEST_TIMEOUT_CONSTANTS,
} from "@/test/constants/test-constants";
import {
  getLocalizedHref,
  isActivePath,
  mainNavigation,
  mobileNavigation,
  NAVIGATION_ANIMATIONS,
  NAVIGATION_ARIA,
  NAVIGATION_BREAKPOINTS,
  type NavigationItem,
} from "../navigation";
import { SINGLE_SITE_NAVIGATION } from "@/config/single-site-navigation";

// Use vi.hoisted to ensure proper mock setup
const { mockLocalesConfig } = vi.hoisted(() => ({
  mockLocalesConfig: {
    locales: ["en", "es", "zh"],
    publicLocales: ["en", "es"],
    defaultLocale: "en",
  },
}));

// Mock the locale config module used by the client-safe navigation helpers.
vi.mock("@/config/paths/locales-config", () => ({
  LOCALES_CONFIG: mockLocalesConfig,
}));

describe("navigation", () => {
  describe("NavigationItem interface", () => {
    it("should have valid NavigationItem structure", () => {
      const item: NavigationItem = {
        key: "test",
        href: "/test",
        translationKey: "nav.test",
        icon: "test-icon",
        external: true,
        children: [],
      };

      expect(item.key).toBe("test");
      expect(item.href).toBe("/test");
      expect(item.translationKey).toBe("nav.test");
      expect(item.icon).toBe("test-icon");
      expect(item.external).toBe(true);
      expect(Array.isArray(item.children)).toBe(true);
    });
  });

  describe("mainNavigation", () => {
    it("should forward the canonical single-site navigation source", () => {
      expect(mainNavigation).toBe(SINGLE_SITE_NAVIGATION);
    });

    it("should match the Tucsenberg Step 4 navigation order", () => {
      expect(mainNavigation).toEqual([
        {
          key: "membranes",
          href: "/membranes/tuc-d9-epdm",
          translationKey: "navigation.membranes",
        },
        {
          key: "compatibility",
          href: "/compatible/sanitaire",
          translationKey: "navigation.compatibility",
        },
        {
          key: "materials",
          href: "#coming-soon",
          translationKey: "navigation.materials",
        },
        {
          key: "quote",
          href: "/quote",
          translationKey: "navigation.quote",
        },
      ]);
    });

    it("should keep starter pages out of the main navigation", () => {
      const actualKeys = mainNavigation.map((item) => item.key);

      expect(actualKeys).not.toContain("capabilities");
      expect(actualKeys).not.toContain("howItWorks");
      expect(actualKeys).not.toContain("customProject");
      expect(actualKeys).not.toContain("contact");
      expect(actualKeys).not.toContain("products");
      expect(actualKeys).not.toContain("blog");
      expect(actualKeys).not.toContain("about");
      expect(actualKeys).not.toContain("privacy");
    });

    it("should have valid structure for all items", () => {
      mainNavigation.forEach((item) => {
        expect(item.key).toBeTruthy();
        expect(item.href).toBeTruthy();
        expect(item.translationKey).toBeTruthy();
        expect(item.href).toMatch(/^(\/|#coming-soon$)/);
        expect(item.translationKey).toMatch(/^navigation\./);
      });
    });

    it("should point the quote item at the quote route", () => {
      const quoteItem = mainNavigation.find((item) => item.key === "quote");
      expect(quoteItem).toBeDefined();
      expect(quoteItem!.href).toBe("/quote");
    });

    it("should have unique keys", () => {
      const keys = mainNavigation.map((item) => item.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it("should wire hrefs to the Step 4 routes with materials still pending", () => {
      expect(mainNavigation.map((item) => item.href)).toEqual([
        "/membranes/tuc-d9-epdm",
        "/compatible/sanitaire",
        "#coming-soon",
        "/quote",
      ]);
    });
  });

  describe("mobileNavigation", () => {
    it("should be the same as mainNavigation", () => {
      expect(mobileNavigation).toBe(mainNavigation);
    });
  });

  describe("isActivePath", () => {
    it("should return true for exact root path match", () => {
      expect(isActivePath("/", "/")).toBe(true);
      expect(isActivePath("/en", "/")).toBe(true);
      expect(isActivePath("/zh", "/")).toBe(true);
    });

    it("should return false for root path when current path is not root", () => {
      expect(isActivePath("/about", "/")).toBe(false);
      expect(isActivePath("/en/about", "/")).toBe(false);
      expect(isActivePath("/zh/products", "/")).toBe(false);
    });

    it("should return true for matching paths", () => {
      expect(isActivePath("/about", "/about")).toBe(true);
      expect(isActivePath("/en/about", "/about")).toBe(true);
      expect(isActivePath("/zh/about", "/about")).toBe(true);
    });

    it("should return true for sub-paths", () => {
      expect(isActivePath("/about/team", "/about")).toBe(true);
      expect(isActivePath("/en/about/team", "/about")).toBe(true);
      expect(isActivePath("/zh/products/enterprise", "/products")).toBe(true);
    });

    it("should return false for non-matching paths", () => {
      expect(isActivePath("/about", "/products")).toBe(false);
      expect(isActivePath("/en/about", "/products")).toBe(false);
      expect(isActivePath("/zh/services", "/products")).toBe(false);
    });

    it("should handle paths with trailing slashes", () => {
      expect(isActivePath("/about/", "/about")).toBe(true);
      expect(isActivePath("/en/about/", "/about")).toBe(true);
    });

    it("should handle edge cases", () => {
      expect(isActivePath("", "/")).toBe(true);
      expect(isActivePath("/en", "/")).toBe(true);
      expect(isActivePath("/zh", "/")).toBe(true);
    });

    it("should not match partial path segments", () => {
      expect(isActivePath("/aboutus", "/about")).toBe(false);
      expect(isActivePath("/en/aboutus", "/about")).toBe(false);
    });

    it("should handle item paths that already end with slash", () => {
      // This test covers line 85 where cleanItemPath already ends with '/'
      expect(isActivePath("/about/team", "/about/")).toBe(true);
      expect(isActivePath("/en/about/team", "/about/")).toBe(true);
      expect(isActivePath("/zh/products/enterprise", "/products/")).toBe(true);
    });
  });

  describe("getLocalizedHref", () => {
    it("should return external URLs unchanged", () => {
      expect(getLocalizedHref("https://example.com", "en")).toBe(
        "https://example.com",
      );
      expect(getLocalizedHref("http://example.com", "zh")).toBe(
        "http://example.com",
      );
    });

    it("should return mailto links unchanged", () => {
      expect(getLocalizedHref("mailto:test@example.com", "en")).toBe(
        "mailto:test@example.com",
      );
    });

    it("should return tel links unchanged", () => {
      expect(getLocalizedHref("tel:+1234567890", "en")).toBe("tel:+1234567890");
    });

    it("should localize root path", () => {
      expect(getLocalizedHref("/", "en")).toBe("/en");
      expect(getLocalizedHref("/", "es")).toBe("/es");
      expect(getLocalizedHref("/", "zh")).toBe("/zh");
    });

    it("should localize internal paths", () => {
      expect(getLocalizedHref("/about", "en")).toBe("/en/about");
      expect(getLocalizedHref("/about", "es")).toBe("/es/about");
      expect(getLocalizedHref("/about", "zh")).toBe("/zh/about");
      expect(getLocalizedHref("/products/enterprise", "en")).toBe(
        "/en/products/enterprise",
      );
    });

    it("should handle paths with query parameters", () => {
      expect(getLocalizedHref("/search?q=test", "en")).toBe(
        "/en/search?q=test",
      );
      expect(getLocalizedHref("/products?category=web", "zh")).toBe(
        "/zh/products?category=web",
      );
    });

    it("should handle paths with hash fragments", () => {
      expect(getLocalizedHref("/about#team", "en")).toBe("/en/about#team");
      expect(getLocalizedHref("/docs#installation", "zh")).toBe(
        "/zh/docs#installation",
      );
    });

    it("should keep same-page anchor placeholders unchanged", () => {
      expect(getLocalizedHref("#coming-soon", "en")).toBe("#coming-soon");
      expect(getLocalizedHref("#coming-soon", "zh")).toBe("#coming-soon");
    });
  });

  describe("NAVIGATION_BREAKPOINTS", () => {
    it("should have all required breakpoints", () => {
      expect(NAVIGATION_BREAKPOINTS.mobile).toBe(
        TEST_SCREEN_CONSTANTS.MOBILE_WIDTH,
      );
      expect(NAVIGATION_BREAKPOINTS.tablet).toBe(
        TEST_SCREEN_CONSTANTS.TABLET_WIDTH,
      );
      expect(NAVIGATION_BREAKPOINTS.desktop).toBe(
        TEST_SCREEN_CONSTANTS.DESKTOP_WIDTH,
      );
    });

    it("should have ascending breakpoint values", () => {
      expect(NAVIGATION_BREAKPOINTS.mobile).toBeLessThan(
        NAVIGATION_BREAKPOINTS.tablet,
      );
      expect(NAVIGATION_BREAKPOINTS.tablet).toBeLessThan(
        NAVIGATION_BREAKPOINTS.desktop,
      );
    });

    it("should be readonly", () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        NAVIGATION_BREAKPOINTS.mobile = 500;
      }).toThrow();
    });
  });

  describe("NAVIGATION_ANIMATIONS", () => {
    it("should have all required animation durations", () => {
      expect(NAVIGATION_ANIMATIONS.mobileMenuToggle).toBe(
        TEST_TIMEOUT_CONSTANTS.MEDIUM_DELAY,
      );
      expect(NAVIGATION_ANIMATIONS.dropdownFade).toBe(
        TEST_TIMEOUT_CONSTANTS.SHORT_DELAY,
      );
      expect(NAVIGATION_ANIMATIONS.hoverTransition).toBe(100);
    });

    it("should have reasonable duration values", () => {
      Object.values(NAVIGATION_ANIMATIONS).forEach((duration) => {
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThan(1000); // Should be under 1 second
      });
    });

    it("should be readonly", () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        NAVIGATION_ANIMATIONS.mobileMenuToggle = 500;
      }).toThrow();
    });
  });

  describe("NAVIGATION_ARIA", () => {
    it("should have all required ARIA labels", () => {
      expect(NAVIGATION_ARIA.mainNav).toBe("Main navigation");
      expect(NAVIGATION_ARIA.mobileMenuButton).toBe("Toggle mobile menu");
      expect(NAVIGATION_ARIA.mobileMenu).toBe("Mobile navigation menu");
      expect(NAVIGATION_ARIA.languageSelector).toBe("Language selector");
      expect(NAVIGATION_ARIA.themeSelector).toBe("Theme selector");
      expect(NAVIGATION_ARIA.skipToContent).toBe("Skip to main content");
    });

    it("should have descriptive labels", () => {
      Object.values(NAVIGATION_ARIA).forEach((label) => {
        expect(label.length).toBeGreaterThan(TEST_COUNT_CONSTANTS.MEDIUM);
        expect(label).toMatch(/^[A-Z]/); // Should start with capital letter
      });
    });

    it("should be readonly", () => {
      expect(() => {
        // @ts-expect-error - Testing readonly property
        NAVIGATION_ARIA.mainNav = "Changed";
      }).toThrow();
    });
  });

  describe("integration tests", () => {
    it("should work with the real Step 4 navigation items", () => {
      const quoteItem = mainNavigation.find((item) => item.key === "quote");
      expect(quoteItem).toBeDefined();

      const localizedHref = getLocalizedHref(quoteItem!.href, "en");
      expect(localizedHref).toBe("/en/quote");

      expect(quoteItem!.translationKey).toBe("navigation.quote");
    });

    it("should handle all navigation items correctly", () => {
      mainNavigation.forEach((item) => {
        // Test localization
        const enHref = getLocalizedHref(item.href, "en");
        const zhHref = getLocalizedHref(item.href, "zh");

        if (item.href === "#coming-soon") {
          expect(enHref).toBe("#coming-soon");
          expect(zhHref).toBe("#coming-soon");
        } else {
          expect(enHref).toBe(`/en${item.href}`);
          expect(zhHref).toBe(`/zh${item.href}`);
        }
      });
    });
  });
});
