import { describe, expect, it } from "vitest";
import { EUROPE_SPECS } from "../europe";
import type { MarketSpecs } from "../types";

describe("Feature: Europe Spec Data", () => {
  it("exports a valid MarketSpecs object", () => {
    const specs: MarketSpecs = EUROPE_SPECS;
    expect(specs).toBeDefined();
  });

  it("includes Example Standard D certification", () => {
    expect(EUROPE_SPECS.certifications).toContain("Example Standard D");
  });

  it("uses generic starter size values in spec tables", () => {
    const firstFamily = EUROPE_SPECS.families[0]!;
    const firstRow = firstFamily.specGroups[0]!.rows[0]!;
    expect(firstRow[0]).toBe("Small");
  });

  it("has Light, Medium, and Heavy tier groups", () => {
    const shapes = EUROPE_SPECS.families.find(
      (f) => f.slug === "sample-product-shapes",
    )!;
    const labels = shapes.specGroups.map((g) => g.groupLabel);
    expect(labels).toContain("Light Tier");
    expect(labels).toContain("Medium Tier");
    expect(labels).toContain("Heavy Tier");
  });

  it("includes exactly 3 families matching product-catalog.ts", () => {
    expect(EUROPE_SPECS.families).toHaveLength(3);
    const slugs = EUROPE_SPECS.families.map((f) => f.slug);
    expect(slugs).toContain("sample-product-shapes");
    expect(slugs).toContain("couplings");
    expect(slugs).toContain("sample-product-runs");
  });

  it("sample-product-shapes highlights include Example Standard D readiness", () => {
    const shapes = EUROPE_SPECS.families.find(
      (f) => f.slug === "sample-product-shapes",
    )!;
    expect(shapes.highlights).toContain("Example Standard D ready");
  });

  it("spec group rows match column count", () => {
    for (const family of EUROPE_SPECS.families) {
      for (const group of family.specGroups) {
        for (const row of group.rows) {
          expect(row).toHaveLength(group.columns.length);
        }
      }
    }
  });
});
