import { describe, expect, it } from "vitest";
import { NORTH_AMERICA_SPECS } from "../north-america";
import type { MarketSpecs } from "../types";

describe("Feature: Specification Data Architecture", () => {
  describe("Scenario: North America spec data is available", () => {
    it("exports a valid MarketSpecs object", () => {
      const specs: MarketSpecs = NORTH_AMERICA_SPECS;
      expect(specs).toBeDefined();
    });

    it("includes technical properties", () => {
      expect(NORTH_AMERICA_SPECS.technical).toHaveProperty("material");
      expect(NORTH_AMERICA_SPECS.technical).toHaveProperty("temperatureRange");
    });

    it("includes certifications", () => {
      expect(NORTH_AMERICA_SPECS.certifications).toContain(
        "Example Standard A",
      );
      expect(NORTH_AMERICA_SPECS.certifications).toContain("ISO 9001:2015");
    });

    it("includes trade information", () => {
      expect(NORTH_AMERICA_SPECS.trade.moq).toBeDefined();
      expect(NORTH_AMERICA_SPECS.trade.leadTime).toBeDefined();
      expect(NORTH_AMERICA_SPECS.trade.portOfLoading).toBeDefined();
    });

    it("includes spec groups for all 3 families", () => {
      expect(NORTH_AMERICA_SPECS.families).toHaveLength(3);
      const slugs = NORTH_AMERICA_SPECS.families.map((f) => f.slug);
      expect(slugs).toContain("sample-product-shapes");
      expect(slugs).toContain("couplings");
      expect(slugs).toContain("sample-product-runs");
    });

    it("sample product shapes family has Basic Option and Advanced Option groups", () => {
      const shapes = NORTH_AMERICA_SPECS.families.find(
        (f) => f.slug === "sample-product-shapes",
      )!;
      const groupLabels = shapes.specGroups.map((g) => g.groupLabel);
      expect(groupLabels).toContain("Basic Option");
      expect(groupLabels).toContain("Advanced Option");
    });

    it("each family has exactly 3 highlights", () => {
      for (const family of NORTH_AMERICA_SPECS.families) {
        expect(family.highlights).toHaveLength(3);
      }
    });

    it("spec group rows match column count", () => {
      for (const family of NORTH_AMERICA_SPECS.families) {
        for (const group of family.specGroups) {
          for (const row of group.rows) {
            expect(row).toHaveLength(group.columns.length);
          }
        }
      }
    });
  });
});
