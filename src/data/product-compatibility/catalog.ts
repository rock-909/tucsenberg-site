import {
  oemBrandSchema,
  oemModelSchema,
  productGroupSchema,
  productVariantSchema,
} from "@/data/product-compatibility/schemas";

const productGroupData = [
  {
    id: "disc-membranes",
    slug: "disc-membranes",
    name: {
      en: "Disc replacement membranes",
      es: "[ES-TODO] Disc replacement membranes",
      zh: "[ZH-TODO] 盘式替换膜片",
    },
    description: {
      en: "Replacement disc membranes for common 7 inch, 9 inch, and 12 inch fine-bubble diffuser bodies.",
      es: "[ES-TODO] Replacement disc membranes for common 7 inch, 9 inch, and 12 inch fine-bubble diffuser bodies.",
      zh: "[ZH-TODO] 适配常见 7 寸、9 寸、12 寸微孔曝气盘体的替换膜片。",
    },
    category: "disc",
    variantIds: ["tuc-d9-epdm", "tuc-d9-tpu", "tuc-d12-epdm", "tuc-d7-epdm"],
  },
  {
    id: "tube-membranes",
    slug: "tube-membranes",
    name: {
      en: "Tube replacement membranes",
      es: "[ES-TODO] Tube replacement membranes",
      zh: "[ZH-TODO] 管式替换膜片",
    },
    description: {
      en: "Replacement tube membranes organized by outside diameter for installed fine-bubble tube diffuser systems.",
      es: "[ES-TODO] Replacement tube membranes organized by outside diameter for installed fine-bubble tube diffuser systems.",
      zh: "[ZH-TODO] 按外径组织的管式替换膜片，用于已安装微孔管式曝气系统。",
    },
    category: "tube",
    variantIds: ["tuc-t62-epdm", "tuc-t62-tpu", "tuc-t91-epdm"],
  },
] as const;

const productVariantData = [
  {
    id: "tuc-d9-epdm",
    slug: "tuc-d9-epdm",
    groupId: "disc-membranes",
    name: {
      en: "9 inch disc EPDM membrane",
      es: "[ES-TODO] 9 inch disc EPDM membrane",
      zh: "[ZH-TODO] 9 寸盘式 EPDM 膜片",
    },
    material: "epdm",
    sku: "TUC-D9-EPDM",
    phase: 1,
    specs: {
      diameter: '9" / 228.6 mm nominal membrane class',
    },
  },
  {
    id: "tuc-d9-tpu",
    slug: "tuc-d9-tpu",
    groupId: "disc-membranes",
    name: {
      en: "9 inch disc TPU membrane",
      es: "[ES-TODO] 9 inch disc TPU membrane",
      zh: "[ZH-TODO] 9 寸盘式 TPU 膜片",
    },
    material: "tpu",
    sku: "TUC-D9-TPU",
    phase: 1,
    specs: {
      diameter: '9" / 228.6 mm nominal membrane class',
    },
  },
  {
    id: "tuc-d12-epdm",
    slug: "tuc-d12-epdm",
    groupId: "disc-membranes",
    name: {
      en: "12 inch disc EPDM membrane",
      es: "[ES-TODO] 12 inch disc EPDM membrane",
      zh: "[ZH-TODO] 12 寸盘式 EPDM 膜片",
    },
    material: "epdm",
    sku: "TUC-D12-EPDM",
    phase: 1,
    specs: {
      diameter: '12" / 304.8 mm nominal membrane class',
    },
  },
  {
    id: "tuc-d7-epdm",
    slug: "tuc-d7-epdm",
    groupId: "disc-membranes",
    name: {
      en: "7 inch disc EPDM membrane",
      es: "[ES-TODO] 7 inch disc EPDM membrane",
      zh: "[ZH-TODO] 7 寸盘式 EPDM 膜片",
    },
    material: "epdm",
    sku: "TUC-D7-EPDM",
    phase: 1,
    specs: {
      diameter: '7" / 177.8 mm nominal membrane class',
    },
  },
  {
    id: "tuc-t62-epdm",
    slug: "tuc-t62-epdm",
    groupId: "tube-membranes",
    name: {
      en: "62 mm tube EPDM membrane",
      es: "[ES-TODO] 62 mm tube EPDM membrane",
      zh: "[ZH-TODO] 62 mm 管式 EPDM 膜片",
    },
    material: "epdm",
    sku: "TUC-T62-EPDM",
    phase: 1,
    specs: {
      diameter: "62 mm nominal tube membrane class",
    },
  },
  {
    id: "tuc-t62-tpu",
    slug: "tuc-t62-tpu",
    groupId: "tube-membranes",
    name: {
      en: "62 mm tube TPU membrane",
      es: "[ES-TODO] 62 mm tube TPU membrane",
      zh: "[ZH-TODO] 62 mm 管式 TPU 膜片",
    },
    material: "tpu",
    sku: "TUC-T62-TPU",
    phase: 1,
    specs: {
      diameter: "62 mm nominal tube membrane class",
    },
  },
  {
    id: "tuc-t91-epdm",
    slug: "tuc-t91-epdm",
    groupId: "tube-membranes",
    name: {
      en: "91 mm tube EPDM membrane",
      es: "[ES-TODO] 91 mm tube EPDM membrane",
      zh: "[ZH-TODO] 91 mm 管式 EPDM 膜片",
    },
    material: "epdm",
    sku: "TUC-T91-EPDM",
    phase: 1,
    specs: {
      diameter: "91 mm nominal tube membrane class",
    },
  },
] as const;

