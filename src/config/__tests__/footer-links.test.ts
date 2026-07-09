import { describe, expect, it } from "vitest";
import {
  getSingleSiteFooterColumns,
  SINGLE_SITE_FOOTER_COLUMNS,
} from "@/config/single-site";
import { SOURCE_RUNTIME_MESSAGE_PROFILE_ID } from "@/config/active-starter-profile";
import { FOOTER_COLUMNS } from "@/config/footer-links";
import { DEFAULT_STARTER_PROFILE_ID } from "@/config/starter-profiles";

const EXPECTED_TUCSENBERG_NAVIGATION_LINKS = [
  "home",
  "products",
  "oemWholesale",
  "materialsGuide",
  "about",
] as const;

const EXPECTED_TUCSENBERG_SUPPORT_LINKS = [
  "requestQuote",
  "contact",
  "warranty",
  "privacy",
  "terms",
] as const;

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

  it("uses the source runtime profile for singleton footer links", () => {
    expect(SOURCE_RUNTIME_MESSAGE_PROFILE_ID).toBe("catalog");
    expect(SINGLE_SITE_FOOTER_COLUMNS).toEqual(
      getSingleSiteFooterColumns(SOURCE_RUNTIME_MESSAGE_PROFILE_ID),
    );

    const navigationColumn = FOOTER_COLUMNS.find(
      (column) => column.key === "navigation",
    );
    const supportColumn = FOOTER_COLUMNS.find(
      (column) => column.key === "support",
    );

    expect(navigationColumn?.links.map((link) => link.key)).toEqual([
      ...EXPECTED_TUCSENBERG_NAVIGATION_LINKS,
    ]);
    expect(supportColumn?.links.map((link) => link.key)).toEqual([
      ...EXPECTED_TUCSENBERG_SUPPORT_LINKS,
    ]);
  });

  it("can derive the default materialized catalog footer links explicitly", () => {
    expect(DEFAULT_STARTER_PROFILE_ID).toBe("catalog");
    const columns = getSingleSiteFooterColumns(DEFAULT_STARTER_PROFILE_ID);
    const navigationColumn = columns.find(
      (column) => column.key === "navigation",
    );
    const supportColumn = columns.find((column) => column.key === "support");

    expect(navigationColumn?.links.map((link) => link.key)).toEqual([
      ...EXPECTED_TUCSENBERG_NAVIGATION_LINKS,
    ]);
    expect(supportColumn?.links.map((link) => link.key)).toEqual([
      ...EXPECTED_TUCSENBERG_SUPPORT_LINKS,
    ]);
  });

  it("can derive the catalog footer navigation links", () => {
    const columns = getSingleSiteFooterColumns("catalog");
    const navigationColumn = columns.find(
      (column) => column.key === "navigation",
    );

    expect(navigationColumn?.links.map((link) => link.key)).toEqual([
      ...EXPECTED_TUCSENBERG_NAVIGATION_LINKS,
    ]);
  });
});
