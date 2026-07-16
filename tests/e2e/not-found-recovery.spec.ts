import { expect, test } from "@playwright/test";

test("unknown routes render the site 404 with a homepage recovery link", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist", {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBe(404);

  const main = page.getByRole("main");
  await expect(main.getByText("404", { exact: true })).toBeVisible();
  await expect(
    main.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(
    main.getByRole("link", { name: "Back to homepage" }),
  ).toBeVisible();
});
