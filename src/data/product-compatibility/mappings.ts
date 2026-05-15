import { compatibilityMappingSchema } from "@/data/product-compatibility/schemas";

const oemCompatibilityDisclaimer = {
  en: "Compatibility information is for replacement planning only. Confirm membrane dimensions, connection style, retaining hardware, and project operating conditions before ordering.",
  es: "[ES-TODO] Compatibility information is for replacement planning only. Confirm membrane dimensions, connection style, retaining hardware, and project operating conditions before ordering.",
  zh: "[ZH-TODO] Compatibility information is for replacement planning only. Confirm membrane dimensions, connection style, retaining hardware, and project operating conditions before ordering.",
};

function check(en: string) {
  return {
    en,
    es: `[ES-TODO] ${en}`,
    zh: `[ZH-TODO] ${en}`,
  };
}

const compatibilityMappingData = [
  {
    id: "sanitaire-silver-series-ii-9-inch-disc-to-tuc-d9-epdm",
    oemModelId: "sanitaire-silver-series-ii-9-inch-disc",
    productVariantId: "tuc-d9-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check("Confirm 9 inch Silver Series II diffuser body"),
      check("Confirm retaining ring and gasket condition"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-silver-series-ii-9-inch-disc-to-tuc-d9-tpu",
    oemModelId: "sanitaire-silver-series-ii-9-inch-disc",
    productVariantId: "tuc-d9-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check("Confirm industrial wastewater compatibility need"),
      check("Confirm slit pattern and retaining hardware before substitution"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-silver-series-ii-7-inch-disc-to-tuc-d7-epdm",
    oemModelId: "sanitaire-silver-series-ii-7-inch-disc",
    productVariantId: "tuc-d7-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check("Confirm 7 inch Silver Series II diffuser body"),
      check("Confirm retainer and integrated check valve condition"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-mt-2-to-tuc-t62-epdm",
    oemModelId: "sanitaire-mt-2",
    productVariantId: "tuc-t62-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check("Confirm 62 mm membrane diameter"),
      check("Confirm 610 mm membrane length"),
      check("Confirm clamp and end hardware condition"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "sanitaire-mt-2-to-tuc-t62-tpu",
    oemModelId: "sanitaire-mt-2",
    productVariantId: "tuc-t62-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check("Confirm 62 mm membrane diameter and 610 mm length"),
      check("Confirm TPU is required by wastewater chemistry"),
      check("Confirm clamp compression with alternate material"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-7-inch-to-tuc-d7-epdm",
    oemModelId: "edi-flexair-threaded-disc-7-inch",
    productVariantId: "tuc-d7-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check("Confirm 7 inch threaded disc diffuser"),
      check("Confirm micro or high-capacity airflow target"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-9-inch-to-tuc-d9-epdm",
    oemModelId: "edi-flexair-threaded-disc-9-inch",
    productVariantId: "tuc-d9-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check("Confirm 9 inch threaded disc diffuser"),
      check("Confirm 228.6 mm membrane class"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-9-inch-to-tuc-d9-tpu",
    oemModelId: "edi-flexair-threaded-disc-9-inch",
    productVariantId: "tuc-d9-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check("Confirm 228.6 mm membrane class"),
      check("Confirm TPU material is needed for process conditions"),
      check("Confirm slit and retaining geometry before batch order"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-threaded-disc-12-inch-to-tuc-d12-epdm",
    oemModelId: "edi-flexair-threaded-disc-12-inch",
    productVariantId: "tuc-d12-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check("Confirm 12 inch threaded disc diffuser"),
      check("Confirm 304.8 mm membrane class"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-t-series-62-mm-to-tuc-t62-epdm",
    oemModelId: "edi-flexair-t-series-62-mm",
    productVariantId: "tuc-t62-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check("Confirm 62 mm nominal tube family"),
      check("Confirm installed membrane length"),
      check("Confirm wall thickness and support hardware"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-t-series-62-mm-to-tuc-t62-tpu",
    oemModelId: "edi-flexair-t-series-62-mm",
    productVariantId: "tuc-t62-tpu",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check("Confirm 62 mm nominal tube family"),
      check("Confirm installed membrane length"),
      check("Confirm TPU material is required by process chemistry"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "edi-flexair-t-series-91-mm-to-tuc-t91-epdm",
    oemModelId: "edi-flexair-t-series-91-mm",
    productVariantId: "tuc-t91-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: [
      check("Confirm 91 mm nominal tube family"),
      check("Confirm installed membrane length"),
      check("Confirm support requirement for 1003 mm tube bodies"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-afd270-9-inch-disc-to-tuc-d9-epdm",
    oemModelId: "ssi-afd270-9-inch-disc",
    productVariantId: "tuc-d9-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      check("Confirm AFD270 diffuser body"),
      check("Confirm membrane gasket and retaining ring condition"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-afd270-9-inch-disc-to-tuc-d9-tpu",
    oemModelId: "ssi-afd270-9-inch-disc",
    productVariantId: "tuc-d9-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check("Confirm AFD270 diffuser body"),
      check("Confirm TPU substitution is required by wastewater chemistry"),
      check("Confirm gasket compression before production order"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-aft-62-mm-tube-to-tuc-t62-epdm",
    oemModelId: "ssi-aft-62-mm-tube",
    productVariantId: "tuc-t62-epdm",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      check("Confirm AFT tube replacement strategy for installed body"),
      check("Confirm 62 mm diameter and length"),
      check("Confirm saddle or nipple connection style"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-aft-62-mm-tube-to-tuc-t62-tpu",
    oemModelId: "ssi-aft-62-mm-tube",
    productVariantId: "tuc-t62-tpu",
    fitStatus: "custom",
    confidence: "medium",
    requiredChecks: [
      check("Confirm AFT tube replacement strategy for installed body"),
      check("Confirm 62 mm diameter and length"),
      check("Confirm TPU substitution is required by wastewater chemistry"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
  {
    id: "ssi-aft-91-mm-tube-to-tuc-t91-epdm",
    oemModelId: "ssi-aft-91-mm-tube",
    productVariantId: "tuc-t91-epdm",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      check("Confirm AFT tube replacement strategy for installed body"),
      check("Confirm 91 mm diameter and length"),
      check("Confirm saddle or nipple connection style"),
    ],
    disclaimer: oemCompatibilityDisclaimer,
  },
] as const;

export const compatibilityMappings = compatibilityMappingSchema
  .array()
  .parse(compatibilityMappingData);
