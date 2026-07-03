import { describe, expect, it } from "vitest";
import { SPECIALTY_PRODUCT_SPECS } from "../specialty-product-systems";
import type { MarketSpecs } from "../types";

describe("Feature: Specification Data Architecture", () => {
  describe("Scenario: Specialty example spec data is available", () => {
    it("exports a valid MarketSpecs object", () => {
      const specs: MarketSpecs = SPECIALTY_PRODUCT_SPECS;
      expect(specs).toBeDefined();
    });

    it("includes technical properties with specialty example material", () => {
      expect(SPECIALTY_PRODUCT_SPECS.technical).toHaveProperty("material");
      expect(SPECIALTY_PRODUCT_SPECS.technical.material).toMatch(
        /Specialty example material/i,
      );
    });

    it("includes certifications with ISO 9001:2015", () => {
      expect(SPECIALTY_PRODUCT_SPECS.certifications).toContain("ISO 9001:2015");
    });

    it("includes starter trade information", () => {
      expect(SPECIALTY_PRODUCT_SPECS.trade.moq).toBe("Example minimum order");
      expect(SPECIALTY_PRODUCT_SPECS.trade.leadTime).toBeDefined();
      expect(SPECIALTY_PRODUCT_SPECS.trade.portOfLoading).toBeDefined();
    });

    it("includes exactly 2 families: specialty-units and fittings", () => {
      expect(SPECIALTY_PRODUCT_SPECS.families).toHaveLength(2);
      const slugs = SPECIALTY_PRODUCT_SPECS.families.map((f) => f.slug);
      expect(slugs).toContain("specialty-units");
      expect(slugs).toContain("fittings");
    });

    it("specialty-units family has compact and extended groups", () => {
      const specialtyTubes = SPECIALTY_PRODUCT_SPECS.families.find(
        (f) => f.slug === "specialty-units",
      )!;
      const groupLabels = specialtyTubes.specGroups.map((g) => g.groupLabel);
      expect(groupLabels).toContain("Compact Format");
      expect(groupLabels).toContain("Extended Format");
    });

    it("fittings family exists with spec groups", () => {
      const fittings = SPECIALTY_PRODUCT_SPECS.families.find(
        (f) => f.slug === "fittings",
      )!;
      expect(fittings).toBeDefined();
      expect(fittings.specGroups.length).toBeGreaterThan(0);
    });

    it("specialty-units highlights include specialty example material", () => {
      const specialtyTubes = SPECIALTY_PRODUCT_SPECS.families.find(
        (f) => f.slug === "specialty-units",
      )!;
      expect(
        specialtyTubes.highlights.some((h) =>
          /specialty example material/i.test(h),
        ),
      ).toBe(true);
    });

    it("spec group rows match column count", () => {
      for (const family of SPECIALTY_PRODUCT_SPECS.families) {
        for (const group of family.specGroups) {
          for (const row of group.rows) {
            expect(row).toHaveLength(group.columns.length);
          }
        }
      }
    });

    it("technical properties include transparency and pressure", () => {
      expect(SPECIALTY_PRODUCT_SPECS.technical).toHaveProperty("transparency");
      expect(SPECIALTY_PRODUCT_SPECS.technical).toHaveProperty(
        "maxWorkingPressure",
      );
      expect(SPECIALTY_PRODUCT_SPECS.technical).toHaveProperty(
        "temperatureRange",
      );
    });
  });
});
