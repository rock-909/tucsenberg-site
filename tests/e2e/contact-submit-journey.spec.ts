import { expect, test } from "@playwright/test";
import { buildCanarySelectors } from "./smoke/canary-selectors";

test("buyer fills contact form, clicks submit, sees success", async ({
  page,
}) => {
  const selectors = buildCanarySelectors();
  await page.route("**/api/inquiry", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { referenceId: "e2e-ref-1" },
      }),
    }),
  );
  await page.goto("/contact");

  // Contact form island loads via IntersectionObserver — scroll it into view
  // so the progressive-enhancement shell is replaced by the live client form.
  await page
    .getByTestId("contact-form-column")
    .scrollIntoViewIfNeeded({ timeout: 5_000 });

  const fullName = page.locator('input[name="fullName"]');
  await expect(fullName).toBeEditable({ timeout: 15_000 });

  await fullName.fill("E2E Buyer");
  await page.locator('input[name="email"]').fill("buyer@example.com");

  // LazyTurnstile mounts after idle/IO; wait for the test-mode token to settle.
  await expect(page.getByTestId("turnstile-mock")).toBeVisible({
    timeout: 15_000,
  });

  const submit = page.getByRole("button", { name: selectors.submitLabel });
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await submit.click();
  await expect(page.getByText(selectors.successPrefix)).toBeVisible();
});
