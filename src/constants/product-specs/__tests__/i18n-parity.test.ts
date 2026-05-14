import { describe, expect, it } from "vitest";
import { PRODUCT_CATALOG } from "@/constants/product-catalog";
import { getMarketSpecEntries } from "@/constants/product-specs/market-spec-registry";

// Import translation JSON files
import enCritical from "../../../../messages/en/critical.json";
import zhCritical from "../../../../messages/zh/critical.json";

/**
 * Helper: Traverse nested objects using dot-separated paths.
 * Example: getNestedValue(obj, "catalog.markets.north-america.label")
 */
function getNestedValue(obj: unknown, dotPath: string): unknown {
  const keys = dotPath.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

describe("Feature: Product Translation Key Parity", () => {
  describe("Scenario: Market catalog entries have translations", () => {
    it("every market has label and description keys in both locales", () => {
      for (const market of PRODUCT_CATALOG.markets) {
        const enLabelKey = `catalog.markets.${market.slug}.label`;
        const enDescKey = `catalog.markets.${market.slug}.description`;
        const zhLabelKey = `catalog.markets.${market.slug}.label`;
        const zhDescKey = `catalog.markets.${market.slug}.description`;

        expect(
          getNestedValue(enCritical, enLabelKey),
          `missing en: ${enLabelKey}`,
        ).toBeDefined();
        expect(
          getNestedValue(enCritical, enDescKey),
          `missing en: ${enDescKey}`,
        ).toBeDefined();
        expect(
          getNestedValue(zhCritical, zhLabelKey),
          `missing zh: ${zhLabelKey}`,
        ).toBeDefined();
        expect(
          getNestedValue(zhCritical, zhDescKey),
          `missing zh: ${zhDescKey}`,
        ).toBeDefined();
      }
    });
  });

  describe("Scenario: Product families have translations", () => {
    it("every family has label and description keys in both locales", () => {
      for (const family of PRODUCT_CATALOG.families) {
        const enLabelKey = `catalog.families.${family.marketSlug}.${family.slug}.label`;
        const enDescKey = `catalog.families.${family.marketSlug}.${family.slug}.description`;
        const zhLabelKey = `catalog.families.${family.marketSlug}.${family.slug}.label`;
        const zhDescKey = `catalog.families.${family.marketSlug}.${family.slug}.description`;

        expect(
          getNestedValue(enCritical, enLabelKey),
          `missing en: ${enLabelKey}`,
        ).toBeDefined();
        expect(
          getNestedValue(enCritical, enDescKey),
          `missing en: ${enDescKey}`,
        ).toBeDefined();
        expect(
          getNestedValue(zhCritical, zhLabelKey),
          `missing zh: ${zhLabelKey}`,
        ).toBeDefined();
        expect(
          getNestedValue(zhCritical, zhDescKey),
          `missing zh: ${zhDescKey}`,
        ).toBeDefined();
      }
    });
  });

  describe("Scenario: Technical properties have shared label translations", () => {
    it("every technical property key has a shared label translation", () => {
      // Collect all unique technical keys from all market specs
      const allTechnicalKeys = new Set<string>();

      for (const specs of getMarketSpecEntries().map(([, specs]) => specs)) {
        for (const key of Object.keys(specs.technical)) {
          allTechnicalKeys.add(key);
        }
      }

      for (const key of allTechnicalKeys) {
        const enKey = `catalog.technicalLabels.${key}`;
        const zhKey = `catalog.technicalLabels.${key}`;

        expect(
          getNestedValue(enCritical, enKey),
          `missing en: ${enKey}`,
        ).toBeDefined();
        expect(
          getNestedValue(zhCritical, zhKey),
          `missing zh: ${zhKey}`,
        ).toBeDefined();
      }
    });
  });

  describe("Scenario: Family highlights have translations", () => {
    it("every family highlight count matches translation keys", () => {
      for (const [marketSlug, specs] of getMarketSpecEntries()) {
        for (const family of specs.families) {
          for (let i = 0; i < family.highlights.length; i++) {
            const enKey = `catalog.specs.${marketSlug}.families.${family.slug}.highlights.${i}`;
            const zhKey = `catalog.specs.${marketSlug}.families.${family.slug}.highlights.${i}`;

            expect(
              getNestedValue(enCritical, enKey),
              `missing en: ${enKey}`,
            ).toBeDefined();
            expect(
              getNestedValue(zhCritical, zhKey),
              `missing zh: ${zhKey}`,
            ).toBeDefined();
          }
        }
      }
    });
  });

  describe("Scenario: Spec groups have label translations", () => {
    it("every spec group has a label key in both locales", () => {
      for (const [marketSlug, specs] of getMarketSpecEntries()) {
        for (const family of specs.families) {
          for (
            let groupIdx = 0;
            groupIdx < family.specGroups.length;
            groupIdx++
          ) {
            const enKey = `catalog.specs.${marketSlug}.families.${family.slug}.groups.${groupIdx}.label`;
            const zhKey = `catalog.specs.${marketSlug}.families.${family.slug}.groups.${groupIdx}.label`;

            expect(
              getNestedValue(enCritical, enKey),
              `missing en: ${enKey}`,
            ).toBeDefined();
            expect(
              getNestedValue(zhCritical, zhKey),
              `missing zh: ${zhKey}`,
            ).toBeDefined();
          }
        }
      }
    });
  });
});
