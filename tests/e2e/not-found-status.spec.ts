import { expect, test } from "@playwright/test";

/**
 * Not-found status contract.
 *
 * Any URL the site does not serve must answer 404. A 5xx tells crawlers the
 * site is broken rather than the page is gone, which is a far more damaging
 * signal, and it shows buyers a server error when they follow a stale link.
 *
 * Paths containing a dot skip the middleware matcher, so they never reach the
 * locale routing that the [locale] segment's not-found page depends on. They
 * are the cases that regress silently.
 */

const MISSING_PATHS = [
  "/nope",
  "/products/not-a-real-product",
  "/random.txt",
  "/does-not-exist.svg",
  "/images/retired-asset.jpg",
  "/next.svg",
] as const;

test.describe("Missing URLs answer 404", () => {
  for (const path of MISSING_PATHS) {
    test(`${path} returns 404`, async ({ page }) => {
      const response = await page.goto(`http://localhost:3000${path}`, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), `${path} should be 404`).toBe(404);
    });
  }

  test("a served asset still returns 200", async ({ page }) => {
    const response = await page.goto(
      "http://localhost:3000/images/tucsenberg-og.png",
      { waitUntil: "domcontentloaded" },
    );

    expect(response?.status()).toBe(200);
  });
});
