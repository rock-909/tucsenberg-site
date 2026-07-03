import { describe, expect, it } from "vitest";
import { AUSTRALIA_NZ_SPECS } from "../australia-new-zealand";
import type { MarketSpecs } from "../types";

describe("Feature: AU/NZ Spec Data", () => {
  it("exports a valid MarketSpecs object", () => {
    const specs: MarketSpecs = AUSTRALIA_NZ_SPECS;
    expect(specs).toBeDefined();
  });

  it("includes Example Standard B certification", () => {
    expect(AUSTRALIA_NZ_SPECS.certifications).toContain("Example Standard B");
  });

  it("uses generic starter size values in spec tables", () => {
    const firstFamily = AUSTRALIA_NZ_SPECS.families[0]!;
    const firstRow = firstFamily.specGroups[0]!.rows[0]!;
    expect(firstRow[0]).toBe("Small");
  });

  it("has Standard Tier and Premium Tier groups", () => {
    const shapes = AUSTRALIA_NZ_SPECS.families.find(
      (f) => f.slug === "sample-product-shapes",
    )!;
    const labels = shapes.specGroups.map((g) => g.groupLabel);
    expect(labels).toContain("Standard Tier");
    expect(labels).toContain("Premium Tier");
  });

  it("includes bellmouths family (unique to AU/NZ)", () => {
    const slugs = AUSTRALIA_NZ_SPECS.families.map((f) => f.slug);
    expect(slugs).toContain("bellmouths");
  });

  it("bellmouths family includes 'Resource entry support' highlight", () => {
    const bellmouths = AUSTRALIA_NZ_SPECS.families.find(
      (f) => f.slug === "bellmouths",
    )!;
    expect(bellmouths.highlights).toContain("Resource entry support");
  });

  it("includes all 4 families matching product-catalog.ts", () => {
    expect(AUSTRALIA_NZ_SPECS.families).toHaveLength(4);
    const slugs = AUSTRALIA_NZ_SPECS.families.map((f) => f.slug);
    expect(slugs).toContain("sample-product-shapes");
    expect(slugs).toContain("bellmouths");
    expect(slugs).toContain("couplings");
    expect(slugs).toContain("sample-product-runs");
  });

  it("spec group rows match column count", () => {
    for (const family of AUSTRALIA_NZ_SPECS.families) {
      for (const group of family.specGroups) {
        for (const row of group.rows) {
          expect(row).toHaveLength(group.columns.length);
        }
      }
    }
  });
});
