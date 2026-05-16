import type { ProductGroup, ProductVariant } from "@/data/schemas";

// ---------------------------------------------------------------------------
// Product Groups
// ---------------------------------------------------------------------------

export const productGroups: ProductGroup[] = [
  {
    id: "9-inch-disc",
    slug: "9-inch-disc",
    name: {
      en: "9-inch Disc Membrane",
      es: "Membrana de disco de 9 pulgadas",
      zh: "9英寸盘式膜片",
    },
    description: {
      en: "9-inch disc diffuser replacement membranes available in EPDM and TPU materials.",
      es: "Membranas de reemplazo para difusores de disco de 9 pulgadas disponibles en materiales EPDM y TPU.",
      zh: "9英寸盘式曝气器替换膜片，提供EPDM和TPU材质。",
    },
    category: "disc",
    variantIds: ["9-inch-disc-epdm", "9-inch-disc-tpu"],
  },
  {
    id: "12-inch-disc",
    slug: "12-inch-disc",
    name: {
      en: "12-inch Disc Membrane",
      es: "Membrana de disco de 12 pulgadas",
      zh: "12英寸盘式膜片",
    },
    description: {
      en: "12-inch disc diffuser replacement membranes available in EPDM.",
      es: "Membranas de reemplazo para difusores de disco de 12 pulgadas disponibles en EPDM.",
      zh: "12英寸盘式曝气器替换膜片，提供EPDM材质。",
    },
    category: "disc",
    variantIds: ["12-inch-disc-epdm"],
  },
  {
    id: "7-inch-disc",
    slug: "7-inch-disc",
    name: {
      en: "7-inch Disc Membrane",
      es: "Membrana de disco de 7 pulgadas",
      zh: "7英寸盘式膜片",
    },
    description: {
      en: "7-inch disc diffuser replacement membranes available in EPDM.",
      es: "Membranas de reemplazo para difusores de disco de 7 pulgadas disponibles en EPDM.",
      zh: "7英寸盘式曝气器替换膜片，提供EPDM材质。",
    },
    category: "disc",
    variantIds: ["7-inch-disc-epdm"],
  },
  {
    id: "tube-62mm",
    slug: "tube-62mm",
    name: {
      en: "62mm Tube Membrane",
      es: "Membrana tubular de 62mm",
      zh: "62mm管式膜片",
    },
    description: {
      en: "62mm tube diffuser replacement membranes available in EPDM and TPU materials.",
      es: "Membranas de reemplazo para difusores tubulares de 62mm disponibles en materiales EPDM y TPU.",
      zh: "62mm管式曝气器替换膜片，提供EPDM和TPU材质。",
    },
    category: "tube",
    variantIds: ["tube-62mm-epdm", "tube-62mm-tpu"],
  },
  {
    id: "tube-91mm",
    slug: "tube-91mm",
    name: {
      en: "91mm Tube Membrane",
      es: "Membrana tubular de 91mm",
      zh: "91mm管式膜片",
    },
    description: {
      en: "91mm tube diffuser replacement membranes available in EPDM.",
      es: "Membranas de reemplazo para difusores tubulares de 91mm disponibles en EPDM.",
      zh: "91mm管式曝气器替换膜片，提供EPDM材质。",
    },
    category: "tube",
    variantIds: ["tube-91mm-epdm"],
  },
];

// ---------------------------------------------------------------------------
// Product Variants
// ---------------------------------------------------------------------------

export const productVariants: ProductVariant[] = [
  // 9-inch disc variants
  {
    id: "9-inch-disc-epdm",
    slug: "9-inch-epdm-disc-replacement",
    groupId: "9-inch-disc",
    name: {
      en: "9-inch EPDM Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco EPDM de 9 pulgadas",
      zh: "9英寸EPDM盘式替换膜片",
    },
    material: "epdm",
    sku: "TUC-D9-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 9, unit: "inch" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
      shoreHardness: 55,
      tensileStrength: 1300,
    },
  },
  {
    id: "9-inch-disc-tpu",
    slug: "9-inch-tpu-disc-replacement",
    groupId: "9-inch-disc",
    name: {
      en: "9-inch TPU Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco TPU de 9 pulgadas",
      zh: "9英寸TPU盘式替换膜片",
    },
    material: "tpu",
    sku: "TUC-D9-TPU",
    phase: 1,
    specs: {
      diameter: { value: 9, unit: "inch" },
      temperatureRange: { min: -20, max: 70, unit: "celsius" },
      shoreHardness: 85,
      tensileStrength: 3500,
    },
  },

  // 12-inch disc variant
  {
    id: "12-inch-disc-epdm",
    slug: "12-inch-epdm-disc-replacement",
    groupId: "12-inch-disc",
    name: {
      en: "12-inch EPDM Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco EPDM de 12 pulgadas",
      zh: "12英寸EPDM盘式替换膜片",
    },
    material: "epdm",
    sku: "TUC-D12-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 12, unit: "inch" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },

  // 7-inch disc variant
  {
    id: "7-inch-disc-epdm",
    slug: "7-inch-epdm-disc-replacement",
    groupId: "7-inch-disc",
    name: {
      en: "7-inch EPDM Disc Replacement Membrane",
      es: "Membrana de reemplazo de disco EPDM de 7 pulgadas",
      zh: "7英寸EPDM盘式替换膜片",
    },
    material: "epdm",
    sku: "TUC-D7-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 7, unit: "inch" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },

  // 62mm tube variants
  {
    id: "tube-62mm-epdm",
    slug: "62mm-epdm-tube-replacement",
    groupId: "tube-62mm",
    name: {
      en: "62mm EPDM Tube Replacement Membrane",
      es: "Membrana tubular de reemplazo EPDM de 62mm",
      zh: "62mm EPDM管式替换膜片",
    },
    material: "epdm",
    sku: "TUC-T62-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 62, unit: "mm" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },
  {
    id: "tube-62mm-tpu",
    slug: "62mm-tpu-tube-replacement",
    groupId: "tube-62mm",
    name: {
      en: "62mm TPU Tube Replacement Membrane",
      es: "Membrana tubular de reemplazo TPU de 62mm",
      zh: "62mm TPU管式替换膜片",
    },
    material: "tpu",
    sku: "TUC-T62-TPU",
    phase: 1,
    specs: {
      diameter: { value: 62, unit: "mm" },
      temperatureRange: { min: -20, max: 70, unit: "celsius" },
    },
  },

  // 91mm tube variant
  {
    id: "tube-91mm-epdm",
    slug: "91mm-epdm-tube-replacement",
    groupId: "tube-91mm",
    name: {
      en: "91mm EPDM Tube Replacement Membrane",
      es: "Membrana tubular de reemplazo EPDM de 91mm",
      zh: "91mm EPDM管式替换膜片",
    },
    material: "epdm",
    sku: "TUC-T91-EPDM",
    phase: 1,
    specs: {
      diameter: { value: 91, unit: "mm" },
      temperatureRange: { min: -40, max: 115, unit: "celsius" },
    },
  },
];
