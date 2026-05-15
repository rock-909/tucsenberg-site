import { describe, expect, it, vi } from "vitest";

vi.unmock("zod");

import {
  oemBrands,
  oemModels,
  compatibilityMappings,
  productVariants,
  productGroups,
} from "@/data/product-compatibility";

const PLACEHOLDER = /\[(ES|ZH)-TODO\]/;
const FORBIDDEN_PART_TOKENS = [/^MM\d+$/i, /^B0[A-Z0-9]{8}$/];

function localizedClean(value: { en: string; es: string; zh: string }) {
  return (
    !PLACEHOLDER.test(value.es) &&
    !PLACEHOLDER.test(value.zh) &&
    value.es.trim().length > 0 &&
    value.zh.trim().length > 0
  );
}

describe("product-compatibility data cleanup", () => {
  it("has no [ES-TODO]/[ZH-TODO] placeholders in any localized field", () => {
    for (const b of oemBrands)
      expect(localizedClean(b.trademarkDisclaimer)).toBe(true);
    for (const g of productGroups) {
      expect(localizedClean(g.name)).toBe(true);
      expect(localizedClean(g.description)).toBe(true);
    }
    for (const v of productVariants) expect(localizedClean(v.name)).toBe(true);
    for (const m of compatibilityMappings) {
      expect(localizedClean(m.disclaimer)).toBe(true);
      for (const c of m.requiredChecks) expect(localizedClean(c)).toBe(true);
    }
  });

  it("has no competitor SKUs or Amazon ASINs in oemPartNumbers", () => {
    for (const model of oemModels) {
      for (const pn of model.oemPartNumbers) {
        for (const forbidden of FORBIDDEN_PART_TOKENS) {
          expect(
            forbidden.test(pn),
            `${model.id} has forbidden part number ${pn}`,
          ).toBe(false);
        }
      }
    }
  });
});
