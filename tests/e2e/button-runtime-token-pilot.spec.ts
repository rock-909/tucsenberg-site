import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

async function preparePage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForLoadWithFallback(page, {
    context: `button runtime token pilot ${path}`,
    loadTimeout: 10_000,
    fallbackDelay: 500,
  });
  await removeInterferingElements(page);
  await waitForStablePage(page);
}

// Locale-agnostic: target the primary governed Button wrapper on each surface
// without depending on EN copy. Homepage uses the hero CTA; Products and About
// expose their primary governed CTA as the first [data-slot="button"] in main.
// The Contact form submit is intentionally a native <button> outside this
// Button-only pilot, so it is not a target here.
function primaryGovernedButton(page: Page, path: string): Locator {
  if (path === "/en" || path === "/zh") {
    return page
      .locator('[data-testid="hero-section"]')
      .locator('[data-slot="button"]')
      .first();
  }

  return page
    .locator("main#main-content")
    .locator('[data-slot="button"]')
    .first();
}

// Read only user-visible computed results. The exact token class strings are
// covered by the Button wrapper unit test; this proof verifies the rendered
// outcome so an equivalent implementation does not falsely fail it.
async function getButtonMetrics(locator: Locator) {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      borderRadius: style.borderRadius,
      height: rect.height,
    };
  });
}

// Primary actions render at the default (2.5rem = 40px) or large (3rem = 48px)
// pilot height; either proves the runtime height token is applied, not the old
// 38px button height.
function expectPilotHeight(height: number) {
  const isDefault = height >= 39 && height <= 41;
  const isLarge = height >= 47 && height <= 49;

  expect(
    isDefault || isLarge,
    `expected a pilot Button height (~40px or ~48px), got ${String(height)}px`,
  ).toBe(true);
}

const proofPaths = [
  "/en",
  "/zh",
  "/en/products",
  "/zh/products",
  "/en/about",
  "/zh/about",
] as const;

test.describe("Button runtime token pilot", () => {
  for (const path of proofPaths) {
    test(`${path} primary action renders the Button pilot radius and height`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await preparePage(page, path);

      const primaryAction = primaryGovernedButton(page, path);
      await expect(primaryAction).toBeVisible();

      const metrics = await getButtonMetrics(primaryAction);

      // --button-radius: 0.75rem resolves to 12px.
      expect(metrics.borderRadius).toBe("12px");
      expectPilotHeight(metrics.height);
    });
  }

  test("dark mobile governed action keeps Button pilot metrics without overflow", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setViewportSize({ width: 390, height: 844 });
    await preparePage(page, "/zh/about");

    const primaryAction = primaryGovernedButton(page, "/zh/about");
    await expect(primaryAction).toBeVisible();

    const metrics = await getButtonMetrics(primaryAction);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );

    expect(metrics.borderRadius).toBe("12px");
    expectPilotHeight(metrics.height);
    expect(hasOverflow).toBe(false);
  });
});
