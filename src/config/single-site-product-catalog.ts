import type {
  MarketDefinition,
  ProductCatalog,
  ProductFamilyDefinition,
} from "@/config/site-types";

const productLines = [
  {
    slug: "abs-flood-barriers",
    label: "ABS Interlocking Boxwall",
    standardLabel: "TB-BW series",
    description:
      "Freestanding ABS interlocking flood barriers for driveways, doorways and paved perimeters.",
    sizeSystem: "mm",
    standardIds: ["tb_bw"],
    familySlugs: ["abs-boxwall"],
  },
  {
    slug: "aluminum-flood-gates",
    label: "Aluminum Flood Gates",
    standardLabel: "TB-AG series",
    description:
      "Demountable aluminum plank systems for doors, garages, loading docks and shopfronts.",
    sizeSystem: "mm",
    standardIds: ["tb_ag"],
    familySlugs: ["aluminum-gates"],
  },
  {
    slug: "absorbent-flood-bags",
    label: "Absorbent Flood Bags",
    standardLabel: "TB-FB series",
    description:
      "Water-activated sandless flood bags for low-level freshwater leaks, thresholds and reseller stock.",
    sizeSystem: "mm",
    standardIds: ["tb_fb"],
    familySlugs: ["absorbent-bags"],
  },
  {
    slug: "flood-tube-dams",
    label: "Water & Air-Filled Tube Dams",
    standardLabel: "TB-TD series",
    description:
      "Inflatable PVC tube dams for long runs, rough ground and planned emergency stock.",
    sizeSystem: "mm",
    standardIds: ["tb_td"],
    familySlugs: ["tube-dams"],
  },
  {
    slug: "frp-flood-barriers",
    label: "FRP Composite Planks",
    standardLabel: "TB-CP series",
    description:
      "Order-driven pultruded FRP flood planks for coastal, industrial and electrical sites.",
    sizeSystem: "mm",
    standardIds: ["tb_cp"],
    familySlugs: ["frp-planks"],
  },
] as const satisfies readonly MarketDefinition[];

const families = [
  {
    slug: "abs-boxwall",
    label: "ABS boxwall units",
    description:
      "Straight, curved and gable-end ABS units for freestanding runs.",
    marketSlug: "abs-flood-barriers",
    labelKey: "abs-flood-barriers.abs-boxwall.label",
  },
  {
    slug: "aluminum-gates",
    label: "Aluminum demountable systems",
    description:
      "Planks, posts, seals and spares custom-cut to each opening schedule.",
    marketSlug: "aluminum-flood-gates",
    labelKey: "aluminum-flood-gates.aluminum-gates.label",
  },
  {
    slug: "absorbent-bags",
    label: "Water-activated flood bags",
    description:
      "Flat-packed SAP-core bags for rain and inland freshwater flooding.",
    marketSlug: "absorbent-flood-bags",
    labelKey: "absorbent-flood-bags.absorbent-bags.label",
  },
  {
    slug: "tube-dams",
    label: "Inflatable tube dam sections",
    description:
      "Five and ten metre PVC sections with pump, skirt, nails and repair kit.",
    marketSlug: "flood-tube-dams",
    labelKey: "flood-tube-dams.tube-dams.label",
  },
  {
    slug: "frp-planks",
    label: "Pultruded composite planks",
    description:
      "Order-driven FRP plank profiles with span and deflection data compiled per first runs.",
    marketSlug: "frp-flood-barriers",
    labelKey: "frp-flood-barriers.frp-planks.label",
  },
] as const satisfies readonly ProductFamilyDefinition[];

export type ProductMarketSlug = (typeof productLines)[number]["slug"];

export const singleSiteProductCatalog = {
  markets: productLines,
  families,
} as const satisfies ProductCatalog;
