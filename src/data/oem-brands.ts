import type { OEMBrand } from "@/data/schemas";

export const oemBrands: OEMBrand[] = [
  {
    id: "sanitaire",
    slug: "sanitaire",
    name: "Sanitaire",
    parentCompany: "Xylem",
    trademarkDisclaimer: {
      en: "Sanitaire is a registered trademark of Xylem Inc. Tucsenberg is not affiliated with or endorsed by Xylem Inc.",
      es: "Sanitaire es una marca registrada de Xylem Inc. Tucsenberg no está afiliado ni respaldado por Xylem Inc.",
      zh: "Sanitaire 是 Xylem Inc. 的注册商标。Tucsenberg 与 Xylem Inc. 无任何关联或背书关系。",
    },
    modelIds: [
      "sanitaire-silver-ii-9",
      "sanitaire-silver-ii-7",
      "sanitaire-mt2-tube",
    ],
  },
  {
    id: "edi",
    slug: "edi",
    name: "EDI",
    parentCompany: "Environmental Dynamics International",
    trademarkDisclaimer: {
      en: "EDI and FlexAir are registered trademarks of Environmental Dynamics International. Tucsenberg is not affiliated with or endorsed by EDI.",
      es: "EDI y FlexAir son marcas registradas de Environmental Dynamics International. Tucsenberg no está afiliado ni respaldado por EDI.",
      zh: "EDI 和 FlexAir 是 Environmental Dynamics International 的注册商标。Tucsenberg 与 EDI 无任何关联或背书关系。",
    },
    modelIds: [
      "edi-threaded-disc-9",
      "edi-threaded-disc-12",
      "edi-threaded-disc-7",
      "edi-flexair-tube-62x610",
      "edi-flexair-tube-62x762",
      "edi-flexair-tube-62x1003",
      "edi-flexair-tube-91x502",
      "edi-flexair-tube-91x762",
      "edi-flexair-tube-91x1003",
    ],
  },
  {
    id: "ssi",
    slug: "ssi",
    name: "SSI Aeration",
    trademarkDisclaimer: {
      en: "SSI Aeration is a registered trademark of SSI Aeration, Inc. Tucsenberg is not affiliated with or endorsed by SSI Aeration, Inc.",
      es: "SSI Aeration es una marca registrada de SSI Aeration, Inc. Tucsenberg no está afiliado ni respaldado por SSI Aeration, Inc.",
      zh: "SSI Aeration 是 SSI Aeration, Inc. 的注册商标。Tucsenberg 与 SSI Aeration, Inc. 无任何关联或背书关系。",
    },
    modelIds: ["ssi-afd270-9", "ssi-afd350-12"],
  },
];
