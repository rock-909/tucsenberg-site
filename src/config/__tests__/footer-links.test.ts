import { describe, expect, it } from "vitest";
import { SINGLE_SITE_FOOTER_COLUMNS } from "@/config/single-site";
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
});
