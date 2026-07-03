import { expect, test } from "@playwright/test";

const pageCases = [
  ["/", /Factory-Direct Flood Barriers from China/i],
  ["/products", /Flood Barrier Product Lines/i],
  ["/products/abs-flood-barriers", /ABS Interlocking Boxwall Flood Barriers/i],
  [
    "/products/aluminum-flood-gates",
    /Aluminum Flood Gates & Demountable Barrier Systems/i,
  ],
  ["/products/absorbent-flood-bags", /Absorbent Flood Bags/i],
  ["/products/flood-tube-dams", /Water & Air-Filled Flood Tube Dams/i],
  ["/products/frp-flood-barriers", /FRP Composite Flood Barrier Planks/i],
  ["/oem-wholesale", /OEM, Private Label & Wholesale Supply/i],
  [
    "/guides/flood-barrier-materials-guide",
    /ABS vs Aluminum vs FRP vs Water-Filled Flood Barriers/i,
  ],
  ["/guides/flood-barrier-specifications", /Flood Barrier Specifications/i],
  ["/about", /Who you're actually buying from/i],
  ["/request-quote", /Get real numbers, fast/i],
  ["/contact", /Contact/i],
  ["/warranty", /Warranty Policy/i],
  ["/privacy", /Privacy Policy/i],
  ["/terms", /Terms of Service/i],
] as const;

test.describe("Tucsenberg site smoke", () => {
  for (const [path, heading] of pageCases) {
    test(`${path} renders current site content`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${path} should return HTTP 200`).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
    });
  }

  test("/zh is not a live language route", async ({ page }) => {
    const response = await page.goto("/zh", { waitUntil: "domcontentloaded" });

    expect(response?.status(), "/zh should return HTTP 404").toBe(404);
    await expect(page.getByText("简体中文")).toHaveCount(0);
    await expect(page.locator('a[hreflang="zh"]')).toHaveCount(0);
    await expect(page.locator('a[href="/zh"]')).toHaveCount(0);
  });

  test("public PDF downloads stay noindex", async ({ request }) => {
    const response = await request.head("/downloads/spec-sheet-tb-ag.pdf");

    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toBe("noindex");
  });
});
