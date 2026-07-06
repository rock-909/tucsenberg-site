/**
 * Legacy/starter catalog fixture.
 *
 * This file is not the current Tucsenberg product-page runtime truth. The
 * live product detail pages and JSON-LD use src/constants/tucsenberg-product-pages.ts.
 * Keep this fixture only for starter/profile compatibility until an approved
 * retirement proof removes or replaces the legacy catalog path.
 */

import type { MarketSpecs } from "@/constants/product-specs/types";

const updatedAt = "2026-07-02T00:00:00Z";
const sharedTrade = {
  moq: "Quoted by line: carton, pallet, LCL, container, or project schedule.",
  leadTime:
    "Standard items quoted within 12 hours; custom configurations within 48.",
  supplyCapacity: "Confirmed with each quotation.",
  packaging: "Carton, pallet, LCL, container, and mixed-line consolidation.",
  portOfLoading: "China port confirmed at quotation.",
} as const;

export const ABS_FLOOD_BARRIER_SPECS = {
  updatedAt,
  technical: {
    material: "UV-stabilised ABS",
    workingTemperature: "-40 °C to +95 °C",
    configurations: "Straight, inward/outward curve, gable end",
  },
  certifications: [],
  trade: sharedTrade,
  families: [
    {
      slug: "abs-boxwall",
      images: ["/images/products/tb-bw-placeholder.svg"],
      highlights: [
        "Freestanding L-profile; no anchors, no drilling, no damage to the surface.",
        "Mechanical locking-and-coupling joint; no tools, no loose pins.",
        "Straight, inward/outward curve and gable-end units available at every height.",
      ],
      specGroups: [
        {
          groupLabel: "TB-BW series",
          columns: [
            "Height",
            "Model",
            "Straight unit",
            "Curve units (in/out)",
            "Wall thickness",
          ],
          rows: [
            ["50 cm", "TB-BW50", "3.8 kg", "2.8 / 2.7 kg", "4 mm"],
            ["60 cm", "TB-BW60", "7.4 kg", "3.3 / 3.3 kg", "4-5 mm"],
            ["75 cm", "TB-BW75", "9.8 kg", "3.2 / 3.2 kg", "4-5 mm"],
            [
              "85 cm (with handle)",
              "TB-BW85",
              "9.8 kg",
              "5 / 5 kg",
              "5 mm - effective stop height 75 cm",
            ],
          ],
        },
      ],
    },
  ],
} as const satisfies MarketSpecs;

export const ALUMINUM_FLOOD_GATE_SPECS = {
  updatedAt,
  technical: {
    material: "6063-T6 aluminum with EPDM seals",
    plankProfileHeight: "180 mm",
    postOptions: "wall-mount / ground-socket / freestanding",
  },
  certifications: [],
  trade: sharedTrade,
  families: [
    {
      slug: "aluminum-gates",
      images: ["/images/products/tb-ag-placeholder.svg"],
      highlights: [
        "Custom-cut to your opening schedule from tested profiles.",
        "Replacement seals, clamps and single planks stay orderable for years.",
        "Wall-mounted channels, ground-socket posts and freestanding posts.",
      ],
      specGroups: [
        {
          groupLabel: "TB-AG series",
          columns: ["Parameter", "Value"],
          rows: [
            ["Plank profile height", "180 mm"],
            ["Alloy / temper", "6063-T6"],
            ["Wall thickness", ">=2.0 mm"],
            [
              "Plank weight",
              "typical 4.5-6.5 kg/m class - confirmed per profile at quotation",
            ],
            ["Standard protection height", "up to 1.8 m stacked"],
            [
              "Span between posts",
              "height-dependent - up to ~3 m single span at typical heights",
            ],
            ["Seals", "EPDM, replaceable"],
            ["Surface finish", "mill finish standard; anodised on request"],
          ],
        },
      ],
    },
  ],
} as const satisfies MarketSpecs;

