import { expect, test } from "@playwright/test";
import {
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

const frontmatterTokens = [
  "locale:",
  "publishedAt:",
  "updatedAt:",
  "aboutSections:",
  "statLabels:",
  "faq:",
] as const;

test.describe("About page MDX rendering", () => {
  for (const locale of ["en", "zh"] as const) {
    test(`${locale} about page does not expose raw frontmatter`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/about`, { waitUntil: "domcontentloaded" });
      await page.waitForURL(`**/${locale}/about`);
      await waitForLoadWithFallback(page, {
        context: `about rendering ${locale}`,
        loadTimeout: 10_000,
        fallbackDelay: 500,
      });
      await removeInterferingElements(page);
      await waitForStablePage(page);

      expect(new URL(page.url()).pathname).toBe(`/${locale}/about`);
      const mainHeading = page.locator("main#main-content h1").first();
      await expect(mainHeading).toBeVisible();
      await expect(mainHeading).not.toHaveText(/^\s*$/);

      const article = page.locator("main#main-content article").first();
      await expect(article).toBeVisible();
      const firstArticleHeading = article
        .getByRole("heading", {
          level: 2,
        })
        .first();
      await expect(firstArticleHeading).toBeVisible();
      await expect(firstArticleHeading).not.toHaveText(/^\s*$/);

      const articleText = await article.innerText();

      for (const token of frontmatterTokens) {
        expect(articleText).not.toContain(token);
      }
    });
  }

  test("en about page explains starter identity instead of a fictional company", async ({
    page,
  }) => {
    await page.goto("/en/about", { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/en/about");
    await waitForLoadWithFallback(page, {
      context: "about starter identity en",
      loadTimeout: 10_000,
      fallbackDelay: 500,
    });
    await removeInterferingElements(page);
    await waitForStablePage(page);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /showcase website starter designed for real public launch/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/not a fictional company profile/i),
    ).toBeVisible();
  });
});
