import type { MarketDefinition, ProductCatalog } from "@/config/site-types";

const productLines = [
  {
    slug: "abs-flood-barriers",
    label: "ABS Interlocking Boxwall",
    standardLabel: "TB-BW series",
    description:
      "Freestanding ABS interlocking flood barriers for driveways, doorways and paved perimeters.",
    sizeSystem: "mm",
    standardIds: ["tb_bw"],
  },
  {
    slug: "aluminum-flood-gates",
    label: "Aluminum Flood Gates",
    standardLabel: "TB-AG series",
    description:
      "Demountable aluminum plank systems for doors, garages, loading docks and shopfronts.",
    sizeSystem: "mm",
    standardIds: ["tb_ag"],
  },
  {
    slug: "absorbent-flood-bags",
    label: "Absorbent Flood Bags",
    standardLabel: "TB-FB series",
    description:
      "Water-activated sandless flood bags for low-level freshwater leaks, thresholds and reseller stock.",
    sizeSystem: "mm",
    standardIds: ["tb_fb"],
  },
  {
    slug: "flood-tube-dams",
    label: "Water & Air-Filled Tube Dams",
    standardLabel: "TB-TD series",
    description:
      "Inflatable PVC tube dams for long runs, rough ground and planned emergency stock.",
    sizeSystem: "mm",
    standardIds: ["tb_td"],
  },
  {
    slug: "frp-flood-barriers",
    label: "FRP Composite Planks",
    standardLabel: "TB-CP series",
    description:
      "Order-driven pultruded FRP flood planks for coastal, industrial and electrical sites.",
    sizeSystem: "mm",
    standardIds: ["tb_cp"],
  },
] as const satisfies readonly MarketDefinition[];

export type ProductMarketSlug = (typeof productLines)[number]["slug"];

export const singleSiteProductCatalog = {
  markets: productLines,
} as const satisfies ProductCatalog;
