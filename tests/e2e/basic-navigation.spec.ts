import { expect, test } from "@playwright/test";
import { getHeaderMobileMenuButton, getNav } from "./helpers/navigation";
import {
  removeInterferingElements,
  waitForLoadWithFallback,
  waitForStablePage,
} from "./test-environment-setup";

test.describe("Basic Navigation", () => {
  test("should load homepage successfully", async ({ page }) => {
    // localePrefix: 'always' 要求所有路径必须包含语言前缀
    await page.goto("/en");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if the Step 2 brand title is correct
    await expect(page).toHaveTitle(/Tucsenberg/);

    // Check if main navigation is present - use first() to avoid strict mode violation
    const navigation = page.locator("nav").first();
    await expect(navigation).toBeVisible();
  });

  test("should navigate between pages", async ({ page }) => {
    // localePrefix: 'always' 要求所有路径必须包含语言前缀
    await page.goto("/en");
    await waitForLoadWithFallback(page, {
      context: "basic navigation about link",
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });
    await removeInterferingElements(page);
    await waitForStablePage(page);

    // Step 2 public nav is Tucsenberg-specific placeholder IA; real content
    // routes such as About remain reachable directly but are no longer nav items.
    const nav = getNav(page);
    const membranesLink = nav.getByRole("link", { name: "Membranes" });
    await expect(membranesLink).toBeVisible({ timeout: 10_000 });
    await expect(membranesLink).toHaveAttribute("href", "#coming-soon");

    await membranesLink.click();
    await expect(page).toHaveURL(/\/en\/?#coming-soon$/);

    const aboutResponse = await page.goto("/en/about");
    expect(aboutResponse?.status()).toBe(200);
  });

  test("should handle language switching", async ({ page }) => {
    // localePrefix: 'always' 要求所有路径必须包含语言前缀
    await page.goto("/en");

    // Look for language switcher
    const languageSwitcher = page
      .locator('[data-testid="language-switcher"]')
      .or(
        page
          .locator('button:has-text("EN")')
          .or(page.locator('button:has-text("ES")')),
      );

    if (await languageSwitcher.first().isVisible()) {
      await languageSwitcher.first().click();
      await page.waitForLoadState("networkidle");

      const spanishLink = page
        .locator('[data-testid="language-link-es"]')
        .first();

      if (await spanishLink.isVisible()) {
        await spanishLink.click();
        await expect(page).toHaveURL(/\/es(\/|$)/);
      } else {
        // If the control rendered as a non-expanded toggle in this viewport,
        // the public language surface must still be en/es-only.
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/(en|es)(\/|$)/);
      }
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    // localePrefix: 'always' 要求所有路径必须包含语言前缀
    await page.goto("/en");
    await waitForLoadWithFallback(page, {
      context: "mobile responsive test",
      loadTimeout: 5_000,
      fallbackDelay: 500,
    });
    await removeInterferingElements(page);
    await waitForStablePage(page);

    // Check if mobile navigation works - match actual component: "Toggle mobile menu"
    const mobileMenuButton = getHeaderMobileMenuButton(page);

    // 在移动视口下，菜单按钮应该可见（给予更多等待时间）
    await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
    await expect(mobileMenuButton).toHaveAttribute("aria-haspopup", "dialog");

    // 点击菜单按钮
    await mobileMenuButton.click();

    // Check if mobile menu opens - wait for menu animation
    // 移动菜单可能是 sheet, dialog, 或带有特定 data-state 的元素
    const mobileMenu = page
      .locator('[data-testid="mobile-menu-content"]')
      .or(
        page.locator('[data-testid="header-mobile-navigation-fallback-panel"]'),
      )
      .or(page.locator('[data-testid="mobile-menu"]'))
      .or(page.locator(".mobile-menu"))
      .or(page.locator('[data-state="open"][role="dialog"]'))
      .or(page.getByRole("dialog"));
    await expect(mobileMenu.first()).toBeVisible({ timeout: 5000 });
  });
});
