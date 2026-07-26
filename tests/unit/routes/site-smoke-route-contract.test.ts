import { describe, expect, it } from "vitest";
import { getSingleSitePublicStaticPages } from "@/config/single-site-seo";
import { TUCSENBERG_PRODUCT_PAGES } from "@/constants/tucsenberg-product-pages";
import { SITE_PAGE_CASES } from "../../e2e/site-page-cases";

/**
 * The smoke run is the only lane that loads every public page in a browser.
 * Its route list was hand-written with nothing tying it to the page registry,
 * so shipping a new page left it untested and the run still went green — an
 * absence of coverage reading as coverage.
 *
 * Same shape as `lighthouse-route-contract.test.ts`, which already closes this
 * hole for the measurement lane.
 */
const registryPaths = [
  ...getSingleSitePublicStaticPages().map((path) => path || "/"),
  ...Object.keys(TUCSENBERG_PRODUCT_PAGES).map((slug) => `/products/${slug}`),
];

const smokePaths = SITE_PAGE_CASES.map(([path]) => path);

describe("site smoke route contract", () => {
  it("visits every canonical public route", () => {
    expect([...smokePaths].sort()).toEqual([...registryPaths].sort());
  });

  it("visits each route once", () => {
    expect(new Set(smokePaths).size).toBe(smokePaths.length);
  });

  // A heading pattern that matches anything proves the page returned 200 and
  // nothing else. `/` would pass against the 404 page.
  it("checks a heading specific enough to fail on the wrong page", () => {
    for (const [path, heading] of SITE_PAGE_CASES) {
      expect(heading.source.length, path).toBeGreaterThan(3);
      expect(heading.test("Page not found"), path).toBe(false);
    }
  });
});
