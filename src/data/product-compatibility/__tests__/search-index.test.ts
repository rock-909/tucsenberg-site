import { describe, expect, it, vi } from "vitest";
import { findCompatibilityMatches } from "@/data/product-compatibility";
import { buildClientSearchIndex } from "@/data/product-compatibility/search-index";
import { matchClientSearchIndex } from "@/data/product-compatibility/search-match";

vi.unmock("zod");

// Representative queries mandated by the perf split brief: OEM part number,
// brand name, Tucsenberg SKU, short query, no-match.
const QUERIES = [
  "00223",
  "Sanitaire",
  "TUC-D9",
  "TUC-T62-EPDM",
  "tuc t62 epdm",
  "FlexAir 62x610",
  "silver series ii",
  "AFD270-E",
  "x",
  "",
  "no-such-membrane-zzz",
] as const;

describe("client search index parity", () => {
  const index = buildClientSearchIndex();

  it("returns the SAME models and products as findCompatibilityMatches", () => {
    for (const query of QUERIES) {
      const legacy = findCompatibilityMatches(query);
      const pure = matchClientSearchIndex(query, index);

      // Same matches, same ordering.
      expect(pure.models.map((m) => m.modelId)).toEqual(
        legacy.models.map((m) => m.modelId),
      );
      expect(pure.products.map((p) => p.productVariantId)).toEqual(
        legacy.products.map((p) => p.productVariantId),
      );
    }
  });

  it("carries the canonical product slug and localized name the UI consumes", () => {
    const result = matchClientSearchIndex("TUC-D9-EPDM", index);
    const legacy = findCompatibilityMatches("TUC-D9-EPDM");

    const product = result.products.find((p) => p.sku === "TUC-D9-EPDM");
    const legacyProduct = legacy.products.find((p) => p.sku === "TUC-D9-EPDM");

    expect(product).toBeDefined();
    expect(product?.canonicalProductSlug).toBe(
      legacyProduct?.canonicalProductSlug,
    );
    expect(product?.canonicalProductSlug).toBe("9-inch-epdm-disc-replacement");
    expect(product?.name).toEqual(legacyProduct?.name);
    expect(product?.name.en.length).toBeGreaterThan(0);
    expect(product?.name.es.length).toBeGreaterThan(0);
    expect(product?.name.zh.length).toBeGreaterThan(0);
  });

  it("carries the model fields the UI links use (brand slug, part numbers)", () => {
    const result = matchClientSearchIndex("00223", index);
    const legacy = findCompatibilityMatches("00223");

    const model = result.models[0];
    const legacyModel = legacy.models[0];

    expect(model).toBeDefined();
    expect(model?.brandSlug).toBe(legacyModel?.brandSlug);
    expect(model?.modelSlug).toBe(legacyModel?.modelSlug);
    expect(model?.modelName).toBe(legacyModel?.modelName);
    expect(model?.oemPartNumbers).toEqual(legacyModel?.oemPartNumbers);
  });

  it("produces a JSON-serializable index (no class/Zod instances)", () => {
    const roundTripped = JSON.parse(JSON.stringify(index)) as typeof index;
    const fromOriginal = matchClientSearchIndex("Sanitaire", index);
    const fromRoundTrip = matchClientSearchIndex("Sanitaire", roundTripped);

    expect(fromRoundTrip.models.map((m) => m.modelId)).toEqual(
      fromOriginal.models.map((m) => m.modelId),
    );
    expect(fromRoundTrip.products.map((p) => p.productVariantId)).toEqual(
      fromOriginal.products.map((p) => p.productVariantId),
    );
  });

  it("returns empty results for empty and sub-minimum queries", () => {
    expect(matchClientSearchIndex("", index)).toEqual({
      models: [],
      products: [],
    });
    // Single non-alphanumeric normalizes to empty -> no matches.
    expect(matchClientSearchIndex("-", index)).toEqual({
      models: [],
      products: [],
    });
  });
});
