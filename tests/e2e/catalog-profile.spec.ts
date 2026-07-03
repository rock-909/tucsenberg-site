import { expect, test } from "@playwright/test";
import {
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

const CATALOG_ROUTES = [
  { locale: "en", path: "/en/products" },
  { locale: "zh", path: "/zh/products" },
  { locale: "en", path: "/en/products/north-america" },
  { locale: "zh", path: "/zh/products/north-america" },
] as const;

test.describe("@profile:catalog Catalog profile optional proof", () => {
  test("products and market detail routes remain reachable by direct URL", async ({
    page,
  }) => {
    for (const route of CATALOG_ROUTES) {
      const response = await page.goto(route.path);
      expect(response?.status(), `${route.path} should return HTTP 200`).toBe(
        200,
      );
      await waitForLoadWithFallback(page, {
        context: `catalog profile ${route.path}`,
        loadTimeout: 5_000,
        fallbackDelay: 500,
      });
      await removeInterferingElements(page);
      await waitForStablePage(page);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("market pages render moved catalog fixture assets", async ({ page }) => {
    const response = await page.goto("/en/products/north-america");
    expect(response?.status()).toBe(200);

    await expect(
      page.locator('img[src*="/profile-fixtures/catalog/products/"]').first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("product routes keep SEO structured data", async ({ page }) => {
    for (const path of ["/en/products", "/en/products/north-america"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      await expect(jsonLdScripts).toHaveCount(1);
      const content = await jsonLdScripts.first().textContent();
      expect(content).toBeTruthy();
      const parsed = JSON.parse(content!);
      expect(parsed["@context"]).toBe("https://schema.org");
      expect(Array.isArray(parsed["@graph"])).toBe(true);
    }
  });
});
