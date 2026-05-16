/**
 * Drift guard for the derived catalog fact constants.
 *
 * Every assertion recomputes the expected value from the raw Zod-parsed
 * source arrays (`compatibilityMappings`, `oemBrands`, `oemModels`,
 * `productVariants`) and asserts the `catalog-facts` module agrees. The
 * module must never bake literals that the data layer does not itself bake;
 * if the catalog data changes, this test forces the constants to move with
 * it.
 *
 * The global test setup mocks `zod`; the catalog runs `.parse()` at module
 * load, so we unmock it here (mirrors accessors.test.ts / product-slug.test.ts).
 */
import { describe, expect, it, vi } from "vitest";
import {
  compatibilityMappings,
  oemBrands,
  oemModels,
  productVariants,
} from "@/data/product-compatibility";
import {
  CATALOG_FACTS,
  getBrandPathStats,
  getFeaturedProductFacts,
  getOemBrandFacts,
} from "@/data/product-compatibility/catalog-facts";
import { canonicalProductSlug } from "@/data/product-compatibility/product-slug";

vi.unmock("zod");

type FitStatusKey = "exact" | "verify-dimensions" | "custom";

type FitStatusTotals = Record<FitStatusKey, number>;

function emptyFitStatusTotals(): FitStatusTotals {
  return { exact: 0, "verify-dimensions": 0, custom: 0 };
}

const brandIdByModelId = new Map(
  oemModels.map((model) => [model.id, model.brandId] as const),
);
const materialByVariantId = new Map(
  productVariants.map((variant) => [variant.id, variant.material] as const),
);

function recomputeBrandStats(brandId: string) {
  const stats = {
    paths: 0,
    epdm: 0,
    tpu: 0,
    fitStatus: emptyFitStatusTotals(),
  };

  for (const mapping of compatibilityMappings) {
    if (brandIdByModelId.get(mapping.oemModelId) !== brandId) {
      continue;
    }

    stats.paths += 1;
    stats.fitStatus[mapping.fitStatus] += 1;

    const material = materialByVariantId.get(mapping.productVariantId);
    if (material === "epdm") {
      stats.epdm += 1;
    } else if (material === "tpu") {
      stats.tpu += 1;
    }
  }

  return stats;
}

function recomputeFitStatusTotals(): FitStatusTotals {
  const totals = emptyFitStatusTotals();
  for (const mapping of compatibilityMappings) {
    totals[mapping.fitStatus] += 1;
  }
  return totals;
}

describe("CATALOG_FACTS", () => {
  it("totalCompatibilityPaths equals the real mappings length (17)", () => {
    expect(compatibilityMappings.length).toBe(17);
    expect(CATALOG_FACTS.totalCompatibilityPaths).toBe(
      compatibilityMappings.length,
    );
    expect(CATALOG_FACTS.totalCompatibilityPaths).toBe(17);
  });

  it("oemBrandCount equals the real oemBrands length (3)", () => {
    expect(oemBrands.length).toBe(3);
    expect(CATALOG_FACTS.oemBrandCount).toBe(oemBrands.length);
    expect(CATALOG_FACTS.oemBrandCount).toBe(3);
  });

  it("fitStatusOrder is the canonical order", () => {
    expect(CATALOG_FACTS.fitStatusOrder).toEqual([
      "exact",
      "verify-dimensions",
      "custom",
    ]);
  });

  it("fitStatusLabelKey is the i18n base key", () => {
    expect(CATALOG_FACTS.fitStatusLabelKey).toBe(
      "membraneProduct.compatibility.fitStatus",
    );
  });

  it("fitStatusTotals matches recomputed totals", () => {
    expect(CATALOG_FACTS.fitStatusTotals).toEqual(recomputeFitStatusTotals());
    expect(CATALOG_FACTS.fitStatusTotals).toEqual({
      exact: 6,
      "verify-dimensions": 6,
      custom: 5,
    });
  });
});

