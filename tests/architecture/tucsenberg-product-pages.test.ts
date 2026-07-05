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

  it("uses FAQ questions as display headings and schema source", () => {
    for (const [slug, page] of Object.entries(TUCSENBERG_PRODUCT_PAGES)) {
      for (const faq of page.faqs) {
        expect(faq.question, slug).toMatch(/\?$/u);
        expect(faq.answer, `${slug} ${faq.question}`).not.toContain("TODO");
      }
    }
  });
});
