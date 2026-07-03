import { expect, test } from "@playwright/test";
import {
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

/**
 * User Journey E2E Tests
 *
 * Aligned to Behavioral Contracts (docs/ref/contracts.md).
 * Each test covers a real user journey, not individual component checks.
 *
 * BC-002: Navigate to all main pages from header
 * BC-005: 404 for invalid routes
 * BC-020: All internal links point to real routes
 */

test.describe("Journey: Navigate All Pages (BC-002)", () => {
  const pages = [
    { path: "/en", titlePattern: /Showcase Website Starter/i },
    { path: "/en/about", titlePattern: /About/i },
    {
      path: "/en/products",
      titlePattern: /Product overview|产品概览/i,
    },
    { path: "/en/blog", titlePattern: /Blog|博客/i },
    { path: "/en/resources", titlePattern: /Resources|资料/i },
    { path: "/en/contact", titlePattern: /Contact|Example/i },
    { path: "/en/privacy", titlePattern: /Privacy|Example/i },
    { path: "/en/terms", titlePattern: /Terms|Example/i },
  ];

  for (const { path, titlePattern } of pages) {
    test(`page ${path} loads and has title`, async ({ page }) => {
      const response = await page.goto(path);

      // Page should return 200
      expect(response?.status()).toBe(200);

      // Page should have a matching title
      await expect(page).toHaveTitle(titlePattern);

      // Page should have a visible main heading
      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe("Journey: 404 for Invalid Routes (BC-005)", () => {
  test("invalid route shows 404 page", async ({ page }) => {
    const response = await page.goto("/en/this-page-does-not-exist");

    // Should return 404
    expect(response?.status()).toBe(404);

    // Should show 404 text
    const notFoundText = page.getByText("404");
    await expect(notFoundText).toBeVisible({ timeout: 5_000 });

    // The 404 body should offer a dedicated recovery action, not just reuse nav/footer links
    const homeLink = page
      .getByRole("main")
      .getByRole("link", { name: /back to homepage|go back/i });
    await expect(homeLink).toBeVisible();
  });
});

test.describe("Journey: CTA Links Resolve (BC-020)", () => {
  test("homepage CTAs link to valid destinations", async ({ page }) => {
    await page.goto("/en");
    await waitForLoadWithFallback(page, {
      context: "homepage CTA check",
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });
    await removeInterferingElements(page);
    await waitForStablePage(page);

    // Find all CTA-like links (buttons inside links, or prominent links)
    const ctaLinks = page.locator(
      'a:has(button), a[class*="cta"], a[class*="primary"]',
    );

    const count = await ctaLinks.count();
    expect(count).toBeGreaterThan(0);

    // Verify each CTA href points to a valid internal path
    for (let i = 0; i < count; i++) {
      const href = await ctaLinks.nth(i).getAttribute("href");
      if (href && href.startsWith("/")) {
        // Navigate and verify no 404/500
        const response = await page.goto(href);
        expect(response?.status()).toBeLessThan(400);
        // Go back for next CTA
        await page.goto("/en");
        await waitForStablePage(page);
      }
    }
  });
});

test.describe("Journey: Language Parity (BC-003)", () => {
  test("key pages exist in both en and zh", async ({ page }) => {
    const paths = [
      "/",
      "/about",
      "/products",
      "/blog",
      "/resources",
      "/contact",
      "/privacy",
      "/terms",
    ];

    for (const path of paths) {
      // English version
      const enResponse = await page.goto(`/en${path}`);
      expect(enResponse?.status()).toBe(200);

      // Chinese version
      const zhResponse = await page.goto(`/zh${path}`);
      expect(zhResponse?.status()).toBe(200);
    }
  });
});
