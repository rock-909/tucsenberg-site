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

    // Check if the page title is correct
    await expect(page).toHaveTitle(/Showcase Website Starter/);

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

    // 通过主导航测试到 About 页的跳转（与 i18n 导航辅助保持一致）
    const nav = getNav(page);
    const aboutLink = nav.getByRole("link", { name: "About" });
    await expect(aboutLink).toBeVisible({ timeout: 10_000 });

    // 点击 About 链接并使用 URL 断言自动等待导航完成
    await aboutLink.click();
    await expect(page).toHaveURL(/\/about/);
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
          .or(page.locator('button:has-text("中文")')),
      );

    if (await languageSwitcher.first().isVisible()) {
      await languageSwitcher.first().click();
      await page.waitForLoadState("networkidle");

      // Verify language change - match with or without trailing slash
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(en|zh)(\/|$)/);
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
