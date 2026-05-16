import type { CompatibilityMapping } from "@/data/schemas";

export const compatibilityMappings: CompatibilityMapping[] = [
  // ---------------------------------------------------------------------------
  // 9-inch disc → TUC-D9-EPDM (3 mappings)
  // ---------------------------------------------------------------------------
  {
    id: "sanitaire-silver-ii-9--9-inch-disc-epdm",
    oemModelId: "sanitaire-silver-ii-9",
    productVariantId: "9-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer:
      "Verify thread engagement and gasket seal before pressurizing basin.",
  },
  {
    id: "edi-threaded-disc-9--9-inch-disc-epdm",
    oemModelId: "edi-threaded-disc-9",
    productVariantId: "9-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer:
      "Verify thread engagement and gasket seal before pressurizing basin.",
  },
  {
    id: "ssi-afd270-9--9-inch-disc-epdm",
    oemModelId: "ssi-afd270-9",
    productVariantId: "9-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer:
      "Verify thread engagement and gasket seal before pressurizing basin.",
  },

  // ---------------------------------------------------------------------------
  // 9-inch disc → TUC-D9-TPU (3 mappings)
  // ---------------------------------------------------------------------------
  {
    id: "sanitaire-silver-ii-9--9-inch-disc-tpu",
    oemModelId: "sanitaire-silver-ii-9",
    productVariantId: "9-inch-disc-tpu",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer:
      "TPU membranes are intended for oil, grease, or chemical exposure applications. Verify process conditions before selecting TPU over EPDM.",
  },
  {
    id: "edi-threaded-disc-9--9-inch-disc-tpu",
    oemModelId: "edi-threaded-disc-9",
    productVariantId: "9-inch-disc-tpu",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer:
      "TPU membranes are intended for oil, grease, or chemical exposure applications. Verify process conditions before selecting TPU over EPDM.",
  },
  {
    id: "ssi-afd270-9--9-inch-disc-tpu",
    oemModelId: "ssi-afd270-9",
    productVariantId: "9-inch-disc-tpu",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer:
      "TPU membranes are intended for oil, grease, or chemical exposure applications. Verify process conditions before selecting TPU over EPDM.",
  },

  // ---------------------------------------------------------------------------
  // 12-inch disc → TUC-D12-EPDM (2 mappings)
  // ---------------------------------------------------------------------------
  {
    id: "edi-threaded-disc-12--12-inch-disc-epdm",
    oemModelId: "edi-threaded-disc-12",
    productVariantId: "12-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer:
      "Verify thread engagement and gasket seal before pressurizing basin.",
  },
  {
    id: "ssi-afd350-12--12-inch-disc-epdm",
    oemModelId: "ssi-afd350-12",
    productVariantId: "12-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: ["Confirm 12-inch body thread specification matches"],
    disclaimer:
      "Verify thread engagement and gasket seal before pressurizing basin.",
  },

  // ---------------------------------------------------------------------------
  // 7-inch disc → TUC-D7-EPDM (2 mappings)
  // ---------------------------------------------------------------------------
  {
    id: "sanitaire-silver-ii-7--7-inch-disc-epdm",
    oemModelId: "sanitaire-silver-ii-7",
    productVariantId: "7-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "medium",
    requiredChecks: ["Confirm diffuser body is 7-inch variant, not 9-inch"],
    disclaimer:
      "The 7-inch and 9-inch Sanitaire disc bodies share a similar appearance. Measure the diffuser body diameter before ordering.",
  },
  {
    id: "edi-threaded-disc-7--7-inch-disc-epdm",
    oemModelId: "edi-threaded-disc-7",
    productVariantId: "7-inch-disc-epdm",
    fitStatus: "exact",
    confidence: "high",
    requiredChecks: [],
    disclaimer:
      "Verify thread engagement and gasket seal before pressurizing basin.",
  },

  // ---------------------------------------------------------------------------
  // 62mm tube → TUC-T62-EPDM (4 mappings)
  // ---------------------------------------------------------------------------
  {
    id: "sanitaire-mt2-tube--tube-62mm-epdm",
    oemModelId: "sanitaire-mt2-tube",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (610mm)"],
    disclaimer:
      "Tube membranes must match the exact length of the original diffuser body. Measure before ordering.",
  },
  {
    id: "edi-flexair-tube-62x610--tube-62mm-epdm",
    oemModelId: "edi-flexair-tube-62x610",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (610mm)"],
    disclaimer:
      "Tube membranes must match the exact length of the original diffuser body. Measure before ordering.",
  },
  {
    id: "edi-flexair-tube-62x762--tube-62mm-epdm",
    oemModelId: "edi-flexair-tube-62x762",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (762mm)"],
    disclaimer:
      "Tube membranes must match the exact length of the original diffuser body. Measure before ordering.",
  },
  {
    id: "edi-flexair-tube-62x1003--tube-62mm-epdm",
    oemModelId: "edi-flexair-tube-62x1003",
    productVariantId: "tube-62mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (1003mm)"],
    disclaimer:
      "Tube membranes must match the exact length of the original diffuser body. Measure before ordering.",
  },

  // ---------------------------------------------------------------------------
  // 62mm tube → TUC-T62-TPU (3 mappings)
  // ---------------------------------------------------------------------------
  {
    id: "sanitaire-mt2-tube--tube-62mm-tpu",
    oemModelId: "sanitaire-mt2-tube",
    productVariantId: "tube-62mm-tpu",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      "Confirm required tube length (610mm)",
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer:
      "TPU tube membranes are intended for oil, grease, or chemical exposure applications. Verify process conditions and tube length before ordering.",
  },
  {
    id: "edi-flexair-tube-62x610--tube-62mm-tpu",
    oemModelId: "edi-flexair-tube-62x610",
    productVariantId: "tube-62mm-tpu",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      "Confirm required tube length (610mm)",
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer:
      "TPU tube membranes are intended for oil, grease, or chemical exposure applications. Verify process conditions and tube length before ordering.",
  },
  {
    id: "edi-flexair-tube-62x1003--tube-62mm-tpu",
    oemModelId: "edi-flexair-tube-62x1003",
    productVariantId: "tube-62mm-tpu",
    fitStatus: "verify-dimensions",
    confidence: "medium",
    requiredChecks: [
      "Confirm required tube length (1003mm)",
      "Confirm wastewater conditions warrant TPU material selection",
    ],
    disclaimer:
      "TPU tube membranes are intended for oil, grease, or chemical exposure applications. Verify process conditions and tube length before ordering.",
  },

  // ---------------------------------------------------------------------------
  // 91mm tube → TUC-T91-EPDM (3 mappings)
  // ---------------------------------------------------------------------------
  {
    id: "edi-flexair-tube-91x502--tube-91mm-epdm",
    oemModelId: "edi-flexair-tube-91x502",
    productVariantId: "tube-91mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (502mm)"],
    disclaimer:
      "Tube membranes must match the exact length of the original diffuser body. Measure before ordering.",
  },
  {
    id: "edi-flexair-tube-91x762--tube-91mm-epdm",
    oemModelId: "edi-flexair-tube-91x762",
    productVariantId: "tube-91mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (762mm)"],
    disclaimer:
      "Tube membranes must match the exact length of the original diffuser body. Measure before ordering.",
  },
  {
    id: "edi-flexair-tube-91x1003--tube-91mm-epdm",
    oemModelId: "edi-flexair-tube-91x1003",
    productVariantId: "tube-91mm-epdm",
    fitStatus: "verify-dimensions",
    confidence: "high",
    requiredChecks: ["Confirm required tube length (1003mm)"],
    disclaimer:
      "Tube membranes must match the exact length of the original diffuser body. Measure before ordering.",
  },
];
