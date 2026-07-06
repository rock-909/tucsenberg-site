import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PRODUCT_MARKET_ROUTE_FILES = [
  "src/app/[locale]/products/[market]/page.tsx",
  "src/app/[locale]/products/[market]/market-page-data.ts",
  "src/app/[locale]/products/[market]/market-jsonld.ts",
  "src/app/[locale]/products/[market]/market-page-sections.tsx",
  "src/app/[locale]/products/[market]/market-spec-presenter.ts",
] as const;

const MARKET_SPEC_DIRECT_IMPORT_PATTERN =
  /@\/constants\/product-specs\/(north-america|australia-new-zealand|mexico|europe|specialty-product-systems)/;
const MARKET_SPEC_REGISTRY_IMPORT_PATTERN =
  /from\s+["']@\/constants\/product-specs\/market-spec-registry["']/;
const TUCSENBERG_PRODUCT_PAGE_IMPORT_PATTERN =
  /from\s+["']@\/constants\/tucsenberg-product-pages["']/;
const ROUTE_LOCAL_SPEC_MAP_NAME = ["SPECS", "BY", "MARKET"].join("_");

function readSource(filePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- architecture test reads fixed repo-local files
  return readFileSync(filePath, "utf8");
}

describe("product market route boundary", () => {
  it("keeps individual market spec imports out of the route directory", () => {
    for (const filePath of PRODUCT_MARKET_ROUTE_FILES) {
      expect(readSource(filePath), filePath).not.toMatch(
        MARKET_SPEC_DIRECT_IMPORT_PATTERN,
      );
    }
  });

  it("keeps the current route JSON-LD flow on Tucsenberg product pages, not legacy specs", () => {
    const currentRouteFiles = [
      "src/app/[locale]/products/[market]/page.tsx",
      "src/app/[locale]/products/[market]/market-page-data.ts",
      "src/app/[locale]/products/[market]/market-jsonld.ts",
    ] as const;
    const pageSource = readSource(
      "src/app/[locale]/products/[market]/page.tsx",
    );

    expect(pageSource).toMatch(TUCSENBERG_PRODUCT_PAGE_IMPORT_PATTERN);

    for (const filePath of currentRouteFiles) {
      const source = readSource(filePath);

      expect(source, filePath).not.toMatch(MARKET_SPEC_REGISTRY_IMPORT_PATTERN);
      expect(source, filePath).not.toContain("familySpecsMap");
      expect(source, filePath).not.toContain(ROUTE_LOCAL_SPEC_MAP_NAME);
      expect(source, filePath).not.toContain("SITE_CONFIG.brandAssets");
    }
  });
});