const oemBrandData = [
  {
    id: "sanitaire",
    slug: "sanitaire",
    name: "Sanitaire",
    trademarkDisclaimer: {
      en: "Sanitaire is a registered trademark of Xylem. Tucsenberg is not affiliated with or endorsed by Xylem.",
      es: "[ES-TODO] Sanitaire is a registered trademark of Xylem. Tucsenberg is not affiliated with or endorsed by Xylem.",
      zh: "[ZH-TODO] Sanitaire is a registered trademark of Xylem. Tucsenberg is not affiliated with or endorsed by Xylem.",
    },
    modelIds: [
      "sanitaire-silver-series-ii-9-inch-disc",
      "sanitaire-silver-series-ii-7-inch-disc",
      "sanitaire-mt-2",
    ],
  },
  {
    id: "edi",
    slug: "edi",
    name: "EDI",
    trademarkDisclaimer: {
      en: "EDI is a registered trademark of Environmental Dynamics International. Tucsenberg is not affiliated with or endorsed by Environmental Dynamics International.",
      es: "[ES-TODO] EDI is a registered trademark of Environmental Dynamics International. Tucsenberg is not affiliated with or endorsed by Environmental Dynamics International.",
      zh: "[ZH-TODO] EDI is a registered trademark of Environmental Dynamics International. Tucsenberg is not affiliated with or endorsed by Environmental Dynamics International.",
    },
    modelIds: [
      "edi-flexair-threaded-disc-7-inch",
      "edi-flexair-threaded-disc-9-inch",
      "edi-flexair-threaded-disc-12-inch",
      "edi-flexair-t-series-62-mm",
      "edi-flexair-t-series-91-mm",
    ],
  },
  {
    id: "ssi-aeration",
    slug: "ssi-aeration",
    name: "SSI Aeration",
    trademarkDisclaimer: {
      en: "SSI Aeration is a registered trademark of SSI Aeration. Tucsenberg is not affiliated with or endorsed by SSI Aeration.",
      es: "[ES-TODO] SSI Aeration is a registered trademark of SSI Aeration. Tucsenberg is not affiliated with or endorsed by SSI Aeration.",
      zh: "[ZH-TODO] SSI Aeration is a registered trademark of SSI Aeration. Tucsenberg is not affiliated with or endorsed by SSI Aeration.",
    },
    modelIds: [
      "ssi-afd270-9-inch-disc",
      "ssi-aft-62-mm-tube",
      "ssi-aft-91-mm-tube",
    ],
  },
] as const;

