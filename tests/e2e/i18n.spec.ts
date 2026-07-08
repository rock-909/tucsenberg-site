import { expect, test, type Locator } from "@playwright/test";
import { checkA11y, injectAxe } from "./helpers/axe";
import {
  clickNavLinkByName,
  getHeaderMobileMenuButton,
  getNav,
  isHeaderInMobileMode,
} from "./helpers/navigation";
import {
  acceptCookieBannerIfVisible,
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

test.describe("Internationalization (i18n)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForLoadWithFallback(page);
    await removeInterferingElements(page);
    await waitForStablePage(page);
  });

  test("should default to English locale and display correct lang attribute", async ({
    page,
  }) => {
    expect(new URL(page.url()).pathname).toBe("/");

    // Verify lang attribute on html element
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("en");

    // Verify English content is displayed（严格模式下只使用第一个 hero section）
    const heroSection = page.getByTestId("hero-section").first();
    await expect(heroSection).toBeVisible();

    // Check navigation per form factor
    if (await isHeaderInMobileMode(page)) {
      // On mobile, verify menu toggle instead of desktop nav links
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible();
    } else {
      const nav = getNav(page);
      await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    }
  });

  test.describe("Theme Localization", () => {
    test("should expose footer theme controls in English", async ({ page }) => {
      const footerThemeToggle = page.getByTestId("footer-theme-toggle");
      await expect(footerThemeToggle).toBeVisible();

      await expect(
        footerThemeToggle.getByRole("button", {
          name: "Switch to light theme",
        }),
      ).toBeVisible();
      await expect(
        footerThemeToggle.getByRole("button", { name: "Switch to dark theme" }),
      ).toBeVisible();
      await expect(
        footerThemeToggle.getByRole("button", {
          name: "Switch to system theme",
        }),
      ).toBeVisible();
    });

    test("should maintain theme preference after reload", async ({ page }) => {
      const footerThemeToggle = page.getByTestId("footer-theme-toggle");
      await expect(footerThemeToggle).toBeVisible();
      await acceptCookieBannerIfVisible(page);
      await expect(
        footerThemeToggle.getByRole("button", {
          name: "Switch to dark theme",
        }),
      ).toBeVisible();
      await footerThemeToggle
        .getByRole("button", { name: "Switch to dark theme" })
        .click();

      await expect(page.locator("html")).toHaveClass(/dark/);

      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForStablePage(page);

      await expect(page.locator("html")).toHaveClass(/dark/);
    });
  });

  test.describe("Content Translation Validation", () => {
    test("should display English navigation items", async ({ page }) => {
      const isMobile = await isHeaderInMobileMode(page);
      const nav = getNav(page);
      let container: Locator = nav;
      if (isMobile) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        try {
          await mobileMenuButton.tap();
        } catch {
          await mobileMenuButton.click();
        }
        container = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await expect(container).toBeVisible();
      } else {
        await expect(nav).toBeVisible();
      }
      const englishNavItems = ["Home", "About"];

      for (const item of englishNavItems) {
        const candidate = container
          .getByRole("link", { name: item })
          .or(container.getByRole("button", { name: item }));
        await expect(candidate.first()).toBeVisible();
      }
    });
  });

  test.describe("Mobile i18n Experience", () => {
    // Ensure mobile-like context across browsers (Firefox 不支持 isMobile)
    // 仅使用 viewport + hasTouch 模拟移动设备特性
    test.use({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    // Note: Mobile tests automatically run on Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12)
    // as configured in playwright.config.ts projects. No need to use test.use() here.

    test("should expose English mobile navigation without language controls", async ({
      page,
    }) => {
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible({ timeout: 10000 });

      try {
        await mobileMenuButton.tap();
      } catch {
        await mobileMenuButton.click();
      }

      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();

      const currentLang = await page.locator("html").getAttribute("lang");
      expect(currentLang).toBe("en");
      await expect(
        mobileNavSheet.getByRole("button", {
          name: /select language/i,
        }),
      ).toHaveCount(0);
      await expect(
        mobileNavSheet.getByRole("link", { name: "Home" }),
      ).toBeVisible();
      await expect(mobileNavSheet.getByText("简体中文")).toHaveCount(0);
    });
  });

  test.describe("Accessibility and i18n", () => {
    test("should pass accessibility checks in English", async ({ page }) => {
      await injectAxe(page);

      await checkA11y(page, 'main, nav[aria-label="Main navigation"]', {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test("should have proper lang attributes for screen readers", async ({
      page,
    }) => {
      const htmlLang = await page.locator("html").getAttribute("lang");
      expect(htmlLang).toBe("en");
      await expect(page.locator('a[hreflang="zh"]')).toHaveCount(0);
    });
  });

  test.describe("URL and SEO", () => {
    test("should keep public URLs unprefixed", async ({ page }) => {
      expect(new URL(page.url()).pathname).toBe("/");

      // Navigate to About page (per form factor)
      {
        const isMobile = await isHeaderInMobileMode(page);
        if (isMobile) {
          const mobileMenuButton = getHeaderMobileMenuButton(page);
          await expect(mobileMenuButton).toBeVisible();
          try {
            await mobileMenuButton.tap();
          } catch {
            await mobileMenuButton.click();
          }
          const mobileNavSheet = page.getByRole("dialog", {
            name: /mobile navigation/i,
          });
          await expect(mobileNavSheet).toBeVisible();
          await mobileNavSheet
            .getByRole("link", { name: "About" })
            .first()
            .click();
        } else {
          await clickNavLinkByName(page, "About");
        }
      }
      await page.waitForURL("**/about");

      expect(new URL(page.url()).pathname).toBe("/about");
    });

    test("should keep retired Chinese URLs unavailable", async ({ page }) => {
      const response = await page.goto("/zh", {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), "/zh should return HTTP 404").toBe(404);
      await expect(page.locator("html")).not.toHaveAttribute("lang", "zh");
      await expect(page.getByText("简体中文")).toHaveCount(0);
    });
  });
});
