import { expect, test } from "@playwright/test";
import { waitForStablePage } from "./test-environment-setup";

test("dark theme preference survives a page reload", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);

  const cookieDialog = page.getByRole("dialog", {
    name: /cookie preferences/i,
  });
  await expect(cookieDialog).toBeVisible();
  await cookieDialog.getByRole("button", { name: /accept all/i }).click();
  await expect(cookieDialog).not.toBeVisible();

  const darkThemeButton = page
    .getByTestId("footer-theme-toggle")
    .getByRole("button", { name: "Switch to dark theme" });
  await expect(darkThemeButton).toBeEnabled();
  await darkThemeButton.click();
  await expect(page.locator("html")).toHaveClass(/dark/u);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForStablePage(page);
  await expect(page.locator("html")).toHaveClass(/dark/u);
});
