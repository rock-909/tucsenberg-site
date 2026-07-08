import { expect, test } from "@playwright/test";

const rawBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.BASE_URL ??
  process.env.STAGING_URL ??
  "http://localhost:3000";

const BASE_URL = rawBaseUrl.replace(/\/$/, "");

test.describe("Single-locale i18n routing", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("serves root as English without a locale prefix", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/`, {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('a[hreflang="zh"]')).toHaveCount(0);
    await expect(page.locator('a[href="/zh"]')).toHaveCount(0);
  });

  test("serves English pages on unprefixed public paths", async ({ page }) => {
    for (const path of ["/about", "/contact"] as const) {
      const response = await page.goto(`${BASE_URL}${path}`, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), `${path} should be public`).toBeLessThan(400);
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    }
  });

  test("keeps retired Chinese locale paths unavailable", async ({ page }) => {
    for (const path of ["/zh", "/zh/about", "/zh/contact"] as const) {
      const response = await page.goto(`${BASE_URL}${path}`, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), `${path} should stay retired`).toBe(404);
      await expect(page.locator("html")).not.toHaveAttribute("lang", "zh");
      await expect(page.locator('a[hreflang="zh"]')).toHaveCount(0);
      await expect(page.locator('a[href="/zh"]')).toHaveCount(0);
    }
  });

  test("does not switch locale from Accept-Language alone", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({
      "Accept-Language": "zh-CN,zh;q=0.9",
    });

    const response = await page.goto(`${BASE_URL}/contact`, {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBeLessThan(400);
    expect(new URL(page.url()).pathname).toBe("/contact");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("handles concurrent English route requests without locale drift", async ({
    browser,
  }) => {
    const contexts = await Promise.all(
      Array.from({ length: 4 }, () => browser.newContext()),
    );

    try {
      const results = await Promise.all(
        contexts.map(async (context) => {
          const page = await context.newPage();
          const response = await page.goto(`${BASE_URL}/about`, {
            waitUntil: "domcontentloaded",
          });

          return {
            lang: await page.locator("html").getAttribute("lang"),
            path: new URL(page.url()).pathname,
            status: response?.status(),
          };
        }),
      );

      for (const result of results) {
        expect(result.status).toBeLessThan(400);
        expect(result.path).toBe("/about");
        expect(result.lang).toBe("en");
      }
    } finally {
      await Promise.all(contexts.map((context) => context.close()));
    }
  });

  test("exposes only English and x-default hreflang metadata", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/about`, {
      waitUntil: "domcontentloaded",
    });

    const hreflangValues = await page
      .locator("link[hreflang]")
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute("hreflang")),
      );

    expect(hreflangValues).toContain("en");
    expect(hreflangValues).toContain("x-default");
    expect(hreflangValues).not.toContain("zh");
  });

  test("loads unprefixed English pages without redirect loops", async ({
    page,
  }) => {
    let redirectCount = 0;
    page.on("response", (response) => {
      if ([301, 302, 307, 308].includes(response.status())) {
        redirectCount++;
      }
    });

    const response = await page.goto(`${BASE_URL}/about`, {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBeLessThan(400);
    expect(redirectCount).toBeLessThanOrEqual(1);
    await expect(page.locator("body")).toBeVisible();
  });
});
