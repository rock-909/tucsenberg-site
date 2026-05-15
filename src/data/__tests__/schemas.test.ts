import { describe, it, expect, vi } from "vitest";

vi.unmock("zod");

import {
  productGroupSchema,
  productVariantSchema,
  oemBrandSchema,
  oemModelSchema,
  compatibilityMappingSchema,
} from "@/data/schemas";

describe("productGroupSchema", () => {
  it("validates a correct ProductGroup with real i18n data", () => {
    const validGroup = {
      id: "pg-disc-9inch",
      slug: "9-inch-disc-diffuser-membrane",
      name: {
        en: "9-Inch Disc Diffuser Membrane",
        es: "Membrana de difusor de disco de 9 pulgadas",
        zh: "9英寸盘式曝气膜片",
      },
      description: {
        en: "Drop-in replacement membrane for 9-inch disc diffusers used in municipal wastewater aeration.",
        es: "Membrana de repuesto para difusores de disco de 9 pulgadas usados en aireación de aguas residuales municipales.",
        zh: "适用于市政污水曝气的9英寸盘式曝气器替换膜片。",
      },
      category: "disc",
      variantIds: ["pv-disc-9inch-epdm", "pv-disc-9inch-tpu"],
    };

    const result = productGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
  });

  it("rejects ProductGroup with empty name locale", () => {
    const invalidGroup = {
      id: "pg-disc-9inch",
      slug: "9-inch-disc-diffuser-membrane",
      name: {
        en: "",
        es: "Membrana de difusor de disco de 9 pulgadas",
        zh: "9英寸盘式曝气膜片",
      },
      description: {
        en: "Drop-in replacement membrane for 9-inch disc diffusers.",
        es: "Membrana de repuesto para difusores de disco de 9 pulgadas.",
        zh: "适用于9英寸盘式曝气器的替换膜片。",
      },
      category: "disc",
      variantIds: [],
    };

    const result = productGroupSchema.safeParse(invalidGroup);
    expect(result.success).toBe(false);
  });
});

describe("productVariantSchema", () => {
  it("validates a correct ProductVariant with specs", () => {
    const validVariant = {
      id: "pv-disc-9inch-epdm",
      slug: "9-inch-disc-epdm",
      groupId: "pg-disc-9inch",
      name: {
        en: "9-Inch EPDM Disc Membrane",
        es: "Membrana de disco EPDM de 9 pulgadas",
        zh: "9英寸EPDM盘式膜片",
      },
      material: "epdm",
      sku: "TUC-D9-EPDM",
      phase: 1,
      specs: {
        diameter: { value: 9, unit: "inch" },
        temperatureRange: { min: -40, max: 80, unit: "celsius" },
        shoreHardness: 45,
        tensileStrength: 8.5,
        airFlowRange: { min: 1, max: 6, unit: "scfm" },
      },
    };

    const result = productVariantSchema.safeParse(validVariant);
    expect(result.success).toBe(true);
  });

  it('rejects ProductVariant with invalid material ("rubber")', () => {
    const invalidVariant = {
      id: "pv-disc-9inch-rubber",
      slug: "9-inch-disc-rubber",
      groupId: "pg-disc-9inch",
      name: {
        en: "9-Inch Rubber Disc Membrane",
        es: "Membrana de disco de caucho de 9 pulgadas",
        zh: "9英寸橡胶盘式膜片",
      },
      material: "rubber",
      sku: "TUC-D9-RUB",
      phase: 1,
    };

    const result = productVariantSchema.safeParse(invalidVariant);
    expect(result.success).toBe(false);
  });
});

describe("oemBrandSchema", () => {
  it("validates a correct OEMBrand with trademark disclaimer", () => {
    const validBrand = {
      id: "oem-sanitaire",
      slug: "sanitaire",
      name: "Sanitaire",
      parentCompany: "Xylem Inc.",
      trademarkDisclaimer: {
        en: "Sanitaire is a registered trademark of Xylem Inc. Tucsenberg is not affiliated with Xylem Inc.",
        es: "Sanitaire es una marca registrada de Xylem Inc. Tucsenberg no está afiliado a Xylem Inc.",
        zh: "Sanitaire是Xylem Inc.的注册商标。Tucsenberg与Xylem Inc.无关联。",
      },
      modelIds: ["oem-model-sanitaire-gold", "oem-model-sanitaire-silver"],
    };

    const result = oemBrandSchema.safeParse(validBrand);
    expect(result.success).toBe(true);
  });
});

describe("oemModelSchema", () => {
  it("validates a correct OEMModel with specs", () => {
    const validModel = {
      id: "oem-model-sanitaire-gold",
      slug: "sanitaire-gold-series",
      brandId: "oem-sanitaire",
      name: "Gold Series 9-Inch Disc",
      oemPartNumbers: ["SAN-G9-001", "SAN-G9-002"],
      category: "disc",
      specs: {
        diameter: { value: 9, unit: "inch" },
        airFlowRange: { min: 0.5, max: 5.5, unit: "scfm" },
      },
    };

    const result = oemModelSchema.safeParse(validModel);
    expect(result.success).toBe(true);
  });
});

describe("compatibilityMappingSchema", () => {
  it("validates a correct CompatibilityMapping", () => {
    const validMapping = {
      id: "compat-sanitaire-gold-epdm",
      oemModelId: "oem-model-sanitaire-gold",
      productVariantId: "pv-disc-9inch-epdm",
      fitStatus: "exact",
      confidence: "high",
      requiredChecks: [],
      disclaimer:
        "Verify bolt pattern and gasket seal before installation in field conditions.",
    };

    const result = compatibilityMappingSchema.safeParse(validMapping);
    expect(result.success).toBe(true);
  });

  it('rejects CompatibilityMapping with invalid fitStatus ("maybe")', () => {
    const invalidMapping = {
      id: "compat-invalid",
      oemModelId: "oem-model-sanitaire-gold",
      productVariantId: "pv-disc-9inch-epdm",
      fitStatus: "maybe",
      confidence: "high",
      requiredChecks: [],
      disclaimer: "Some disclaimer.",
    };

    const result = compatibilityMappingSchema.safeParse(invalidMapping);
    expect(result.success).toBe(false);
  });
});
