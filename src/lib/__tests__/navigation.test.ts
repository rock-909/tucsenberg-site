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
import {
  getSingleSiteNavigation,
  SINGLE_SITE_NAVIGATION,
} from "@/config/single-site-navigation";
import { SOURCE_RUNTIME_MESSAGE_PROFILE_ID } from "@/config/active-starter-profile";
import { DEFAULT_STARTER_PROFILE_ID } from "@/config/starter-profiles";

// Use vi.hoisted to ensure proper mock setup
const { mockLocalesConfig } = vi.hoisted(() => ({
  mockLocalesConfig: {
    locales: ["en"],
    defaultLocale: "en",
    localePrefix: "never",
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

    it("should use the source runtime profile for singleton navigation", () => {
      expect(SOURCE_RUNTIME_MESSAGE_PROFILE_ID).toBe("catalog");
      expect(SINGLE_SITE_NAVIGATION).toEqual(
        getSingleSiteNavigation(SOURCE_RUNTIME_MESSAGE_PROFILE_ID),
      );
      expect(mainNavigation).toEqual([
        { key: "home", href: "/", translationKey: "navigation.home" },
        {
          key: "products",
          href: "/products",
          translationKey: "navigation.products",
        },
        {
          key: "oemWholesale",
          href: "/oem-wholesale",
          translationKey: "navigation.oemWholesale",
        },
        {
          key: "materialsGuide",
          href: "/guides/flood-barrier-materials-guide",
          translationKey: "navigation.guides",
        },
        { key: "about", href: "/about", translationKey: "navigation.about" },
      ]);
    });

    it("can derive the default materialized catalog navigation explicitly", () => {
      expect(DEFAULT_STARTER_PROFILE_ID).toBe("catalog");
      expect(getSingleSiteNavigation(DEFAULT_STARTER_PROFILE_ID)).toEqual([
        { key: "home", href: "/", translationKey: "navigation.home" },
        {
          key: "products",
          href: "/products",
          translationKey: "navigation.products",
        },
        {
          key: "oemWholesale",
          href: "/oem-wholesale",
          translationKey: "navigation.oemWholesale",
        },
        {
          key: "materialsGuide",
          href: "/guides/flood-barrier-materials-guide",
          translationKey: "navigation.guides",
        },
        { key: "about", href: "/about", translationKey: "navigation.about" },
      ]);
    });

    it("should keep optional demo pages and support pages out of the default main navigation", () => {
      const actualKeys = mainNavigation.map((item) => item.key);
      expect(actualKeys).not.toContain("capabilities");
      expect(actualKeys).not.toContain("howItWorks");
      expect(actualKeys).not.toContain("customProject");
      expect(actualKeys).not.toContain("contact");
      expect(actualKeys).not.toContain("privacy");
    });

    it("can derive the catalog navigation", () => {
      expect(getSingleSiteNavigation("catalog")).toEqual([
        { key: "home", href: "/", translationKey: "navigation.home" },
        {
          key: "products",
          href: "/products",
          translationKey: "navigation.products",
        },
        {
          key: "oemWholesale",
          href: "/oem-wholesale",
          translationKey: "navigation.oemWholesale",
        },
        {
          key: "materialsGuide",
          href: "/guides/flood-barrier-materials-guide",
          translationKey: "navigation.guides",
        },
        { key: "about", href: "/about", translationKey: "navigation.about" },
      ]);
    });

    it("can derive minimal navigation without omitted routes", () => {
      expect(getSingleSiteNavigation("minimal")).toEqual([
        { key: "home", href: "/", translationKey: "navigation.home" },
      ]);
    });

    it("should have valid structure for all items", () => {
      mainNavigation.forEach((item) => {
        expect(item.key).toBeTruthy();
        expect(item.href).toBeTruthy();
        expect(item.translationKey).toBeTruthy();
        expect(item.href).toMatch(/^\/[a-z-/]*$/);
        expect(item.translationKey).toMatch(/^navigation\./);
      });
    });

    it("should have home item pointing to root", () => {
      const homeItem = mainNavigation.find((item) => item.key === "home");
      expect(homeItem).toBeDefined();
      expect(homeItem!.href).toBe("/");
    });

    it("should have unique keys", () => {
      const keys = mainNavigation.map((item) => item.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });

    it("should have unique hrefs", () => {
      const hrefs = mainNavigation.map((item) => item.href);
      const uniqueHrefs = new Set(hrefs);
      expect(hrefs.length).toBe(uniqueHrefs.size);
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
      expect(isActivePath("/zh", "/")).toBe(false);
    });

    it("should return false for root path when current path is not root", () => {
      expect(isActivePath("/about", "/")).toBe(false);
      expect(isActivePath("/en/about", "/")).toBe(false);
      expect(isActivePath("/zh/products", "/")).toBe(false);
    });

    it("should return true for matching paths", () => {
      expect(isActivePath("/about", "/about")).toBe(true);
      expect(isActivePath("/en/about", "/about")).toBe(true);
      expect(isActivePath("/zh/about", "/about")).toBe(false);
    });

    it("should return true for sub-paths", () => {
      expect(isActivePath("/about/team", "/about")).toBe(true);
      expect(isActivePath("/en/about/team", "/about")).toBe(true);
      expect(isActivePath("/zh/products/enterprise", "/products")).toBe(false);
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
      expect(isActivePath("/zh", "/")).toBe(false);
    });

    it("should not match partial path segments", () => {
      expect(isActivePath("/aboutus", "/about")).toBe(false);
      expect(isActivePath("/en/aboutus", "/about")).toBe(false);
    });

    it("should handle item paths that already end with slash", () => {
      // This test covers line 85 where cleanItemPath already ends with '/'
      expect(isActivePath("/about/team", "/about/")).toBe(true);
      expect(isActivePath("/en/about/team", "/about/")).toBe(true);
      expect(isActivePath("/zh/products/enterprise", "/products/")).toBe(false);
    });
  });

  describe("getLocalizedHref", () => {
    it("should return external URLs unchanged", () => {
      expect(getLocalizedHref("https://example.com", "en")).toBe(
        "https://example.com",
      );
      expect(getLocalizedHref("http://example.com", "en")).toBe(
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

    it("should keep root path unprefixed for the current locale strategy", () => {
      expect(getLocalizedHref("/", "en")).toBe("/");
    });

    it("should keep internal paths unprefixed for the current locale strategy", () => {
      expect(getLocalizedHref("/about", "en")).toBe("/about");
      expect(getLocalizedHref("/products/enterprise", "en")).toBe(
        "/products/enterprise",
      );
    });

    it("should handle paths with query parameters", () => {
      expect(getLocalizedHref("/search?q=test", "en")).toBe("/search?q=test");
    });

    it("should handle paths with hash fragments", () => {
      expect(getLocalizedHref("/about#team", "en")).toBe("/about#team");
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
    it("should work with real navigation items", () => {
      const aboutItem = mainNavigation.find((item) => item.key === "about");
      expect(aboutItem).toBeDefined();

      const localizedHref = getLocalizedHref(aboutItem!.href, "en");
      expect(localizedHref).toBe("/about");

      const isActive = isActivePath("/about", aboutItem!.href);
      expect(isActive).toBe(true);
    });

    it("should handle all navigation items correctly", () => {
      mainNavigation.forEach((item) => {
        // Test locale-aware href generation
        const enHref = getLocalizedHref(item.href, "en");

        expect(enHref).toBe(item.href);

        // Test active path detection
        const isActive = isActivePath(enHref, item.href);
        expect(isActive).toBe(true);
      });
    });
  });
});
