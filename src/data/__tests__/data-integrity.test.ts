import { describe, it, expect, vi } from "vitest";

vi.unmock("zod");

import {
  productGroupSchema,
  productVariantSchema,
  oemBrandSchema,
  oemModelSchema,
  compatibilityMappingSchema,
} from "@/data/schemas";
import { productGroups, productVariants } from "@/data/products";
import { oemBrands } from "@/data/oem-brands";
import { oemModels } from "@/data/oem-models";
import { compatibilityMappings } from "@/data/compatibility";

// ---------------------------------------------------------------------------
// 1. Schema validation
// ---------------------------------------------------------------------------

describe("schema validation", () => {
  it("all productGroups pass productGroupSchema", () => {
    for (const group of productGroups) {
      const result = productGroupSchema.safeParse(group);
      expect(result.success, `productGroup "${group.id}" failed schema`).toBe(
        true,
      );
    }
  });

  it("all productVariants pass productVariantSchema", () => {
    for (const variant of productVariants) {
      const result = productVariantSchema.safeParse(variant);
      expect(
        result.success,
        `productVariant "${variant.id}" failed schema`,
      ).toBe(true);
    }
  });

  it("all oemBrands pass oemBrandSchema", () => {
    for (const brand of oemBrands) {
      const result = oemBrandSchema.safeParse(brand);
      expect(result.success, `oemBrand "${brand.id}" failed schema`).toBe(true);
    }
  });

  it("all oemModels pass oemModelSchema", () => {
    for (const model of oemModels) {
      const result = oemModelSchema.safeParse(model);
      expect(result.success, `oemModel "${model.id}" failed schema`).toBe(true);
    }
  });

  it("all compatibilityMappings pass compatibilityMappingSchema", () => {
    for (const mapping of compatibilityMappings) {
      const result = compatibilityMappingSchema.safeParse(mapping);
      expect(
        result.success,
        `compatibilityMapping "${mapping.id}" failed schema`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Slug uniqueness
// ---------------------------------------------------------------------------

describe("slug uniqueness", () => {
  it("product group slugs are unique", () => {
    const slugs = productGroups.map((g) => g.slug);
    expect(slugs).toEqual([...new Set(slugs)]);
  });

  it("product variant slugs are unique", () => {
    const slugs = productVariants.map((v) => v.slug);
    expect(slugs).toEqual([...new Set(slugs)]);
  });

  it("OEM brand slugs are unique", () => {
    const slugs = oemBrands.map((b) => b.slug);
    expect(slugs).toEqual([...new Set(slugs)]);
  });

  it("OEM model slugs are unique", () => {
    const slugs = oemModels.map((m) => m.slug);
    expect(slugs).toEqual([...new Set(slugs)]);
  });

  it("compatibility mapping IDs are unique", () => {
    const ids = compatibilityMappings.map((c) => c.id);
    expect(ids).toEqual([...new Set(ids)]);
  });
});

// ---------------------------------------------------------------------------
// 3. Referential integrity
// ---------------------------------------------------------------------------

describe("referential integrity", () => {
  const variantIdSet = new Set(productVariants.map((v) => v.id));
  const groupIdSet = new Set(productGroups.map((g) => g.id));
  const modelIdSet = new Set(oemModels.map((m) => m.id));
  const brandIdSet = new Set(oemBrands.map((b) => b.id));

  it("all ProductGroup.variantIds point to existing variant IDs", () => {
    for (const group of productGroups) {
      for (const vid of group.variantIds) {
        expect(
          variantIdSet.has(vid),
          `group "${group.id}" references missing variant "${vid}"`,
        ).toBe(true);
      }
    }
  });

  it("all ProductVariant.groupId points to existing group ID", () => {
    for (const variant of productVariants) {
      expect(
        groupIdSet.has(variant.groupId),
        `variant "${variant.id}" references missing group "${variant.groupId}"`,
      ).toBe(true);
    }
  });

  it("all OEMBrand.modelIds point to existing model IDs", () => {
    for (const brand of oemBrands) {
      for (const mid of brand.modelIds) {
        expect(
          modelIdSet.has(mid),
          `brand "${brand.id}" references missing model "${mid}"`,
        ).toBe(true);
      }
    }
  });

  it("all OEMModel.brandId points to existing brand ID", () => {
    for (const model of oemModels) {
      expect(
        brandIdSet.has(model.brandId),
        `model "${model.id}" references missing brand "${model.brandId}"`,
      ).toBe(true);
    }
  });

  it("all mapping.oemModelId points to existing model ID", () => {
    for (const mapping of compatibilityMappings) {
      expect(
        modelIdSet.has(mapping.oemModelId),
        `mapping "${mapping.id}" references missing model "${mapping.oemModelId}"`,
      ).toBe(true);
    }
  });

  it("all mapping.productVariantId points to existing variant ID", () => {
    for (const mapping of compatibilityMappings) {
      expect(
        variantIdSet.has(mapping.productVariantId),
        `mapping "${mapping.id}" references missing variant "${mapping.productVariantId}"`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Coverage requirements
// ---------------------------------------------------------------------------

describe("coverage requirements", () => {
  it("every OEM brand has at least one compatibility mapping via its models", () => {
    const mappedModelIds = new Set(
      compatibilityMappings.map((m) => m.oemModelId),
    );
    for (const brand of oemBrands) {
      const hasCoverage = brand.modelIds.some((mid) => mappedModelIds.has(mid));
      expect(
        hasCoverage,
        `brand "${brand.id}" has no compatibility mappings`,
      ).toBe(true);
    }
  });

  it("every mapping has a valid confidence value", () => {
    const validConfidence = new Set(["high", "medium", "low"]);
    for (const mapping of compatibilityMappings) {
      expect(
        validConfidence.has(mapping.confidence),
        `mapping "${mapping.id}" has invalid confidence "${mapping.confidence}"`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. i18n completeness
// ---------------------------------------------------------------------------

describe("i18n completeness", () => {
  const TODO_PATTERN = /\[(EN|ES|ZH)-TODO\]/i;

  function assertI18nComplete(
    text: { en: string; es: string; zh: string },
    label: string,
  ) {
    for (const locale of ["en", "es", "zh"] as const) {
      const val = text[locale];
      expect(val.length > 0, `${label} has empty ${locale}`).toBe(true);
      expect(
        TODO_PATTERN.test(val),
        `${label} ${locale} contains TODO placeholder: "${val}"`,
      ).toBe(false);
    }
  }

  it("all product group names have non-empty en/es/zh", () => {
    for (const group of productGroups) {
      assertI18nComplete(group.name, `productGroup "${group.id}" name`);
    }
  });

  it("all product group descriptions have non-empty en/es/zh", () => {
    for (const group of productGroups) {
      assertI18nComplete(
        group.description,
        `productGroup "${group.id}" description`,
      );
    }
  });

  it("all product variant names have non-empty en/es/zh", () => {
    for (const variant of productVariants) {
      assertI18nComplete(variant.name, `productVariant "${variant.id}" name`);
    }
  });

  it("all OEM brand disclaimers have non-empty en/es/zh", () => {
    for (const brand of oemBrands) {
      assertI18nComplete(
        brand.trademarkDisclaimer,
        `oemBrand "${brand.id}" trademarkDisclaimer`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Data volume sanity
// ---------------------------------------------------------------------------

describe("data volume sanity", () => {
  it("at least 3 OEM brands", () => {
    expect(oemBrands.length).toBeGreaterThanOrEqual(3);
  });

  it("at least 10 OEM models", () => {
    expect(oemModels.length).toBeGreaterThanOrEqual(10);
  });

  it("at least 5 product variants", () => {
    expect(productVariants.length).toBeGreaterThanOrEqual(5);
  });

  it("at least 15 compatibility mappings", () => {
    expect(compatibilityMappings.length).toBeGreaterThanOrEqual(15);
  });
});
