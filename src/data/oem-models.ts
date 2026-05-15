import type { OEMModel } from "@/data/schemas";

export const oemModels: OEMModel[] = [
  // -------------------------------------------------------------------------
  // Sanitaire (Xylem)
  // -------------------------------------------------------------------------
  {
    id: "sanitaire-silver-ii-9",
    slug: "sanitaire-silver-series-ii-9-inch",
    brandId: "sanitaire",
    name: "Silver Series II 9-inch",
    oemPartNumbers: ["EDI 00223"],
    category: "disc",
    specs: {
      diameter: { value: 9, unit: "inch" },
      connectionStyle: '3/4" NPT threaded',
      airFlowRange: { min: 0.8, max: 6.8, unit: "sm3/hr/m" },
    },
  },
  {
    id: "sanitaire-silver-ii-7",
    slug: "sanitaire-silver-series-ii-7-inch",
    brandId: "sanitaire",
    name: "Silver Series II 7-inch",
    oemPartNumbers: [],
    category: "disc",
    specs: {
      diameter: { value: 7, unit: "inch" },
      connectionStyle: '3/4" NPT threaded',
    },
  },
  {
    id: "sanitaire-mt2-tube",
    slug: "sanitaire-mt2-tube-62x610",
    brandId: "sanitaire",
    name: "MT-2 Tube 62×610mm",
    oemPartNumbers: ["EDI 00326", "EDI 00325"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 610, unit: "mm" },
      connectionStyle: '3/4" 304 SS nipple',
    },
  },

  // -------------------------------------------------------------------------
  // EDI – Disc models
  // -------------------------------------------------------------------------
  {
    id: "edi-threaded-disc-9",
    slug: "edi-threaded-disc-9-inch",
    brandId: "edi",
    name: "Threaded Disc 9-inch",
    oemPartNumbers: ["01798", "01799"],
    category: "disc",
    specs: {
      diameter: { value: 9, unit: "inch" },
      connectionStyle: '3/4" NPT threaded',
      airFlowRange: { min: 6, max: 10, unit: "scfm" },
    },
  },
  {
    id: "edi-threaded-disc-12",
    slug: "edi-threaded-disc-12-inch",
    brandId: "edi",
    name: "Threaded Disc 12-inch",
    oemPartNumbers: ["06078", "06080"],
    category: "disc",
    specs: {
      diameter: { value: 12, unit: "inch" },
      airFlowRange: { min: 9.4, max: 16, unit: "scfm" },
    },
  },
  {
    id: "edi-threaded-disc-7",
    slug: "edi-threaded-disc-7-inch",
    brandId: "edi",
    name: "Threaded Disc 7-inch",
    oemPartNumbers: ["01691", "02001"],
    category: "disc",
    specs: {
      diameter: { value: 7, unit: "inch" },
      airFlowRange: { min: 3, max: 7.5, unit: "scfm" },
    },
  },

  // -------------------------------------------------------------------------
  // EDI – Tube models (62mm)
  // -------------------------------------------------------------------------
  {
    id: "edi-flexair-tube-62x610",
    slug: "edi-flexair-tube-62x610mm",
    brandId: "edi",
    name: "FlexAir Tube 62×610mm",
    oemPartNumbers: ["00249", "00250"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 610, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 2, max: 8, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-62x762",
    slug: "edi-flexair-tube-62x762mm",
    brandId: "edi",
    name: "FlexAir Tube 62×762mm",
    oemPartNumbers: ["01202", "01026"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 762, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 3, max: 10, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-62x1003",
    slug: "edi-flexair-tube-62x1003mm",
    brandId: "edi",
    name: "FlexAir Tube 62×1003mm",
    oemPartNumbers: ["01029", "01030"],
    category: "tube",
    specs: {
      diameter: { value: 62, unit: "mm" },
      length: { value: 1003, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 3, max: 14, unit: "scfm" },
    },
  },

  // -------------------------------------------------------------------------
  // EDI – Tube models (91mm)
  // -------------------------------------------------------------------------
  {
    id: "edi-flexair-tube-91x502",
    slug: "edi-flexair-tube-91x502mm",
    brandId: "edi",
    name: "FlexAir Tube 91×502mm",
    oemPartNumbers: ["00256", "00253"],
    category: "tube",
    specs: {
      diameter: { value: 91, unit: "mm" },
      length: { value: 502, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 4, max: 13, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-91x762",
    slug: "edi-flexair-tube-91x762mm",
    brandId: "edi",
    name: "FlexAir Tube 91×762mm",
    oemPartNumbers: ["00259", "00262"],
    category: "tube",
    specs: {
      diameter: { value: 91, unit: "mm" },
      length: { value: 762, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 7, max: 20, unit: "scfm" },
    },
  },
  {
    id: "edi-flexair-tube-91x1003",
    slug: "edi-flexair-tube-91x1003mm",
    brandId: "edi",
    name: "FlexAir Tube 91×1003mm",
    oemPartNumbers: ["00268", "00265"],
    category: "tube",
    specs: {
      diameter: { value: 91, unit: "mm" },
      length: { value: 1003, unit: "mm" },
      connectionStyle: "SS nipple",
      airFlowRange: { min: 9, max: 27, unit: "scfm" },
    },
  },

  // -------------------------------------------------------------------------
  // SSI Aeration
  // -------------------------------------------------------------------------
  {
    id: "ssi-afd270-9",
    slug: "ssi-afd270-9-inch",
    brandId: "ssi",
    name: "AFD270 9-inch Disc",
    oemPartNumbers: [],
    category: "disc",
    specs: {
      diameter: { value: 9, unit: "inch" },
      connectionStyle: '3/4" NPT',
    },
  },
  {
    id: "ssi-afd350-12",
    slug: "ssi-afd350-12-inch",
    brandId: "ssi",
    name: "AFD350 12-inch Disc",
    oemPartNumbers: [],
    category: "disc",
    specs: {
      diameter: { value: 12, unit: "inch" },
      connectionStyle: '3/4" NPT',
    },
  },
];
