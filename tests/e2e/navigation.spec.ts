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
const PUBLIC_NAV_ITEMS = ["Membranes", "Compatibility", "Materials", "Quote"];

// Step-4 information architecture: every buyer nav item except Materials
// reaches a live page. Materials is genuinely future scope and stays the
// #coming-soon placeholder. Hrefs are locale-prefixed by next-intl routing.
const PLACEHOLDER_HREF = "#coming-soon";
const NAV_LIVE_HREF: Record<string, string> = {
  Membranes: "/en/membranes/9-inch-epdm-disc-replacement",
  Compatibility: "/en/compatible/sanitaire",
  Quote: "/en/quote",
};
const NAV_EXPECTED_HREF: Record<string, string> = {
  ...NAV_LIVE_HREF,
  Materials: PLACEHOLDER_HREF,
};
const REMOVED_STARTER_LINKS = [
  "Home",
  "Products",
  "Blog",
  "About",
  "Capabilities",
  "How It Works",
  "Custom",
  "Contact",
];

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

      for (const label of PUBLIC_NAV_ITEMS) {
        const link = nav.getByRole("link", { name: label });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", NAV_EXPECTED_HREF[label]);
        // Shipped Step-4 pages must never regress to the placeholder href.
        if (label !== "Materials") {
          await expect(link).not.toHaveAttribute("href", PLACEHOLDER_HREF);
        }
      }

      for (const label of REMOVED_STARTER_LINKS) {
        await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
      }
    });

    test("should navigate buyer nav items to their live Step-4 pages", async ({
      page,
    }) => {
      if (await isHeaderInMobileMode(page)) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        return;
      }

      // Click each shipped buyer nav item and assert it lands on the real
      // route, not a #coming-soon dead-end.
      for (const [label, href] of Object.entries(NAV_LIVE_HREF)) {
        await page.goto("/en");
        await waitForLoadWithFallback(page, {
          context: `navigation live target (${label})`,
          loadTimeout: 5_000,
          fallbackDelay: 500,
        });
        await removeInterferingElements(page);
        await waitForStablePage(page);

        const nav = getNav(page);
        const link = nav.getByRole("link", { name: label });
        await expect(link).toHaveAttribute("href", href);

        await link.click({ noWaitAfter: true });
        await page.waitForURL(`**${href}`);
        await expect.poll(() => new URL(page.url()).pathname).toBe(href);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
          timeout: 30_000,
        });
      }
    });

    test("should keep the Materials placeholder stable and non-breaking", async ({
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

      const nav = getNav(page);
      const materialsLink = nav.getByRole("link", { name: "Materials" });
      await expect(materialsLink).toHaveAttribute("href", PLACEHOLDER_HREF);

      const clickedRoute = await safeClick(
        page,
        `nav a[href="${PLACEHOLDER_HREF}"]:visible`,
      );
      expect(clickedRoute).toBe(true);
      await waitForStablePage(page);

      // Dismiss cookie dialog again if it reappeared
      if (await cookieDialog.isVisible({ timeout: 500 }).catch(() => false)) {
        const acceptBtn = cookieDialog.getByRole("button", { name: /accept/i });
        if (await acceptBtn.isVisible({ timeout: 300 }).catch(() => false)) {
          await acceptBtn.click();
          await page.waitForTimeout(300);
        }
      }

      await expect(page).toHaveURL(/\/en\/?#coming-soon$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
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

      // Verify we can focus and activate the first buyer nav link, which now
      // navigates to the live featured membrane page (not a placeholder).
      const firstNavLink = nav.getByRole("link", { name: "Membranes" });
      await firstNavLink.focus();
      await expect(firstNavLink).toBeFocused();

      // Press Enter to activate
      await page.keyboard.press("Enter");
      await waitForLoadWithFallback(page, {
        context: "navigation keyboard activation",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });

      await expect(page).toHaveURL(
        /\/en\/membranes\/9-inch-epdm-disc-replacement$/,
      );
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

      // Verify navigation links in mobile menu (Step-4 IA: live pages except
      // the genuinely-future Materials placeholder).
      for (const linkText of PUBLIC_NAV_ITEMS) {
        const links = mobileNavSheet.getByRole("link", {
          exact: true,
          name: linkText,
        });
        const count = await links.count();
        expect(count).toBeGreaterThanOrEqual(1);

        for (let index = 0; index < count; index += 1) {
          const link = links.nth(index);
          await expect(link).toBeVisible();
          await expect(link).toHaveAttribute(
            "href",
            NAV_EXPECTED_HREF[linkText],
          );
          if (linkText !== "Materials") {
            await expect(link).not.toHaveAttribute("href", PLACEHOLDER_HREF);
          }
        }
      }
      for (const linkText of REMOVED_STARTER_LINKS) {
        await expect(
          mobileNavSheet.getByRole("link", {
            exact: true,
            name: linkText,
          }),
        ).toHaveCount(0);
      }
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

    test("should route mobile menu buyer links to live pages and keep only Materials a placeholder", async ({
      page,
    }) => {
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible();
      await mobileMenuButton.click();

      const mobileNavSheet = page.getByRole("dialog", {
        name: /mobile navigation/i,
      });
      await expect(mobileNavSheet).toBeVisible();
      await waitForStablePage(page);

      for (const label of PUBLIC_NAV_ITEMS) {
        const links = mobileNavSheet.getByRole("link", {
          exact: true,
          name: label,
        });
        const count = await links.count();
        expect(count).toBeGreaterThanOrEqual(1);

        for (let index = 0; index < count; index += 1) {
          await expect(links.nth(index)).toHaveAttribute(
            "href",
            NAV_EXPECTED_HREF[label],
          );
          // Shipped Step-4 pages must not regress to the placeholder.
          if (label !== "Materials") {
            await expect(links.nth(index)).not.toHaveAttribute(
              "href",
              PLACEHOLDER_HREF,
            );
          }
        }
      }

      // The Materials placeholder still performs a stable in-page hash nav
      // (sheet auto-closes, page does not break).
      const clickedRoute = await safeClick(
        page,
        `${MOBILE_MENU_CONTENT_SELECTOR} a[href="${PLACEHOLDER_HREF}"]`,
      );
      expect(clickedRoute).toBe(true);
      await waitForStablePage(page);

      await expect(mobileNavSheet).not.toBeVisible({ timeout: 10_000 });

      await expect(page).toHaveURL(/\/en\/?#coming-soon$/);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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

      // Use the Materials placeholder: it is the in-page hash navigation that
      // must preserve query params. Shipped buyer links now route to real
      // pages and are covered by the dedicated live-navigation test.
      if (await isHeaderInMobileMode(page)) {
        const mobileMenuButton = getHeaderMobileMenuButton(page);
        await expect(mobileMenuButton).toBeVisible();
        await mobileMenuButton.click();
        const mobileNavSheet = page.getByRole("dialog", {
          name: /mobile navigation/i,
        });
        await mobileNavSheet
          .getByRole("link", { name: "Materials" })
          .first()
          .click();
      } else {
        const nav = getNav(page);
        const materialsLink = nav.getByRole("link", { name: "Materials" });
        await materialsLink.click();
      }
      await expect
        .poll(() => {
          const currentUrl = new URL(page.url());
          return {
            pathname: currentUrl.pathname,
            search: currentUrl.search,
            hash: currentUrl.hash,
          };
        })
        .toEqual({
          pathname: "/en",
          search: "?utm_source=test&utm_medium=e2e",
          hash: "#coming-soon",
        });

      // Hash placeholder navigation should preserve the active URL path.
      const navigatedUrl = new URL(page.url());
      expect(navigatedUrl.pathname).toBe("/en");
      expect(navigatedUrl.searchParams.get("utm_source")).toBe("test");
      expect(navigatedUrl.searchParams.get("utm_medium")).toBe("e2e");
      expect(navigatedUrl.hash).toBe("#coming-soon");
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

      // About remains a real route but is no longer part of public nav.
      await page.goto("/en/about", { waitUntil: "domcontentloaded" });
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
        for (const label of PUBLIC_NAV_ITEMS) {
          await expect(nav.getByRole("link", { name: label })).toBeVisible();
        }
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
          mobileNavSheet.getByRole("link", { name: "Membranes" }).first(),
        ).toBeVisible();
      } else {
        const nav = getNav(page);
        await expect(nav).toBeVisible();
        const membranesLink = nav.getByRole("link", { name: "Membranes" });
        await expect(membranesLink).toBeVisible();
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

      const membranesLink = nav.getByRole("link", { name: "Membranes" });
      await membranesLink.click({ noWaitAfter: true });
      await page.waitForURL("**/en/membranes/9-inch-epdm-disc-replacement");

      const navigationTime = Date.now() - startTime;

      console.log(`Membranes navigation time: ${navigationTime}ms`);

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
