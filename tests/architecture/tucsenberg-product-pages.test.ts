import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getAllMarketSlugs } from "@/constants/product-catalog";
import { TUCSENBERG_PRODUCT_PAGES } from "@/constants/tucsenberg-product-pages";

describe("Tucsenberg product page copy contract", () => {
  it("covers every live product route with owner-approved product page data", () => {
    expect(Object.keys(TUCSENBERG_PRODUCT_PAGES)).toEqual(getAllMarketSlugs());
  });

  it("keeps each product page RFQ-ready without public price or price offers", () => {
    for (const [slug, page] of Object.entries(TUCSENBERG_PRODUCT_PAGES)) {
      const pagePayload = JSON.stringify(page);

      expect(page.title, slug).toBeTruthy();
      expect(page.lead, slug).toBeTruthy();
      expect(page.cta.label, slug).toMatch(/quote|interest/iu);
      expect(page.sections.length, slug).toBeGreaterThanOrEqual(4);
      expect(page.faqs.length, slug).toBeGreaterThanOrEqual(3);
      expect(page.downloadHref, slug).toMatch(/^\/downloads\/.+\.pdf$/u);
      expect(pagePayload, slug).not.toMatch(/offers"\s*:\s*\{/iu);
      expect(pagePayload, slug).not.toMatch(/price"\s*:/iu);
      expect(pagePayload, slug).not.toMatch(/[$€£]\s*\d/u);
      expect(pagePayload, slug).not.toContain("TODO-OWNER");
    }
  });

  it("uses explicit product image state instead of placeholder paths", () => {
    for (const [slug, page] of Object.entries(TUCSENBERG_PRODUCT_PAGES)) {
      const image = page.image;

      expect(["real", "pending", "omitted"], slug).toContain(image.status);
      expect(JSON.stringify(page), slug).not.toMatch(
        /\/images\/products\/.*placeholder/iu,
      );

      if (image.status === "real") {
        expect(image.src, slug).toMatch(/^\//u);
        expect(image.src, slug).not.toContain("placeholder");
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- product image paths are fixed owner-authored constants validated against public/
        expect(existsSync(join(process.cwd(), "public", image.src))).toBe(true);
      }
    }
  });

  it("uses FAQ questions as display headings and schema source", () => {
    for (const [slug, page] of Object.entries(TUCSENBERG_PRODUCT_PAGES)) {
      for (const faq of page.faqs) {
        expect(faq.question, slug).toMatch(/\?$/u);
        expect(faq.answer, `${slug} ${faq.question}`).not.toContain("TODO");
      }
    }
  });
});
