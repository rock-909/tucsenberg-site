import { expect, test } from "@playwright/test";
import { checkA11y } from "./helpers/axe";

const routes = [
  { path: "/", regionCount: 1, scrollableCount: 0 },
  {
    path: "/products/abs-flood-barriers",
    regionCount: 2,
    scrollableCount: 2,
  },
  {
    path: "/guides/flood-barrier-materials-guide",
    regionCount: 2,
    scrollableCount: 2,
  },
] as const;

test.use({ viewport: { width: 393, height: 851 } });

test("wide tables are focusable and keyboard-scrollable", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route.path);
    const regions = page.locator('[data-scrollable-table="true"]');

    await expect(regions).toHaveCount(route.regionCount);
    let scrollableCount = 0;

    for (let index = 0; index < route.regionCount; index += 1) {
      const region = regions.nth(index);
      await expect(region).toHaveAttribute("tabindex", "0");
      await region.focus();
      await expect(region).toBeFocused();
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

    expect(scrollableCount).toBe(route.scrollableCount);

    await checkA11y(page, "main#main-content", {
      includedImpacts: ["critical", "serious"],
    });
  }
});
