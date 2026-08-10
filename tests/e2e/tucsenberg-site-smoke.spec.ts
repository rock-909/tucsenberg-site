import { expect, test } from "@playwright/test";
import { SITE_PAGE_CASES } from "./site-page-cases";

test.describe("Tucsenberg site smoke", () => {
  for (const [path, heading] of SITE_PAGE_CASES) {
    test(`${path} renders current site content`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${path} should return HTTP 200`).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
    });
  }

  test("current site renders the configured English locale", async ({
    page,
  }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(response?.status(), "/ should return HTTP 200").toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("unknown locale-like prefixes use the ordinary 404", async ({
    page,
  }) => {
    const response = await page.goto("/fr/contact", {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status(), "/fr/contact should return HTTP 404").toBe(404);
  });

  test("public PDF downloads stay noindex", async ({ request }) => {
    const response = await request.head("/downloads/spec-sheet-tb-ag.pdf");

    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toBe("noindex");
  });
});
