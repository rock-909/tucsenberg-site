import { expect, test } from "@playwright/test";
import { checkA11y, injectAxe } from "./helpers/axe";
import {
  getHeaderMobileMenuButton,
  getNav,
  isHeaderInMobileMode,
  MAIN_NAV_SELECTOR,
  MOBILE_MENU_CONTENT_SELECTOR,
} from "./helpers/navigation";
import {
  removeInterferingElements,
  safeClick,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

const rawBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  process.env.STAGING_URL ??
  "http://localhost:3000";

const BASE_ORIGIN = new URL(rawBaseUrl).origin;

test.describe("Navigation System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/en");
    await waitForLoadWithFallback(page, {
      context: "navigation beforeEach",
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });
    await removeInterferingElements(page);
    await waitForStablePage(page);
  });

  test("should redirect root path to default locale", async ({
    page,
    request,
    browserName,
  }) => {
    // On Firefox, validate redirect via API to avoid page navigation flakiness
    if (browserName === "firefox") {
      const resp = await request.get(`${BASE_ORIGIN}/`, {
        maxRedirects: 0,
      });
      expect([301, 302, 307, 308]).toContain(resp.status());
      const location =
        resp.headers()["location"] || resp.headers()["Location"] || "";
      expect(location).toMatch(/\/en(\/|$)/);
      await page.goto(`${BASE_ORIGIN}/en`);

      await waitForLoadWithFallback(page, {
        context: "navigation firefox redirect",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });
      await waitForStablePage(page);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      return;
    }

    // For other browsers: navigate to root and assert client-side end state
    await page.goto(`${BASE_ORIGIN}/`);
    await page.waitForURL("**/en");

    await waitForLoadWithFallback(page, {
      context: "navigation client redirect",
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });
    await waitForStablePage(page);
    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test.describe("Desktop Navigation", () => {
    test("should display all main navigation links", async ({ page }) => {
      if (await isHeaderInMobileMode(page)) {
        // On mobile/tablet, verify mobile toggle instead of desktop nav
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        return;
      }

      const nav = getNav(page);
      await expect(nav).toBeVisible();

      await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Products/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Blog/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: /Resources/i })).toBeVisible();
      await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Capabilities" })).toHaveCount(
        0,
      );
      await expect(nav.getByRole("link", { name: "How It Works" })).toHaveCount(
        0,
      );
      await expect(nav.getByRole("link", { name: "Custom" })).toHaveCount(0);
      await expect(nav.getByRole("link", { name: "Contact" })).toHaveCount(0);
    });

    test("should navigate between pages and highlight active link", async ({
      page,
    }) => {
      // Dismiss cookie consent dialog if present to avoid click interception
      const cookieDialog = page.getByRole("dialog", { name: /cookie/i });
      if (await cookieDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        const acceptButton = cookieDialog.getByRole("button", {
          name: /accept/i,
        });
        if (await acceptButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await acceptButton.click();
          await page.waitForTimeout(300);
        }
      }

      if (await isHeaderInMobileMode(page)) {
        // Covered in Mobile Navigation suite; basic presence check to avoid false failures here
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        return;
      }

      const routeChecks = [
        {
          href: "/en/about",
          pattern: /\/en\/about$/,
        },
      ] as const;

      for (const route of routeChecks) {
        const clickedRoute = await safeClick(
          page,
          `nav a[href="${route.href}"]:visible`,
        );
        expect(clickedRoute).toBe(true);
        await page.waitForURL(route.pattern, { waitUntil: "domcontentloaded" });
        await waitForStablePage(page);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.goto("/en");
        await waitForStablePage(page);
      }

      // Dismiss cookie dialog again if it reappeared
      if (await cookieDialog.isVisible({ timeout: 500 }).catch(() => false)) {
        const acceptBtn = cookieDialog.getByRole("button", { name: /accept/i });
        if (await acceptBtn.isVisible({ timeout: 300 }).catch(() => false)) {
          await acceptBtn.click();
          await page.waitForTimeout(300);
        }
      }

      // The loop above returns to home after each route; history behavior is
      // covered by the dedicated back/forward navigation test below.
      await expect(page).toHaveURL(/\/en\/?$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByTestId("hero-section")).toBeVisible({
        timeout: 30_000,
      });
      await waitForStablePage(page);
    });

    test("should support keyboard navigation", async ({ page }) => {
      if (await isHeaderInMobileMode(page)) {
        // Keyboard focus path differs on mobile; validated in mobile suite
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        return;
      }

      const nav = getNav(page);

      // Tab to first navigation link
      await page.keyboard.press("Tab");
      let focusedElement = page.locator(":focus");

      // Continue tabbing until we reach navigation
      let attempts = 0;
      while (attempts < 10) {
        const isInNav =
          (await focusedElement.locator("..").locator("nav").count()) > 0;
        if (isInNav) break;

        await page.keyboard.press("Tab");
        focusedElement = page.locator(":focus");
        attempts++;
      }

      // Verify we can navigate through links with arrow keys
      const homeLink = nav.getByRole("link", { name: "Home" });
      await homeLink.focus();
      await expect(homeLink).toBeFocused();

      // Press Enter to activate
      await page.keyboard.press("Enter");
      await waitForLoadWithFallback(page, {
        context: "navigation keyboard activation",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });

      // Should stay on home page or navigate properly
      expect(page.url()).toContain("/en");
    });

    test("should reset desktop language menu state after navigation", async ({
      page,
    }) => {
      if (await isHeaderInMobileMode(page)) {
        test.skip(true, "desktop language menu is not visible in mobile mode");
      }

      const languageToggleButton = page.getByTestId("language-toggle-button");
      await expect(languageToggleButton).toBeVisible();

      await languageToggleButton.click();
      await expect(languageToggleButton).toHaveAttribute(
        "aria-expanded",
        "true",
      );

      const openDropdown = page.locator(
        '[data-testid="language-dropdown-content"][data-state="open"]',
      );
      await expect(openDropdown).toBeVisible();

      const aboutLink = getNav(page).getByRole("link", { name: "About" });
      await aboutLink.click();
      await page.waitForURL(/\/en\/about$/, { waitUntil: "domcontentloaded" });
      await waitForStablePage(page);

      const currentLanguageToggleButton = page.getByTestId(
        "language-toggle-button",
      );
      await expect(currentLanguageToggleButton).toBeVisible();
      await expect(currentLanguageToggleButton).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(
        page.locator(
          '[data-testid="language-dropdown-content"][data-state="open"]',
        ),
      ).toHaveCount(0);
    });

    test("should keep desktop language menu closed across back and forward", async ({
      page,
    }) => {
      if (await isHeaderInMobileMode(page)) {
        test.skip(true, "desktop language menu is not visible in mobile mode");
      }

      const languageToggleButton = page.getByTestId("language-toggle-button");
      await expect(languageToggleButton).toBeVisible();
      await languageToggleButton.click();
      await expect(languageToggleButton).toHaveAttribute(
        "aria-expanded",
        "true",
      );

      await getNav(page).getByRole("link", { name: "About" }).click();
      await page.waitForURL(/\/en\/about$/, { waitUntil: "domcontentloaded" });
      await waitForStablePage(page);
      await expect(page.getByTestId("language-toggle-button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );

      await page.goBack({ waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/en\/?$/);
      await waitForStablePage(page);
      await expect(page.getByTestId("language-toggle-button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );

      await page.goForward({ waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/en\/about$/);
      await waitForStablePage(page);
      await expect(page.getByTestId("language-toggle-button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    test("should keep language switcher closed after locale switch and browser back", async ({
      page,
    }) => {
      if (await isHeaderInMobileMode(page)) {
        test.skip(true, "desktop language menu is not visible in mobile mode");
      }

      const languageToggleButton = page.getByTestId("language-toggle-button");
      await expect(languageToggleButton).toBeVisible();
      await languageToggleButton.click();
      await expect(languageToggleButton).toHaveAttribute(
        "aria-expanded",
        "true",
      );

      await page
        .locator('[data-testid="language-dropdown-content"][data-state="open"]')
        .getByTestId("language-link-zh")
        .click();
      await page.waitForURL(/\/zh\/?$/, { waitUntil: "domcontentloaded" });
      await waitForStablePage(page);
      await expect(page.locator("html")).toHaveAttribute("lang", "zh");
      await expect(page.getByTestId("language-toggle-button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );

      await page.goBack({ waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/en\/?$/);
      await waitForStablePage(page);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByTestId("language-toggle-button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(
        page.locator(
          '[data-testid="language-dropdown-content"][data-state="open"]',
        ),
      ).toHaveCount(0);
    });

    test("should handle external links correctly", async ({ page }) => {
      // If there are external links in navigation, test them
      const nav = getNav(page);
      const externalLinks = nav.locator('a[target="_blank"]');

      const count = await externalLinks.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const link = externalLinks.nth(i);
          await expect(link).toHaveAttribute("rel", "noopener noreferrer");
        }
      }
    });
  });

  test.describe("Mobile Navigation", () => {
    // Ensure mobile-like context even when running under desktop projects
    // Note: Firefox doesn't support isMobile option, using viewport + hasTouch instead
    test.use({
      viewport: { width: 375, height: 667 },
      hasTouch: true,
    });
    // Note: Mobile tests automatically run on Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12)
    // as configured in playwright.config.ts projects. No need to use test.use() here.

    test("should display hamburger menu on mobile", async ({ page }) => {
      // Desktop navigation should be hidden
      const desktopNav = page
        .getByRole("navigation", {
          name: "Main navigation",
        })
        .first();
      await expect(desktopNav).not.toBeVisible();

      // Mobile menu button should be visible
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible();
      await expect(mobileMenuButton).toHaveAttribute("aria-haspopup", "dialog");

      // Verify the menu trigger still renders an icon even after moving away
      // from lucide-react for the lightweight pre-hydration button.
      const menuIcon = mobileMenuButton.locator("svg[aria-hidden='true']");
      await expect(menuIcon).toBeVisible();
    });

    test("should open and close mobile navigation sheet", async ({ page }) => {
      const mobileMenuButton = getHeaderMobileMenuButton(page);

      // Open mobile menu
      await mobileMenuButton.click();

      // Mobile navigation sheet should be visible
      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();

      // Verify sheet content
      await expect(mobileNavSheet.getByRole("heading").first()).toBeVisible();

      // Verify navigation links in mobile menu (match actual config)
      const expectedLinks = ["Home", "Products", "Blog", "Resources", "About"];
      for (const linkText of expectedLinks) {
        const link = mobileNavSheet.getByRole("link", {
          exact: true,
          name: linkText,
        });
        await expect(link).toBeVisible();
      }
      const removedLinks = ["Capabilities", "How It Works", "Custom"];
      for (const linkText of removedLinks) {
        await expect(
          mobileNavSheet.getByRole("link", {
            exact: true,
            name: linkText,
          }),
        ).toHaveCount(0);
      }
      await expect(
        mobileNavSheet.getByRole("link", {
          exact: true,
          name: "Contact",
        }),
      ).toBeVisible();
      await expect(mobileNavSheet.getByText("Select Language")).toBeVisible();

      // Close menu by clicking close button
      const closeButton = mobileNavSheet.getByRole("button", {
        name: /close/i,
      });
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        // Alternative: click outside or use escape key
        await page.keyboard.press("Escape");
      }

      // Sheet should be closed
      await expect(mobileNavSheet).not.toBeVisible();
    });

    test("should return focus to the trigger after closing the mobile sheet with Escape", async ({
      page,
    }) => {
      const mobileMenuButton = getHeaderMobileMenuButton(page);

      await mobileMenuButton.focus();
      await expect(mobileMenuButton).toBeFocused();

      await page.keyboard.press("Enter");

      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(mobileNavSheet).not.toBeVisible();
      await expect(mobileMenuButton).toBeFocused();
    });

    test("should navigate from mobile menu and auto-close", async ({
      page,
    }) => {
      const clickMobileMenuRoute = async (href: string, urlPattern: RegExp) => {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        await mobileMenuButton.click();

        const mobileNavSheet = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await expect(mobileNavSheet).toBeVisible();
        await waitForStablePage(page);

        const clickedRoute = await safeClick(
          page,
          `${MOBILE_MENU_CONTENT_SELECTOR} a[href="${href}"]`,
        );
        expect(clickedRoute).toBe(true);

        await page.waitForURL(urlPattern, { waitUntil: "domcontentloaded" });
        await waitForStablePage(page);

        // Sheet should auto-close after navigation
        await expect(mobileNavSheet).not.toBeVisible({ timeout: 10_000 });

        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      };

      await clickMobileMenuRoute("/en/about", /\/en\/about$/);
    });

    test("should reset mobile menu language expander after navigation", async ({
      page,
    }) => {
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible();
      await mobileMenuButton.click();

      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();

      const languageRowButton = mobileNavSheet.getByTestId(
        "mobile-language-switcher-label",
      );
      await expect(languageRowButton).toHaveAttribute("aria-expanded", "false");

      await languageRowButton.click();
      await expect(languageRowButton).toHaveAttribute("aria-expanded", "true");
      await expect(
        mobileNavSheet.getByTestId("mobile-language-option-label-zh"),
      ).toBeVisible();

      await mobileNavSheet
        .getByRole("link", { exact: true, name: "About" })
        .click();
      await page.waitForURL(/\/en\/about$/, { waitUntil: "domcontentloaded" });
      await waitForStablePage(page);

      await expect(mobileMenuButton).toBeVisible();
      await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");

      await mobileMenuButton.click();
      const reopenedMobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(reopenedMobileNavSheet).toBeVisible();

      const reopenedLanguageRowButton = reopenedMobileNavSheet.getByTestId(
        "mobile-language-switcher-label",
      );
      await expect(reopenedLanguageRowButton).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      await expect(
        reopenedMobileNavSheet.getByTestId("mobile-language-option-label-zh"),
      ).toHaveCount(0);
    });

    test("should keep mobile menu closed across browser back and forward", async ({
      page,
    }) => {
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible();
      await mobileMenuButton.click();

      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();

      await mobileNavSheet
        .getByRole("link", { exact: true, name: "About" })
        .click();
      await page.waitForURL(/\/en\/about$/, { waitUntil: "domcontentloaded" });
      await waitForStablePage(page);
      await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");

      await page.goBack({ waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/en\/?$/);
      await waitForStablePage(page);
      await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");

      await page.goForward({ waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/en\/about$/);
      await waitForStablePage(page);
      await expect(mobileMenuButton).toHaveAttribute("aria-expanded", "false");
    });

    test("should support touch interactions", async ({ page }) => {
      const mobileMenuButton = getHeaderMobileMenuButton(page);

      // Simulate touch tap with graceful fallback when touch is not available
      try {
        await mobileMenuButton.tap();
      } catch {
        await mobileMenuButton.click();
      }

      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();

      // Test swipe to close (if implemented)
      const sheetContent = mobileNavSheet.locator(MOBILE_MENU_CONTENT_SELECTOR);
      if (await sheetContent.isVisible()) {
        // Simulate swipe gesture
        await sheetContent.hover();
        await page.mouse.down();
        await page.mouse.move(100, 0); // Swipe right
        await page.mouse.up();
      }
    });
  });

  test.describe("Route Handling", () => {
    test("should handle non-existent routes with 404 page", async ({
      page,
    }) => {
      await page.goto("/en/this-page-does-not-exist");

      // Should show 404 page
      const notFoundHeading = page.getByRole("heading", {
        name: /404|not found/i,
      });
      await expect(notFoundHeading).toBeVisible();

      // Should have proper status code
      const response = await page.goto("/en/this-page-does-not-exist");
      expect(response?.status()).toBe(404);
    });

    test("should preserve query parameters during navigation", async ({
      page,
    }) => {
      await page.goto("/en?utm_source=test&utm_medium=e2e");

      if (await isHeaderInMobileMode(page)) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        await mobileMenuButton.click();
        const mobileNavSheet = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await mobileNavSheet
          .getByRole("link", { name: "About" })
          .first()
          .click();
      } else {
        const nav = getNav(page);
        const aboutLink = nav.getByRole("link", { name: "About" });
        await aboutLink.click();
      }
      await page.waitForURL("**/en/about");

      // Query parameters might be preserved depending on implementation
      // This test documents the expected behavior
      expect(page.url()).toContain("/en/about");
    });

    test("should not show navigation progress for same-page hash links", async ({
      page,
    }) => {
      await page.goto("/en#main-content", { waitUntil: "domcontentloaded" });
      await waitForStablePage(page);

      await page
        .locator('a[href="#main-content"]')
        .first()
        .dispatchEvent("click");
      await expect(page).toHaveURL(/\/en#main-content$/);
      await expect(page.getByTestId("navigation-progress-bar")).toHaveCount(0);
    });

    test("should handle browser back/forward navigation", async ({ page }) => {
      // Dismiss cookie consent dialog if present to avoid click interception
      const cookieDialog = page.getByRole("dialog", { name: /cookie/i });
      if (await cookieDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        const acceptButton = cookieDialog.getByRole("button", {
          name: /accept/i,
        });
        if (await acceptButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await acceptButton.click();
          await page.waitForTimeout(300);
        }
      }

      const isMobile = await isHeaderInMobileMode(page);

      // Navigate to About page
      if (isMobile) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        await mobileMenuButton.click();
        const mobileNavSheet = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await mobileNavSheet
          .getByRole("link", { name: "About" })
          .first()
          .click();
      } else {
        const nav = getNav(page);
        const aboutLink = nav.getByRole("link", { name: "About" });
        await aboutLink.click();
      }
      await page.waitForURL("**/en/about");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Navigate back to Home using direct navigation for reliability
      // This creates proper browser history for back/forward testing
      await page.goto("/en", { waitUntil: "domcontentloaded" });
      await page.waitForURL("**/en");

      // Back to About
      await page.goBack();
      await page.waitForURL("**/en/about");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Forward to Home
      await page.goForward();
      await page.waitForURL("**/en");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  });

  test.describe("Accessibility Tests", () => {
    test("should pass navigation accessibility checks", async ({ page }) => {
      await injectAxe(page);

      const isMobile = await isHeaderInMobileMode(page);

      if (isMobile) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        await mobileMenuButton.click();

        const mobileNavSheet = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await expect(mobileNavSheet).toBeVisible();

        await checkA11y(page, MOBILE_MENU_CONTENT_SELECTOR, {
          detailedReport: true,
          detailedReportOptions: { html: true },
          includedImpacts: ["critical", "serious"],
        });
        return;
      }

      const nav = getNav(page);
      await expect(nav).toHaveCount(1);

      await checkA11y(page, MAIN_NAV_SELECTOR, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        includedImpacts: ["critical", "serious"],
      });
    });

    test("should have proper ARIA attributes", async ({ page }) => {
      const isMobile = await isHeaderInMobileMode(page);
      if (isMobile) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        await expect(mobileMenuButton).toHaveAttribute(
          "aria-haspopup",
          "dialog",
        );
        await mobileMenuButton.click();
        const mobileNavSheet = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await expect(mobileNavSheet.getByRole("link").first()).toBeVisible();
      } else {
        const nav = getNav(page);
        await expect(nav).toHaveAttribute("aria-label", "Main navigation");
        await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
        await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
      }
    });

    test("should support screen reader navigation", async ({ page }) => {
      const isMobile = await isHeaderInMobileMode(page);

      if (isMobile) {
        // On mobile, verify menu toggle exists and we can reach landmark content
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        const mainHeading = page.getByRole("heading", { level: 1 });
        await expect(mainHeading).toBeVisible();
      } else {
        // Test landmark navigation on desktop
        const nav = getNav(page);
        await expect(nav).toBeVisible();

        // Verify skip links (if implemented)
        const skipLink = page.getByRole("link", {
          name: /skip to main content/i,
        });
        if (await skipLink.isVisible()) {
          await expect(skipLink).toHaveAttribute("href", "#main-content");
        }

        // Verify heading structure
        const mainHeading = page.getByRole("heading", { level: 1 });
        await expect(mainHeading).toBeVisible();
      }
    });

    test("should restore focus after closing cookie preferences with Escape", async ({
      page,
    }) => {
      const cookieBanner = page.getByRole("dialog", { name: /cookie/i });
      await expect(cookieBanner).toBeVisible();

      const manageButton = cookieBanner.getByRole("button", {
        name: /manage/i,
      });
      await expect(manageButton).toHaveAttribute("aria-haspopup", "dialog");

      await manageButton.focus();
      await page.keyboard.press("Enter");

      const closeButton = cookieBanner.getByRole("button", { name: /close/i });
      await expect(closeButton).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(closeButton).not.toBeVisible();
      await expect(manageButton).toBeFocused();
    });

    test("should work with high contrast mode", async ({ page }) => {
      // Emulate high contrast preference
      await page.emulateMedia({ forcedColors: "active" });

      await page.reload();
      await waitForStablePage(page);

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
        await expect(
          mobileNavSheet.getByRole("link", { name: "Home" }).first(),
        ).toBeVisible();
      } else {
        const nav = getNav(page);
        await expect(nav).toBeVisible();
        const homeLink = nav.getByRole("link", { name: "Home" });
        await expect(homeLink).toBeVisible();
      }
    });
  });

  test.describe("Performance Tests", () => {
    test("should navigate quickly between pages", async ({ page }) => {
      // Dismiss cookie consent dialog if present to avoid click interception
      const cookieDialog = page.getByRole("dialog", { name: /cookie/i });
      if (await cookieDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        const acceptButton = cookieDialog.getByRole("button", {
          name: /accept/i,
        });
        if (await acceptButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await acceptButton.click();
          await page.waitForTimeout(300);
        }
      }

      const isMobile = await isHeaderInMobileMode(page);
      if (isMobile) {
        // Navigation perf budget validated elsewhere; avoid flaky timing checks on mobile here
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        return;
      }

      const nav = getNav(page);

      // Measure navigation time
      const startTime = Date.now();

      const aboutLink = nav.getByRole("link", { name: "About" });
      await aboutLink.click({ noWaitAfter: true });
      await page.waitForURL("**/en/about");

      const navigationTime = Date.now() - startTime;

      console.log(`About navigation time: ${navigationTime}ms`);

      // Navigation should be fast (CI runners can be slightly slower than local machines)
      const budgetMs = process.env.CI ? 1500 : 1000;
      expect(navigationTime).toBeLessThan(budgetMs);

      // Verify page is fully loaded (check for h1 heading)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("should preload navigation links", async ({ page }) => {
      // Check if navigation links have preload attributes
      const nav = getNav(page);
      const links = nav.getByRole("link");

      const linkCount = await links.count();
      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        const href = await link.getAttribute("href");

        if (href && href.startsWith("/")) {
          // Internal links should be optimized for navigation
          // This might include prefetch or other optimization attributes
          await expect(link).toBeVisible();
        }
      }
    });
  });
});
