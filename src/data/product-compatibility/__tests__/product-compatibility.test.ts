import { describe, expect, it, vi } from "vitest";
import {
  compatibilityByBrand,
  compatibilityByModel,
  compatibilityByProduct,
  compatibilityMappings,
  findCompatibilityMatches,
  oemBrands,
  oemModels,
  productCompatibilityCatalogSchema,
  productGroups,
  productVariants,
} from "@/data/product-compatibility";

vi.unmock("zod");

const locales = ["en", "es", "zh"] as const;

interface LocalizedText {
  en: string;
  es: string;
  zh: string;
}

function expectLocalizedText(value: LocalizedText) {
  for (const locale of locales) {
    expect(value[locale].trim().length).toBeGreaterThan(0);
  }
}

function expectUnique(values: readonly string[]) {
  expect(new Set(values).size).toBe(values.length);
}

function sorted(values: readonly string[]) {
  return [...values].sort();
}

describe("product compatibility data", () => {
  it("passes the Zod catalog schema", () => {
    const parsed = productCompatibilityCatalogSchema.parse({
      productGroups,
      productVariants,
      oemBrands,
      oemModels,
      compatibilityMappings,
    });

    expect(parsed.productVariants).toHaveLength(7);
    expect(parsed.oemBrands).toHaveLength(3);
  });

  it("keeps every slug unique inside its collection", () => {
    expectUnique(productGroups.map((group) => group.slug));
    expectUnique(productVariants.map((variant) => variant.slug));
    expectUnique(oemBrands.map((brand) => brand.slug));
    expectUnique(oemModels.map((model) => model.slug));
  });

  it("keeps stable ids, SKUs, and mapping pairs unique", () => {
    expectUnique(productGroups.map((group) => group.id));
    expectUnique(productVariants.map((variant) => variant.id));
    expectUnique(productVariants.map((variant) => variant.sku));
    expectUnique(oemBrands.map((brand) => brand.id));
    expectUnique(oemModels.map((model) => model.id));
    expectUnique(compatibilityMappings.map((mapping) => mapping.id));
    expectUnique(
      compatibilityMappings.map(
        (mapping) => `${mapping.oemModelId}:${mapping.productVariantId}`,
      ),
    );
  });

  it("locks the Phase 1 product and OEM inventory contract", () => {
    expect(sorted(productVariants.map((variant) => variant.sku))).toEqual([
      "TUC-D12-EPDM",
      "TUC-D7-EPDM",
      "TUC-D9-EPDM",
      "TUC-D9-TPU",
      "TUC-T62-EPDM",
      "TUC-T62-TPU",
      "TUC-T91-EPDM",
    ]);
    expect(sorted(oemBrands.map((brand) => brand.slug))).toEqual([
      "edi",
      "sanitaire",
      "ssi-aeration",
    ]);
    expect(oemModels).toHaveLength(11);
    expect(compatibilityMappings).toHaveLength(17);
  });

  it("keeps product groups and OEM brands graph-consistent", () => {
    const groupIds = new Set(productGroups.map((group) => group.id));
    const modelById = new Map(oemModels.map((model) => [model.id, model]));

    for (const variant of productVariants) {
      expect(groupIds.has(variant.groupId)).toBe(true);
    }

    for (const group of productGroups) {
      const expectedVariantIds = productVariants
        .filter((variant) => variant.groupId === group.id)
        .map((variant) => variant.id);

      expect(sorted(group.variantIds)).toEqual(sorted(expectedVariantIds));
    }

    for (const brand of oemBrands) {
      for (const modelId of brand.modelIds) {
        expect(modelById.get(modelId)?.brandId).toBe(brand.id);
      }
    }

    for (const model of oemModels) {
      const brand = oemBrands.find(
        (candidate) => candidate.id === model.brandId,
      );

      expect(brand?.modelIds).toContain(model.id);
      expect(
        compatibilityMappings.some(
          (mapping) => mapping.oemModelId === model.id,
        ),
      ).toBe(true);
    }
  });

  it("keeps all mapping references valid and confidence explicit", () => {
    const modelIds = new Set(oemModels.map((model) => model.id));
    const variantIds = new Set(productVariants.map((variant) => variant.id));
    const productCategoryByVariantId = new Map(
      productVariants.map((variant) => {
        const group = productGroups.find(
          (candidate) => candidate.id === variant.groupId,
        );

        return [variant.id, group?.category];
      }),
    );
    const modelCategoryById = new Map(
      oemModels.map((model) => [model.id, model.category]),
    );

    for (const mapping of compatibilityMappings) {
      expect(modelIds.has(mapping.oemModelId)).toBe(true);
      expect(variantIds.has(mapping.productVariantId)).toBe(true);
      expect(mapping.confidence).toMatch(/^(high|medium|low)$/);
      expect(productCategoryByVariantId.get(mapping.productVariantId)).toBe(
        modelCategoryById.get(mapping.oemModelId),
      );
    }
  });

  it("gives every OEM brand at least one compatible product mapping", () => {
    for (const brand of oemBrands) {
      const modelIds = new Set(brand.modelIds);
      const mappings = compatibilityMappings.filter((mapping) =>
        modelIds.has(mapping.oemModelId),
      );

      expect(mappings.length).toBeGreaterThan(0);
      expect(compatibilityByBrand[brand.id]?.models.length).toBeGreaterThan(0);
    }
  });

  it("keeps all localized fields populated in English, Spanish, and Chinese", () => {
    for (const group of productGroups) {
      expectLocalizedText(group.name);
      expectLocalizedText(group.description);
    }

    for (const variant of productVariants) {
      expectLocalizedText(variant.name);
    }

    for (const brand of oemBrands) {
      expectLocalizedText(brand.trademarkDisclaimer);
    }

    for (const mapping of compatibilityMappings) {
      expectLocalizedText(mapping.disclaimer);

      for (const requiredCheck of mapping.requiredChecks) {
        expectLocalizedText(requiredCheck);
      }
    }
  });

  it("builds lookup indexes in both OEM and product directions", () => {
    expect(sorted(Object.keys(compatibilityByBrand))).toEqual(
      sorted(oemBrands.map((brand) => brand.slug)),
    );
    expect(sorted(Object.keys(compatibilityByModel))).toEqual(
      sorted(oemModels.map((model) => model.slug)),
    );
    expect(sorted(Object.keys(compatibilityByProduct))).toEqual(
      sorted(productVariants.map((variant) => variant.slug)),
    );
    expect(compatibilityByBrand.sanitaire.models.length).toBeGreaterThan(0);
    expect(compatibilityByModel["sanitaire-mt-2"].compatibleProducts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sku: "TUC-T62-EPDM" }),
        expect.objectContaining({ sku: "TUC-T62-TPU" }),
      ]),
    );
    expect(compatibilityByProduct["tuc-d9-epdm"].compatibleOemModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ brandName: "Sanitaire" }),
        expect.objectContaining({ brandName: "EDI" }),
        expect.objectContaining({ brandName: "SSI Aeration" }),
      ]),
    );
    expect(compatibilityByProduct["tuc-d9-epdm"].compatibleOemModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          brandName: "Sanitaire",
          trademarkDisclaimer: expect.objectContaining({
            en: expect.stringContaining(
              "not affiliated with, authorized, or endorsed by",
            ),
          }),
        }),
      ]),
    );
  });

  it("supports compatibility search by OEM part number and Tucsenberg SKU", () => {
    expect(findCompatibilityMatches("00223").models).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ modelName: "FlexAir Threaded Disc 9 inch" }),
      ]),
    );
    expect(findCompatibilityMatches("AFD270-E").models).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ modelName: "AFD270 9 inch Disc" }),
      ]),
    );
    expect(findCompatibilityMatches("TUC-T62-EPDM").products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sku: "TUC-T62-EPDM" }),
      ]),
    );
    expect(findCompatibilityMatches("FlexAir 62x610").models).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelName: "FlexAir T-Series 62 mm Tube",
        }),
      ]),
    );
    expect(findCompatibilityMatches("Sanitaire MT-2").models).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ modelName: "MT-2 Tube" }),
      ]),
    );
    expect(findCompatibilityMatches("silver series ii").models.length).toBe(2);
    expect(findCompatibilityMatches("tuc t62 epdm").products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sku: "TUC-T62-EPDM" }),
      ]),
    );
  });

  /**
   * Codex PR #12 Finding 4 / §6.2 owner-signed baseline lock.
   *
   * The repo-level trademark BC (behavioral-contracts.md BC-033) forbids
   * parent-company / formal-legal-name re-introduction in any OEM brand
   * disclaimer across en/es/zh. The earlier Sanitaire-only spot-check
   * (above) proves the en wording on a single brand; this data-wide guard
   * forbids the historically-struck names on every brand × locale pair
   * AND requires every disclaimer to carry the §6.2 ownership /
   * no-affiliation / no-endorsement semantics in each locale's wording.
   */
  it("forbids parent-company / formal-name re-introduction in any OEM brand disclaimer (BC-033 / §6.2)", () => {
    const FORBIDDEN_PATTERN =
      /Xylem|Environmental Dynamics International|registered trademark/i;
    for (const brand of oemBrands) {
      for (const locale of locales) {
        const disclaimer = brand.trademarkDisclaimer[locale];
        expect(
          disclaimer,
          `${brand.slug}/${locale} must not name parent/formal entity`,
        ).not.toMatch(FORBIDDEN_PATTERN);
      }
    }
  });

  it("requires every per-brand disclaimer to carry §6.2 independent-aftermarket + no-affiliation semantics in each locale", () => {
    const REQUIRED_PER_LOCALE = {
      en: [
        /independent aftermarket/i,
        /not affiliated with, authorized, or endorsed by/i,
      ],
      es: [
        /fabricante independiente/i,
        /no está afiliada.*ni cuenta con su autorización/i,
      ],
      zh: [/独立的售后/, /无任何隶属、授权或背书/],
    } as const;
    for (const brand of oemBrands) {
      for (const locale of locales) {
        const disclaimer = brand.trademarkDisclaimer[locale];
        for (const pattern of REQUIRED_PER_LOCALE[locale]) {
          expect(
            disclaimer,
            `${brand.slug}/${locale} must match ${String(pattern)}`,
          ).toMatch(pattern);
        }
      }
    }
  });
});