export const ABSORBENT_FLOOD_BAG_SPECS = {
  updatedAt,
  technical: {
    material: "PP non-woven shell with SAP core",
    useBoundary: "Fresh water only",
    shelfLife: "3 years vacuum-packed, stored cool and dry",
  },
  certifications: [],
  trade: sharedTrade,
  families: [
    {
      slug: "absorbent-bags",
      images: ["/images/products/tb-fb-placeholder.svg"],
      highlights: [
        "Ships flat and activates to deployed weight in 3-4 minutes.",
        "Private label from the first order: printed shell, carton design and instruction insert.",
        "Built for rain and inland freshwater flooding, not salt or brackish water.",
      ],
      specGroups: [
        {
          groupLabel: "TB-FB series",
          columns: ["", "TB-FB400 (no handle)", "TB-FB436 (with handle)"],
          rows: [
            ["Dry size", "400 x 600 mm", "400 x 360 x 150 mm"],
            ["Dry weight", "0.23 kg +/-5%", "0.25 kg +/-5%"],
            ["Deployed weight", "20 kg +/-5%", "20 kg +/-5%"],
            ["Activation time", "3-4 min", "3-4 min"],
            ["Deployed height", "~12 cm", "~12 cm"],
            ["Packing", "5/vacuum bag - 50/carton", "4/vacuum bag - 40/carton"],
            [
              "Carton (NW/GW)",
              "50x36x42 cm - 13.5/14.5 kg",
              "50x36x42 cm - 14.5/15.5 kg",
            ],
            ["Colours", "white / black", "white / black"],
          ],
        },
      ],
    },
  ],
} as const satisfies MarketSpecs;

export const FLOOD_TUBE_DAM_SPECS = {
  updatedAt,
  technical: {
    material: "0.9 mm PVC tarpaulin, thermally moulded",
    protectionHeight: "1 m",
    fillMode: "Air standard; water-fill supported where practical",
  },
  certifications: [],
  trade: sharedTrade,
  families: [
    {
      slug: "tube-dams",
      images: ["/images/products/tb-td-placeholder.svg"],
      highlights: [
        "Roll out, inflate, pin and connect sections for longer perimeters.",
        "Works on grass, soil and broken ground where rigid barriers cannot seal.",
        "Full accessory kit ships in the bag.",
      ],
      specGroups: [
        {
          groupLabel: "TB-TD series",
          columns: ["", "TB-TD500", "TB-TD1000"],
          rows: [
            ["Section length", "5 m", "10 m"],
            ["Protection height", "1 m", "1 m"],
            ["Tube wall", "0.9 mm PVC tarpaulin, thermally moulded", "same"],
            ["Ground mat", "0.6 mm PVC", "0.6 mm PVC, 10.8 m x 2 m"],
            ["Fabric weight", "1,120 g/m²", "same"],
            ["Section weight", "Available on request", "52 kg +/-5%"],
            ["Tear strength", "warp 280 N / weft 320 N", "same"],
            ["Tensile strength", "2,800 / 2,500 N/5 cm", "same"],
            ["Flex durability", "100,000 cycles", "same"],
            ["Fire rating", "EN 13501 B1", "same"],
            ["Working temperature", "-30 °C to +70 °C", "same"],
            ["Inflation", "~450 s to 6 PSI", "~450 s to 6 PSI"],
          ],
        },
      ],
    },
  ],
} as const satisfies MarketSpecs;

export const FRP_FLOOD_BARRIER_SPECS = {
  updatedAt,
  technical: {
    material: "Pultruded fiberglass (FRP)",
    profileClass: "180 mm plank profile class",
    status: "Order-driven production; testing data being compiled",
  },
  certifications: [],
  trade: sharedTrade,
  families: [
    {
      slug: "frp-planks",
      images: ["/images/products/tb-cp-placeholder.svg"],
      highlights: [
        "Corrosion-free and non-conductive for coastal, chemical and electrical sites.",
        "Same stacked-plank, post-and-seal logic as aluminum gates.",
        "Order-driven tooling with span and deflection data compiled per produced profile.",
      ],
      specGroups: [
        {
          groupLabel: "TB-CP series",
          columns: ["Area", "Status"],
          rows: [
            ["Plank profile class", "180 mm"],
            ["Production model", "order-driven pultrusion dies"],
            ["Span & deflection data", "testing data being compiled"],
            [
              "Small one-opening jobs",
              "not recommended; aluminum is the value answer",
            ],
          ],
        },
      ],
    },
  ],
} as const satisfies MarketSpecs;
