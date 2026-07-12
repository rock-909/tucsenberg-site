import { expect, test, type Page } from "@playwright/test";
import { checkA11y } from "./helpers/axe";
import {
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

// English-only site: `resources` and `blog` are retired routes (they 404), and
// `/zh/*` 404s as well. A 404 page still renders main#main-content + an h1 with
// no overflow, so keeping those entries produced false-green assertions. Scope
// the calibration to the real English core pages instead.
const corePages = ["about", "products", "contact"] as const;

const locales = ["en"] as const;

async function preparePage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForLoadWithFallback(page, {
    context: `core visual calibration ${path}`,
    loadTimeout: 10_000,
    fallbackDelay: 500,
  });
  await removeInterferingElements(page);
  await waitForStablePage(page);
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );

  expect(hasOverflow).toBe(false);
}

function collectPageErrors(page: Page) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  return pageErrors;
}

test.describe("Core page visual calibration", () => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ] as const) {
    for (const colorScheme of ["light", "dark"] as const) {
      for (const locale of locales) {
        for (const slug of corePages) {
          const path = `/${locale}/${slug}`;

          test(`${viewport.name} ${colorScheme} ${path} stays readable without overflow`, async ({
            page,
          }, testInfo) => {
            await page.emulateMedia({ colorScheme });
            await page.setViewportSize({
              width: viewport.width,
              height: viewport.height,
            });
            const pageErrors = collectPageErrors(page);
            await preparePage(page, path);

            await expect(page.locator("main#main-content")).toBeVisible();
            await expect(
              page.locator("main#main-content h1").first(),
            ).toBeVisible();
            await expectNoHorizontalOverflow(page);
            expect(pageErrors).toStrictEqual([]);

            await testInfo.attach(
              `${viewport.name}-${colorScheme}-${path.replace(/\//gu, "-")}.png`,
              {
                body: await page.screenshot({ fullPage: true }),
                contentType: "image/png",
              },
            );
          });
        }
      }
    }
  }

  for (const locale of locales) {
    test(`${locale} core pages have no critical or serious a11y issues`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const pageErrors = collectPageErrors(page);

      for (const slug of corePages) {
        await preparePage(page, `/${locale}/${slug}`);

        await expect(page.locator("main#main-content")).toBeVisible();
        await checkA11y(page, "main#main-content", {
          includedImpacts: ["critical", "serious"],
        });
      }

      expect(pageErrors).toStrictEqual([]);
    });
  }
});
