import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error - inject test Turnstile site key for Playwright runs
    window.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
  });
});

test("product interest reaches the RFQ submission without claiming product identity", async ({
  page,
}) => {
  let submittedBody: Record<string, unknown> | undefined;

  await page.route("**/api/inquiry", async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { referenceId: "nightly-rfq-1" },
      }),
    });
  });

  await page.goto("/products/frp-flood-barriers", {
    waitUntil: "domcontentloaded",
  });

  const interestLink = page
    .getByRole("link", {
      exact: true,
      name: "Register interest",
    })
    .first();
  await expect(interestLink).toHaveAttribute(
    "href",
    "/request-quote?interest=frp-planks",
  );

  await interestLink.click();
  await expect(page).toHaveURL(/\/request-quote\?interest=frp-planks$/);

  const form = page.locator('form[data-lead-path="api-inquiry"]');
  await form.scrollIntoViewIfNeeded();
  await expect(page.getByTestId("inquiry-form")).toBeVisible({
    timeout: 15_000,
  });
  await form.locator('[name="fullName"]').fill("Nightly Buyer");
  await form.locator('[name="email"]').fill("nightly@example.com");
  await form.locator('[name="message"]').fill("Need FRP barrier details.");

  await expect(page.getByTestId("turnstile-mock")).toBeVisible({
    timeout: 15_000,
  });

  const submit = form.locator('button[type="submit"]');
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await submit.click();

  await expect(form.getByRole("status")).toContainText("nightly-rfq-1");
  expect(submittedBody).toMatchObject({
    buyerInterest: "frp-planks",
    productInquiryKind: "general-rfq",
  });
  expect(submittedBody).not.toHaveProperty("catalogProductId");
});