describe("getOemBrandFacts", () => {
  it("returns the three real brands in catalog order, never excluded brands", () => {
    const facts = getOemBrandFacts();

    expect(facts.map((b) => b.id)).toEqual(oemBrands.map((b) => b.id));
    expect(facts.map((b) => b.id)).toEqual([
      "sanitaire",
      "edi",
      "ssi-aeration",
    ]);
    expect(facts.map((b) => b.slug)).toEqual(oemBrands.map((b) => b.slug));
    expect(facts.map((b) => b.displayName)).toEqual(
      oemBrands.map((b) => b.name),
    );
    expect(facts.map((b) => b.displayName)).toEqual([
      "Sanitaire",
      "EDI",
      "SSI Aeration",
    ]);

    const ids = facts.map((b) => b.id);
    const names = facts.map((b) => b.displayName);
    for (const excluded of ["aercor", "stamford", "nopon"]) {
      expect(ids).not.toContain(excluded);
    }
    for (const excluded of ["Aercor", "Stamford", "Nopon"]) {
      expect(names).not.toContain(excluded);
    }
  });
});

describe("getBrandPathStats", () => {
  it("sanitaire stats match the recomputed source", () => {
    expect(getBrandPathStats("sanitaire")).toEqual(
      recomputeBrandStats("sanitaire"),
    );
    expect(getBrandPathStats("sanitaire")).toEqual({
      paths: 5,
      epdm: 3,
      tpu: 2,
      fitStatus: { exact: 2, "verify-dimensions": 1, custom: 2 },
    });
  });

  it("edi stats match the recomputed source", () => {
    expect(getBrandPathStats("edi")).toEqual(recomputeBrandStats("edi"));
    expect(getBrandPathStats("edi")).toEqual({
      paths: 7,
      epdm: 5,
      tpu: 2,
      fitStatus: { exact: 3, "verify-dimensions": 3, custom: 1 },
    });
  });

  it("ssi-aeration stats match the recomputed source", () => {
    expect(getBrandPathStats("ssi-aeration")).toEqual(
      recomputeBrandStats("ssi-aeration"),
    );
    expect(getBrandPathStats("ssi-aeration")).toEqual({
      paths: 5,
      epdm: 3,
      tpu: 2,
      fitStatus: { exact: 1, "verify-dimensions": 2, custom: 2 },
    });
  });

  it("throws on an unknown brand id", () => {
    expect(() => getBrandPathStats("not-a-brand")).toThrow();
  });

  it("per-brand path totals sum to the global mappings length", () => {
    const sum =
      getBrandPathStats("sanitaire").paths +
      getBrandPathStats("edi").paths +
      getBrandPathStats("ssi-aeration").paths;
    expect(sum).toBe(compatibilityMappings.length);
    expect(sum).toBe(17);
  });
});

describe("getFeaturedProductFacts", () => {
  it("matches the tuc-d9-epdm productVariants entry", () => {
    const variant = productVariants.find((v) => v.id === "tuc-d9-epdm");
    expect(variant).toBeDefined();

    const facts = getFeaturedProductFacts();

    expect(facts.sku).toBe(variant!.sku);
    expect(facts.sku).toBe("TUC-D9-EPDM");
    expect(facts.material).toBe(variant!.material);
    expect(facts.material).toBe("epdm");
    expect(facts.diameter).toBe(variant!.specs.diameter);
    expect(facts.diameter).toBe('9" / 228.6 mm nominal membrane class');
    expect(facts.canonicalSlug).toBe(canonicalProductSlug(variant!));
    expect(facts.canonicalSlug).toBe("9-inch-epdm-disc-replacement");
    expect(facts.quoteHref).toBe(
      "/quote?sku=TUC-D9-EPDM&product=9-inch-epdm-disc-replacement",
    );
    expect(facts.quoteHref).toBe(
      `/quote?sku=${encodeURIComponent(variant!.sku)}&product=${encodeURIComponent(
        canonicalProductSlug(variant!),
      )}`,
    );
  });

  it("does not expose a bare ambiguous slug field", () => {
    const facts = getFeaturedProductFacts() as Record<string, unknown>;
    expect(facts.slug).toBeUndefined();
  });
});