const oemModelData = [
  {
    id: "sanitaire-silver-series-ii-9-inch-disc",
    slug: "sanitaire-silver-series-ii-9-inch-disc",
    brandId: "sanitaire",
    name: "Silver Series II 9 inch Disc",
    oemPartNumbers: ["00223", "MM01", "MM02", "MM03"],
    searchAliases: [
      "Sanitaire 9 inch disc",
      "Sanitaire Silver Series II",
      "Silver Series II 9",
      "Silver Series II 9 inch",
    ],
    category: "disc",
    specs: {
      diameter: '229 mm / 9" membrane',
      connectionStyle: "Top-sealing threaded retainer ring",
    },
  },
  {
    id: "sanitaire-silver-series-ii-7-inch-disc",
    slug: "sanitaire-silver-series-ii-7-inch-disc",
    brandId: "sanitaire",
    name: "Silver Series II 7 inch Disc",
    oemPartNumbers: ["00919"],
    searchAliases: [
      "Sanitaire 7 inch disc",
      "Sanitaire Silver Series II",
      "Silver Series II 7",
      "Silver Series II 7 inch",
    ],
    category: "disc",
    specs: {
      diameter: '7" membrane class',
      connectionStyle: "Top-sealing threaded retainer ring",
    },
  },
  {
    id: "sanitaire-mt-2",
    slug: "sanitaire-mt-2",
    brandId: "sanitaire",
    name: "MT-2 Tube",
    oemPartNumbers: ["00326", "00325"],
    searchAliases: [
      "Sanitaire MT-2",
      "Sanitaire MT2",
      "MT2 tube",
      "MT-2 62x610",
      "MT2 62x610",
    ],
    category: "tube",
    specs: {
      diameter: "62 mm",
      length: '610 mm / 24" body',
      connectionStyle: '3/4" 304 stainless steel nipple',
    },
  },
  {
    id: "edi-flexair-threaded-disc-7-inch",
    slug: "edi-flexair-threaded-disc-7-inch",
    brandId: "edi",
    name: "FlexAir Threaded Disc 7 inch",
    oemPartNumbers: ["01691", "02001", "01319"],
    searchAliases: [
      "EDI 7 inch disc",
      "FlexAir 7 inch disc",
      "FlexAir Threaded Disc 7",
    ],
    category: "disc",
    specs: {
      diameter: "177.8 mm membrane",
      connectionStyle: '3/4" NPT threaded connection',
    },
  },
  {
    id: "edi-flexair-threaded-disc-9-inch",
    slug: "edi-flexair-threaded-disc-9-inch",
    brandId: "edi",
    name: "FlexAir Threaded Disc 9 inch",
    oemPartNumbers: ["01798", "01799", "00223", "32154", "32152"],
    searchAliases: [
      "EDI 9 inch disc",
      "FlexAir 9 inch disc",
      "FlexAir Threaded Disc 9",
    ],
    category: "disc",
    specs: {
      diameter: "228.6 mm membrane",
      connectionStyle: '3/4" NPT threaded connection',
    },
  },
  {
    id: "edi-flexair-threaded-disc-12-inch",
    slug: "edi-flexair-threaded-disc-12-inch",
    brandId: "edi",
    name: "FlexAir Threaded Disc 12 inch",
    oemPartNumbers: ["06078", "06080", "07228"],
    searchAliases: [
      "EDI 12 inch disc",
      "FlexAir 12 inch disc",
      "FlexAir Threaded Disc 12",
    ],
    category: "disc",
    specs: {
      diameter: "304.8 mm membrane",
      connectionStyle: '3/4" NPT threaded connection',
    },
  },
  {
    id: "edi-flexair-t-series-62-mm",
    slug: "edi-flexair-t-series-62-mm",
    brandId: "edi",
    name: "FlexAir T-Series 62 mm Tube",
    oemPartNumbers: [
      "00249",
      "00250",
      "00251",
      "00252",
      "01202",
      "01026",
      "01029",
      "01030",
      "00201",
      "00232",
      "00200",
      "00231",
      "00204",
      "00322",
      "00202",
      "00334",
    ],
    searchAliases: [
      "EDI FlexAir 62x610",
      "FlexAir 62x610",
      "FlexAir 62 mm",
      "FlexAir 62x650",
      "FlexAir 62x762",
      "FlexAir 62x1003",
      "FlexAir T-Series 62",
    ],
    category: "tube",
    specs: {
      diameter: "62 mm nominal / 66 mm outside diameter",
      length: "610, 650, 762, or 1003 mm",
      connectionStyle: '3/4" NPT stainless steel nipple',
    },
  },
  {
    id: "edi-flexair-t-series-91-mm",
    slug: "edi-flexair-t-series-91-mm",
    brandId: "edi",
    name: "FlexAir T-Series 91 mm Tube",
    oemPartNumbers: [
      "00256",
      "00253",
      "00259",
      "00262",
      "00268",
      "00265",
      "00213",
      "00243",
      "00215",
      "00244",
      "00211",
      "00239",
    ],
    searchAliases: [
      "EDI FlexAir 91x502",
      "FlexAir 91x502",
      "FlexAir 91 mm",
      "FlexAir 91x762",
      "FlexAir 91x1003",
      "FlexAir T-Series 91",
    ],
    category: "tube",
    specs: {
      diameter: "91 mm nominal / 95 mm outside diameter",
      length: "502, 762, or 1003 mm",
      connectionStyle: '3/4" NPT stainless steel nipple',
    },
  },
  {
    id: "ssi-afd270-9-inch-disc",
    slug: "ssi-afd270-9-inch-disc",
    brandId: "ssi-aeration",
    name: "AFD270 9 inch Disc",
    oemPartNumbers: ["AFD270", "AFD270-E", "B07KBHGX2V"],
    searchAliases: [
      "SSI AFD270",
      "SSI AFD270-E",
      "AFD270 EPDM membrane",
      "SSI 9 inch disc",
    ],
    category: "disc",
    specs: {
      diameter: '9" / 230 mm membrane',
      connectionStyle: '3/4" NPT connection',
    },
  },
  {
    id: "ssi-aft-62-mm-tube",
    slug: "ssi-aft-62-mm-tube",
    brandId: "ssi-aeration",
    name: "AFT 62 mm Tube",
    oemPartNumbers: ["AFT-N2500-E", "MM11"],
    searchAliases: [
      "SSI AFT 62",
      "AFT 62 mm",
      "AFT-N2500-E",
      "SSI AFT 2.5 inch",
    ],
    category: "tube",
    specs: {
      diameter: '62 mm / 2.5" tube class',
      length: "500-1000 mm range",
      connectionStyle: 'AFT-S saddle or AFT-N 3/4" stainless steel nipple',
    },
  },
  {
    id: "ssi-aft-91-mm-tube",
    slug: "ssi-aft-91-mm-tube",
    brandId: "ssi-aeration",
    name: "AFT 91 mm Tube",
    oemPartNumbers: ["AFT-N3500-E"],
    searchAliases: [
      "SSI AFT 91",
      "AFT 91 mm",
      "AFT-N3500-E",
      "SSI AFT 3.5 inch",
    ],
    category: "tube",
    specs: {
      diameter: '91 mm / 3.5" tube class',
      length: "500-1000 mm range",
      connectionStyle: 'AFT-S saddle or AFT-N 3/4" stainless steel nipple',
    },
  },
] as const;

export const productGroups = productGroupSchema.array().parse(productGroupData);
export const productVariants = productVariantSchema
  .array()
  .parse(productVariantData);
export const oemBrands = oemBrandSchema.array().parse(oemBrandData);
export const oemModels = oemModelSchema.array().parse(oemModelData);
