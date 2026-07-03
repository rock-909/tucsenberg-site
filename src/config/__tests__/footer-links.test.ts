import { describe, expect, it } from "vitest";
import {
  getSingleSiteFooterColumns,
  SINGLE_SITE_FOOTER_COLUMNS,
} from "@/config/single-site";
import { SOURCE_RUNTIME_MESSAGE_PROFILE_ID } from "@/config/active-starter-profile";
import { FOOTER_COLUMNS } from "@/config/footer-links";
import { DEFAULT_STARTER_PROFILE_ID } from "@/config/starter-profiles";

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
    expect(SOURCE_RUNTIME_MESSAGE_PROFILE_ID).toBe("showcase-full");
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
      "home",
      "products",
      "blog",
      "resources",
      "about",
    ]);
    expect(supportColumn?.links.map((link) => link.key)).toEqual([
      "contact",
      "privacy",
      "terms",
    ]);
  });

  it("can derive the default generated company-site footer links explicitly", () => {
    expect(DEFAULT_STARTER_PROFILE_ID).toBe("company-site");
    const columns = getSingleSiteFooterColumns(DEFAULT_STARTER_PROFILE_ID);
    const navigationColumn = columns.find(
      (column) => column.key === "navigation",
    );
    const supportColumn = columns.find((column) => column.key === "support");

    expect(navigationColumn?.links.map((link) => link.key)).toEqual([
      "home",
      "products",
      "blog",
      "resources",
      "about",
    ]);
    expect(supportColumn?.links.map((link) => link.key)).toEqual([
      "contact",
      "privacy",
      "terms",
    ]);
  });

  it("can still derive showcase-full footer navigation links", () => {
    const columns = getSingleSiteFooterColumns("showcase-full");
    const navigationColumn = columns.find(
      (column) => column.key === "navigation",
    );

    expect(navigationColumn?.links.map((link) => link.key)).toEqual([
      "home",
      "products",
      "blog",
      "resources",
      "about",
    ]);
  });

  it("can derive minimal footer links without omitted routes", () => {
    const columns = getSingleSiteFooterColumns("minimal");
    const navigationColumn = columns.find(
      (column) => column.key === "navigation",
    );
    const supportColumn = columns.find((column) => column.key === "support");

    expect(navigationColumn?.links.map((link) => link.key)).toEqual(["home"]);
    expect(supportColumn?.links.map((link) => link.key)).toEqual([
      "privacy",
      "terms",
    ]);
  });
});
