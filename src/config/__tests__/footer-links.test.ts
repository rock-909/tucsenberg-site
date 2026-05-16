import { describe, expect, it } from "vitest";
import { SINGLE_SITE_FOOTER_COLUMNS } from "@/config/single-site";
import {
  FEATURED_COMPATIBLE_BRAND_HREF,
  FEATURED_MEMBRANE_HREF,
  SINGLE_SITE_ROUTE_HREFS,
} from "@/config/single-site-links";
import { FOOTER_COLUMNS } from "@/config/footer-links";

describe("footer-links", () => {
  it("exports footer columns with valid structure", () => {
    expect(Array.isArray(FOOTER_COLUMNS)).toBe(true);
    expect(FOOTER_COLUMNS).toBe(SINGLE_SITE_FOOTER_COLUMNS);
    expect(FOOTER_COLUMNS.length).toBeGreaterThan(0);

    for (const column of FOOTER_COLUMNS) {
      expect(typeof column.key).toBe("string");
      expect(column.key.length).toBeGreaterThan(0);
      expect(typeof column.translationKey).toBe("string");
      expect(column.translationKey.length).toBeGreaterThan(0);
      expect(Array.isArray(column.links)).toBe(true);

      for (const link of column.links) {
        expect(typeof link.key).toBe("string");
        expect(link.key.length).toBeGreaterThan(0);
        expect(typeof link.translationKey).toBe("string");
        expect(link.translationKey.length).toBeGreaterThan(0);
        expect(typeof link.href).toBe("string");
        expect(link.href.length).toBeGreaterThan(0);
      }
    }
  });

  it("routes shipped Step-4 footer links to live pages and keeps only future scope on #coming-soon", () => {
    const footerLinks = FOOTER_COLUMNS.flatMap((column) => column.links);
    const hrefByKey = (key: string) =>
      footerLinks.find((link) => link.key === key)?.href;

    // Shipped Step-4 pages: real routes, never the placeholder.
    expect(hrefByKey("membranes")).toBe(FEATURED_MEMBRANE_HREF);
    expect(hrefByKey("compatibility")).toBe(FEATURED_COMPATIBLE_BRAND_HREF);
    expect(hrefByKey("quote")).toBe(SINGLE_SITE_ROUTE_HREFS.quote);

    for (const key of ["membranes", "compatibility", "quote"]) {
      expect(hrefByKey(key)).not.toBe(SINGLE_SITE_ROUTE_HREFS.comingSoon);
    }

    // Materials is genuinely future scope and intentionally stays placeholder.
    expect(hrefByKey("materials")).toBe(SINGLE_SITE_ROUTE_HREFS.comingSoon);
  });

  it("does not expose unconfirmed Tucsenberg social URLs", () => {
    const footerLinks = FOOTER_COLUMNS.flatMap((column) => column.links);

    expect(
      footerLinks.some((link) => link.href.includes("x.com/tucsenberg")),
    ).toBe(false);
    expect(
      footerLinks.some((link) =>
        link.href.includes("linkedin.com/company/tucsenberg"),
      ),
    ).toBe(false);
  });
});
