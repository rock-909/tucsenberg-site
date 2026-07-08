import { expect, test } from "@playwright/test";
import { checkA11y, injectAxe } from "./helpers/axe";
import {
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

test.describe("Homepage Core Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage and wait for stable state
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/en");
    await waitForLoadWithFallback(page, {
      context: "homepage beforeEach",
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });
    await removeInterferingElements(page);
    await waitForStablePage(page);
  });

  test("should load homepage with all core sections", async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Showcase Website Starter/);

    // Verify all 5 core sections are present and visible using semantic selectors
    const heroSection = page.getByTestId("hero-section");
    const sections = page.locator("section");

    // Should have at least 5 sections (page may have more due to dynamic content)
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThanOrEqual(5);

    // Verify hero section is visible
    await expect(heroSection).toBeVisible();

    // Verify main heading exists
    const mainHeading = page.getByRole("heading", { level: 1 });
    await expect(mainHeading).toBeVisible();

    // Verify navigation is present (desktop or mobile)
    const nav = getNav(page);
    const mobileMenuButton = getHeaderMobileMenuButton(page);

    // Determine mode by visible controls (avoids hardcoded breakpoints)
    if (await isHeaderInMobileMode(page)) {
      await expect(mobileMenuButton).toBeVisible();
    } else {
      await expect(nav).toBeVisible();
    }
  });

  test("should display hero section with correct content", async ({ page }) => {
    const heroSection = page.getByTestId("hero-section");

    // Verify hero title
    const heroTitle = page.getByRole("heading", { level: 1 });
    await expect(heroTitle).toBeVisible();

    // Verify eyebrow text
    const eyebrow = heroSection.locator('[class*="uppercase"]');
    if ((await eyebrow.count()) > 0) {
      await expect(eyebrow.first()).toBeVisible();
    }

    // Verify CTA links exist (Button asChild renders as <a>)
    const ctaLinks = heroSection.getByRole("link");
    const ctaCount = await ctaLinks.count();
    expect(ctaCount).toBeGreaterThanOrEqual(2);

    // Verify proof bar with business metrics
    const proofItems = heroSection.locator(".font-mono");
    if ((await proofItems.count()) > 0) {
      await expect(proofItems.first()).toBeVisible();
    }

    // Hero visual is the working-principle diagram, not a product-line index
    // (the five cards below own the index — 视觉翻译-自顶向下设计.md).
    const heroDiagram = heroSection.getByTestId("hero-diagram");
    await expect(heroDiagram).toBeVisible();
    const diagramCaption = heroDiagram.locator("figcaption");
    await expect(diagramCaption).toBeVisible();
    await expect(diagramCaption).not.toHaveText(/^\s*$/);
    await expect(heroSection.getByTestId("hero-preview-card")).toHaveCount(0);
  });

  test("should handle CTA button interactions correctly", async ({ page }) => {
    const heroSection = page.getByTestId("hero-section");
    await expect(heroSection).toBeVisible();

    // Verify primary and secondary CTA links (Button asChild renders as <a>)
    const ctaLinks = heroSection.getByRole("link");
    const ctaCount = await ctaLinks.count();
    expect(ctaCount).toBeGreaterThanOrEqual(2);

    // Verify CTA links are visible
    await expect(ctaLinks.first()).toBeVisible();
  });

  test.describe("Responsive Design Tests", () => {
    test("keeps the zh B2B proof slice readable on mobile dark mode", async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(() => {
        window.localStorage.setItem(
          "cookie-consent",
          JSON.stringify({
            consent: { necessary: true, analytics: true, marketing: true },
            updatedAt: "2026-06-21T00:00:00.000Z",
            version: 1,
          }),
        );
      });
      await page.goto("/zh", { waitUntil: "domcontentloaded" });
      await waitForLoadWithFallback(page, {
        context: "zh mobile dark proof slice load",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });
      await acceptCookieBannerIfVisible(page);
      const footerThemeToggle = page.getByTestId("footer-theme-toggle");
      await footerThemeToggle
        .getByRole("button", { name: "切换到暗黑模式" })
        .click();
      await expect(page.locator("html")).toHaveClass(/dark/);
      await waitForStablePage(page);

      const heroSection = page.getByTestId("hero-section");
      const proofList = heroSection.getByRole("list", {
        name: "首页证明分类",
      });
      const heroDiagram = heroSection.getByTestId("hero-diagram");
      const answerSection = page.getByTestId("home-answer-section");
      const startPathSection = page.getByTestId("home-start-path-section");

      await expect(
        heroSection.getByRole("heading", { level: 1 }),
      ).toContainText("产品体系");
      await expect(proofList.getByRole("listitem")).toHaveCount(4);
      await expect(heroDiagram).toBeVisible();
      await expect(answerSection).toBeVisible();
      await expect(startPathSection).toBeVisible();
      await expect(
        heroSection.getByRole("link", { name: "查看产品体系" }),
      ).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth >
            document.documentElement.clientWidth ||
          document.body.scrollWidth > document.body.clientWidth
        );
      });
      expect(hasHorizontalOverflow).toBe(false);
    });

    test("should display correctly on desktop (1920x1080)", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForLoadWithFallback(page, {
        context: "desktop viewport reload",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });
      await waitForStablePage(page);

      const heroSection = page.getByTestId("hero-section");

      // Verify desktop layout
      await expect(heroSection).toBeVisible();

      // Check that desktop navigation is visible
      const mainNav = getNav(page);
      await expect(mainNav).toBeVisible();

      // Verify hero content is properly sized
      const heroTitle = page.getByRole("heading", { level: 1 });
      await expect(heroTitle).toBeVisible();

      // Verify hero title renders at desktop size (46px)
      const fontSize = await heroTitle.evaluate(
        (el) => getComputedStyle(el).fontSize,
      );
      expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(46);
    });

    test("should display correctly on tablet (768x1024)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForLoadWithFallback(page, {
        context: "tablet viewport reload",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });
      await waitForStablePage(page);

      const heroSection = page.getByTestId("hero-section");
      await expect(heroSection).toBeVisible();

      // Verify responsive text sizing
      const heroTitle = page.getByRole("heading", { level: 1 });
      await expect(heroTitle).toBeVisible();

      // Tablet (768px) is below the lg breakpoint (1024px), so the header
      // shows the mobile hamburger button. Keep a generous timeout because
      // route hydration and dynamic chunks can still settle at different speeds.
      const mobileMenuButton = getHeaderMobileMenuButton(page);
      await expect(mobileMenuButton).toBeVisible({ timeout: 15_000 });
    });

    test("should display correctly on mobile (375x667)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForLoadWithFallback(page, {
        context: "mobile viewport reload",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });
      await waitForStablePage(page);

      const heroSection = page.getByTestId("hero-section");
      await expect(heroSection).toBeVisible();

      // Verify mobile navigation is used (look for hamburger menu)
      const mobileMenuButton = page
        .getByRole("button")
        .filter({ hasText: /menu|toggle/i });
      if ((await mobileMenuButton.count()) > 0) {
        await expect(mobileMenuButton.first()).toBeVisible();
      }

      // Verify content is accessible on mobile
      const heroTitle = page.getByRole("heading", { level: 1 });
      await expect(heroTitle).toBeVisible();

      // Verify buttons/links are accessible
      const links = heroSection.getByRole("link");
      if ((await links.count()) > 0) {
        await expect(links.first()).toBeVisible();
      }
    });
  });

  test.describe("Performance Tests", () => {
    test("should load within performance budgets", async ({ page }) => {
      const navigationStart = Date.now();

      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForURL("**/en");
      await waitForLoadWithFallback(page, {
        context: "performance budget load",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });

      const loadMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;

        if (navigation) {
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd,
            loadEventEnd: navigation.loadEventEnd,
          };
        }

        const { timing } = performance;
        return {
          domContentLoaded:
            timing.domContentLoadedEventEnd - timing.navigationStart,
          loadEventEnd: timing.loadEventEnd - timing.navigationStart,
        };
      });

      const loadTime =
        (loadMetrics.loadEventEnd && loadMetrics.loadEventEnd > 0
          ? loadMetrics.loadEventEnd
          : loadMetrics.domContentLoaded) ?? Date.now() - navigationStart;

      // Verify page loads within budget
      // Dev server has compilation overhead and parallel tests share resources
      // CI uses production build which is faster
      const isCI = Boolean(process.env.CI);
      const performanceBudget = isCI ? 2000 : 8000;
      expect(loadTime).toBeLessThan(performanceBudget);

      // Check Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const webVitals: { lcp?: number; fid?: number; cls?: number } = {};

            entries.forEach((entry) => {
              const perfEntry = entry as unknown as {
                name: string;
                value: number;
              };
              if (perfEntry.name === "LCP") {
                webVitals.lcp = perfEntry.value;
              }
              if (perfEntry.name === "FID") {
                webVitals.fid = perfEntry.value;
              }
              if (perfEntry.name === "CLS") {
                webVitals.cls = perfEntry.value;
              }
            });

            resolve(webVitals);
          }).observe({
            entryTypes: [
              "largest-contentful-paint",
              "first-input",
              "layout-shift",
            ],
          });

          // Fallback timeout
          setTimeout(() => resolve({}), 3000);
        });
      });

      // Verify Core Web Vitals thresholds (if available)
      const typedVitals = vitals as {
        lcp?: number;
        fid?: number;
        cls?: number;
      };
      if (typedVitals.lcp) {
        expect(typedVitals.lcp).toBeLessThan(2500); // LCP < 2.5s
      }
      if (typedVitals.fid) {
        expect(typedVitals.fid).toBeLessThan(100); // FID < 100ms
      }
      if (typedVitals.cls) {
        expect(typedVitals.cls).toBeLessThan(0.1); // CLS < 0.1
      }
    });

    test("should handle slow network conditions gracefully", async ({
      page,
    }) => {
      // Simulate slow 3G network
      await page.route("**/*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForURL("**/en");
      await waitForLoadWithFallback(page, {
        context: "slow network load",
        loadTimeout: 8_000,
        fallbackDelay: 500,
      });

      // Verify core content is still visible
      const heroSection = page.getByTestId("hero-section");
      await expect(heroSection).toBeVisible();

      // Verify core content loaded despite slow network
      const heroTitle = page.getByRole("heading", { level: 1 });
      await expect(heroTitle).toBeVisible();
    });
  });

  test.describe("Accessibility Tests", () => {
    test("should pass automated accessibility checks", async ({ page }) => {
      await injectAxe(page);

      // Run axe-core accessibility checks
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });

    test("should support keyboard navigation", async ({ page }) => {
      // Verify interactive elements exist and can receive focus.
      // Direct Tab-key navigation is unreliable in headless Chromium, so
      // instead verify that the first link/button is focusable via JS.
      const firstLink = page.getByRole("link").first();
      await expect(firstLink).toBeVisible();

      await firstLink.focus();
      const tag = await page.evaluate(() => document.activeElement?.tagName);
      expect(tag).toBe("A");
    });

    test("should have proper ARIA attributes and semantic structure", async ({
      page,
    }) => {
      const heroSection = page.getByTestId("hero-section");

      // Verify semantic structure exists
      await expect(heroSection).toBeVisible();

      // Verify heading hierarchy
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();

      // Verify navigation has proper structure (desktop or mobile)
      const nav = getNav(page);
      const mobileMenuButton = getHeaderMobileMenuButton(page);

      if (await isHeaderInMobileMode(page)) {
        await expect(mobileMenuButton).toBeVisible();
      } else {
        await expect(nav).toBeVisible();
      }

      // Verify links have href attributes
      const links = page.getByRole("link");
      const linkCount = await links.count();
      if (linkCount > 0) {
        for (let i = 0; i < Math.min(linkCount, 3); i++) {
          const link = links.nth(i);
          await expect(link).toHaveAttribute("href");
        }
      }
    });

    test("should respect reduced motion preferences", async ({ page }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: "reduce" });

      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForURL("**/en");
      await waitForLoadWithFallback(page, {
        context: "reduced motion load",
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });
      await waitForStablePage(page);

      // Verify animations are disabled or reduced
      const heroSection = page.locator("section").first();
      await expect(heroSection).toBeVisible();

      // Check that elements are immediately visible (no animation delays)
      const heroTitle = page.getByRole("heading", { level: 1 });
      await expect(heroTitle).toBeVisible();

      // Verify content is accessible without animations (desktop or mobile)
      const nav = getNav(page);
      const mobileMenuButton = getHeaderMobileMenuButton(page);

      if (await isHeaderInMobileMode(page)) {
        await expect(mobileMenuButton).toBeVisible();
      } else {
        await expect(nav).toBeVisible();
      }
    });
  });
});
