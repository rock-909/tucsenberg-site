import { expect, test, type Locator, type Page } from "@playwright/test";
import { checkA11y } from "./helpers/axe";

const routes = [
  { path: "/", viewportWidth: 393, expectsOverflow: false },
  {
    path: "/products/abs-flood-barriers",
    viewportWidth: 393,
    expectsOverflow: true,
  },
  {
    path: "/guides/flood-barrier-materials-guide",
    viewportWidth: 393,
    expectsOverflow: true,
  },
] as const;

test.use({ viewport: { width: 393, height: 851 } });

async function tabToRegion(page: Page, region: Locator): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    await page.keyboard.press("Tab");
    if (
      await region.evaluate((element) => document.activeElement === element)
    ) {
      return;
    }
  }

  throw new Error("Scrollable table region was not reachable with Tab");
}

test("table scroll owners are keyboard reachable with visible focus", async ({
  page,
}) => {
  for (const route of routes) {
    await page.setViewportSize({ width: route.viewportWidth, height: 851 });
    await page.goto(route.path);
    const regions = page.locator('[data-scrollable-table="true"]');
    const regionCount = await regions.count();

    expect(regionCount).toBeGreaterThan(0);
    let scrollableCount = 0;

    for (let index = 0; index < regionCount; index += 1) {
      const region = regions.nth(index);
      await expect(region).toHaveAttribute("tabindex", "0");
      await tabToRegion(page, region);
      await expect(region).toBeFocused();
      await expect
        .poll(() =>
          region.evaluate((element) => {
            const style = getComputedStyle(element);
            return style.outlineStyle !== "none" || style.boxShadow !== "none";
          }),
        )
        .toBe(true);
      const overflows = await region.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      );

      if (!overflows) continue;

      scrollableCount += 1;
      const before = await region.evaluate((element) => element.scrollLeft);
      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => region.evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(before);
    }

    if (route.expectsOverflow) {
      expect(scrollableCount).toBeGreaterThan(0);
    }

    await checkA11y(page, "main#main-content", {
      includedImpacts: ["critical", "serious"],
    });
  }
});
