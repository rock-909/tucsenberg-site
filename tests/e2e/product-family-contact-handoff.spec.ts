import { expect, test } from "@playwright/test";
import { waitForLoadWithFallback } from "./test-environment-setup";

const LOAD_TIMEOUT_MS = 10_000;
const FALLBACK_DELAY_MS = 500;

interface ExpectedContactUrl {
  origin: string;
  pathname: string;
  intent: string;
  marketSlug: string;
  familySlug: string;
}

const localeCases = [
  {
    locale: "en",
    productPath: "/en/products/north-america",
    contactPath: "/en/contact",
    marketSlug: "north-america",
    familySlug: "sample-product-shapes",
    inquiryLabel: "Request quote for Sample Product Shapes",
    marketLabel: "Primary Offer Example",
    familyLabel: "Sample Product Shapes",
  },
  {
    locale: "zh",
    productPath: "/zh/products/north-america",
    contactPath: "/zh/contact",
    marketSlug: "north-america",
    familySlug: "sample-product-shapes",
    inquiryLabel: "咨询 示例形态",
    marketLabel: "主要业务示例",
    familyLabel: "示例形态",
  },
] as const;

function expectProductFamilyContactUrl(
  url: URL,
  expected: ExpectedContactUrl,
): void {
  expect(url.origin).toBe(expected.origin);
  expect(url.pathname).toBe(expected.pathname);
  expect(url.searchParams.get("intent")).toBe(expected.intent);
  expect(url.searchParams.get("market")).toBe(expected.marketSlug);
  expect(url.searchParams.get("family")).toBe(expected.familySlug);
}

for (const localeCase of localeCases) {
  test.describe(`product family Contact handoff (${localeCase.locale})`, () => {
    test("keeps the localized Contact href without showing legacy catalog context", async ({
      page,
    }) => {
      await page.goto(localeCase.productPath, {
        waitUntil: "domcontentloaded",
      });

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const expectedContactUrl = {
        origin: new URL(page.url()).origin,
        pathname: localeCase.contactPath,
        intent: "product-family",
        marketSlug: localeCase.marketSlug,
        familySlug: localeCase.familySlug,
      } satisfies ExpectedContactUrl;

      const inquiryLink = page.getByRole("link", {
        name: localeCase.inquiryLabel,
        exact: true,
      });
      await expect(inquiryLink).toBeVisible();

      const renderedHref = await inquiryLink.getAttribute("href");
      if (renderedHref === null) {
        throw new Error(
          `Missing product family inquiry href for ${localeCase.productPath}`,
        );
      }

      if (renderedHref === "#coming-soon") {
        await inquiryLink.click();

        await expect
          .poll(() => {
            const currentUrl = new URL(page.url());
            return `${currentUrl.pathname}${currentUrl.hash}`;
          })
          .toBe(`${localeCase.productPath}#coming-soon`);

        return;
      }

      const renderedUrl = new URL(renderedHref, page.url());
      expectProductFamilyContactUrl(renderedUrl, expectedContactUrl);

      await Promise.all([
        page.waitForURL(
          (url) =>
            url.origin === expectedContactUrl.origin &&
            url.pathname === expectedContactUrl.pathname &&
            url.searchParams.get("intent") === expectedContactUrl.intent &&
            url.searchParams.get("market") === expectedContactUrl.marketSlug &&
            url.searchParams.get("family") === expectedContactUrl.familySlug,
          { waitUntil: "domcontentloaded" },
        ),
        inquiryLink.click(),
      ]);

      await waitForLoadWithFallback(page, {
        context: `${localeCase.locale} product family Contact handoff`,
        loadTimeout: LOAD_TIMEOUT_MS,
        fallbackDelay: FALLBACK_DELAY_MS,
      });

      await expect(
        page.getByTestId("product-family-context-notice"),
      ).toHaveCount(0);
      await expect(page.getByText(localeCase.marketLabel)).toHaveCount(0);
      await expect(page.getByText(localeCase.familyLabel)).toHaveCount(0);
      await expect(page.getByTestId("contact-form-shell")).toBeVisible();
    });
  });
}
