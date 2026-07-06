export interface RequestQuoteOption {
  readonly value: string;
  readonly labelKey: string;
}

export const REQUEST_QUOTE_PROTECTION_OPTIONS = [
  { value: "door", labelKey: "options.protection.door" },
  { value: "garage", labelKey: "options.protection.garage" },
  { value: "driveway", labelKey: "options.protection.driveway" },
  { value: "loading-dock", labelKey: "options.protection.loadingDock" },
  { value: "perimeter", labelKey: "options.protection.perimeter" },
  {
    value: "stock-resale-order",
    labelKey: "options.protection.stockResaleOrder",
  },
  { value: "other", labelKey: "options.protection.other" },
] as const satisfies readonly RequestQuoteOption[];

export const REQUEST_QUOTE_MOUNTING_SURFACE_OPTIONS = [
  { value: "concrete", labelKey: "options.mounting.concrete" },
  { value: "masonry", labelKey: "options.mounting.masonry" },
  { value: "steel", labelKey: "options.mounting.steel" },
  { value: "timber", labelKey: "options.mounting.timber" },
  { value: "ground-soil", labelKey: "options.mounting.groundSoil" },
  { value: "other", labelKey: "options.mounting.other" },
] as const satisfies readonly RequestQuoteOption[];

export const REQUEST_QUOTE_MATERIAL_OPTIONS = [
  { value: "advise-me", labelKey: "options.material.adviseMe" },
  {
    value: "abs-flood-barriers",
    labelKey: "options.material.absFloodBarriers",
  },
  {
    value: "aluminum-flood-gates",
    labelKey: "options.material.aluminumFloodGates",
  },
  {
    value: "absorbent-flood-bags",
    labelKey: "options.material.absorbentFloodBags",
  },
  { value: "flood-tube-dams", labelKey: "options.material.floodTubeDams" },
  {
    value: "frp-flood-barriers",
    labelKey: "options.material.frpFloodBarriers",
  },
] as const satisfies readonly RequestQuoteOption[];

export const REQUEST_QUOTE_QUANTITY_OPTIONS = [
  { value: "sample-carton", labelKey: "options.quantity.sampleCarton" },
  { value: "cartons", labelKey: "options.quantity.cartons" },
  { value: "pallet", labelKey: "options.quantity.pallet" },
  { value: "lcl", labelKey: "options.quantity.lcl" },
  { value: "container", labelKey: "options.quantity.container" },
  { value: "project-schedule", labelKey: "options.quantity.projectSchedule" },
] as const satisfies readonly RequestQuoteOption[];

export const REQUEST_QUOTE_TIMELINE_OPTIONS = [
  { value: "urgent", labelKey: "options.timeline.urgent" },
  { value: "this-season", labelKey: "options.timeline.thisSeason" },
  { value: "planning", labelKey: "options.timeline.planning" },
] as const satisfies readonly RequestQuoteOption[];

export const REQUEST_QUOTE_DEFAULT_MATERIAL_VALUE = "advise-me";
