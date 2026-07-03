import { describe, expect, it } from "vitest";
import { MEXICO_SPECS } from "../mexico";
import type { MarketSpecs } from "../types";

describe("Feature: Mexico Spec Data", () => {
  it("exports a valid MarketSpecs object", () => {
    const specs: MarketSpecs = MEXICO_SPECS;
    expect(specs).toBeDefined();
  });

  it("includes Example Standard C certification", () => {
    expect(MEXICO_SPECS.certifications).toContain("Example Standard C");
  });

  it("uses generic starter size values in spec tables", () => {
    const firstFamily = MEXICO_SPECS.families[0]!;
    const firstRow = firstFamily.specGroups[0]!.rows[0]!;
    expect(firstRow[0]).toBe("Small");
  });

  it("has Light Tier and Heavy Tier groups", () => {
    const shapes = MEXICO_SPECS.families.find(
      (f) => f.slug === "sample-product-shapes",
    )!;
    const labels = shapes.specGroups.map((g) => g.groupLabel);
    expect(labels).toContain("Light Tier");
    expect(labels).toContain("Heavy Tier");
  });

  it("does not include bellmouths family", () => {
    const slugs = MEXICO_SPECS.families.map((f) => f.slug);
    expect(slugs).not.toContain("bellmouths");
  });

  it("includes exactly 3 families matching product-catalog.ts", () => {
    expect(MEXICO_SPECS.families).toHaveLength(3);
    const slugs = MEXICO_SPECS.families.map((f) => f.slug);
    expect(slugs).toContain("sample-product-shapes");
    expect(slugs).toContain("couplings");
    expect(slugs).toContain("sample-product-runs");
  });

  it("sample-product-shapes highlights include Example Standard C readiness", () => {
    const shapes = MEXICO_SPECS.families.find(
      (f) => f.slug === "sample-product-shapes",
    )!;
    expect(shapes.highlights).toContain("Example Standard C ready");
  });

  it("spec group rows match column count", () => {
    for (const family of MEXICO_SPECS.families) {
      for (const group of family.specGroups) {
        for (const row of group.rows) {
          expect(row).toHaveLength(group.columns.length);
        }
      }
    }
  });
});
