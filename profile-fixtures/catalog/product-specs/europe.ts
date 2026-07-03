import type { MarketSpecs } from "@/constants/product-specs/types";

export const EUROPE_SPECS = {
  updatedAt: "2026-04-26T00:00:00Z",
  technical: {
    material: "Replaceable platform material",
    surface: "Example finish or presentation layer",
    uvResistance: "Outdoor-ready placeholder attribute",
    temperatureRange: "Project-specific operating range",
    lifespan: "Replace with real lifecycle claim",
    fireRating: "Replace with real safety claim",
  },

  certifications: ["Example Standard D", "ISO 9001:2015"],

  trade: {
    moq: "Example minimum order",
    leadTime: "Replace with real timeline",
    supplyCapacity: "Replace with real monthly capacity",
    packaging: "Replace with real packaging or delivery model",
    portOfLoading: "Replace with real dispatch point",
  },

  families: [
    {
      slug: "sample-product-shapes",
      images: ["/profile-fixtures/catalog/products/sample-product-a.svg"],
      highlights: [
        "Example Standard D ready",
        "Three service tiers",
        "Reusable size set",
      ],
      specGroups: [
        {
          groupLabel: "Light Tier",
          columns: ["Size", "Angle", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Option A", "Level 1", "Default"],
            ["Medium", "Option A", "Level 2", "Default"],
            ["Large", "Option A", "Level 3", "Custom"],
          ],
        },
        {
          groupLabel: "Medium Tier",
          columns: ["Size", "Angle", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Option B", "Level 2", "Default"],
            ["Medium", "Option B", "Level 3", "Custom"],
            ["Large", "Option B", "Level 4", "Custom"],
          ],
        },
        {
          groupLabel: "Heavy Tier",
          columns: ["Size", "Angle", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Option C", "Level 3", "Default"],
            ["Medium", "Option C", "Level 4", "Custom"],
            ["Large", "Option C", "Level 5", "Custom"],
          ],
        },
      ],
    },
    {
      slug: "couplings",
      images: ["/profile-fixtures/catalog/products/placeholder-coupling.svg"],
      highlights: [
        "Example Standard D ready",
        "Bundle-ready structure",
        "Reusable size set",
      ],
      specGroups: [
        {
          groupLabel: "Light Tier",
          columns: ["Size", "Type", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Standard Bundle", "Level 1", "Default"],
            ["Medium", "Standard Bundle", "Level 2", "Default"],
            ["Large", "Extended Bundle", "Level 3", "Custom"],
          ],
        },
        {
          groupLabel: "Medium Tier",
          columns: ["Size", "Type", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Standard Bundle", "Level 2", "Default"],
            ["Medium", "Extended Bundle", "Level 3", "Custom"],
            ["Large", "Extended Bundle", "Level 4", "Custom"],
          ],
        },
        {
          groupLabel: "Heavy Tier",
          columns: ["Size", "Type", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Extended Bundle", "Level 3", "Default"],
            ["Medium", "Extended Bundle", "Level 4", "Custom"],
            ["Large", "Extended Bundle", "Level 5", "Custom"],
          ],
        },
      ],
    },
    {
      slug: "sample-product-runs",
      images: ["/profile-fixtures/catalog/products/placeholder-item.svg"],
      highlights: [
        "Example Standard D ready",
        "Standard package lengths",
        "Reusable size set",
      ],
      specGroups: [
        {
          groupLabel: "Light Tier",
          columns: ["Size", "Wall Thickness", "Length"],
          rows: [
            ["Small", "Level 1", "Short"],
            ["Medium", "Level 2", "Standard"],
            ["Large", "Level 3", "Long"],
          ],
        },
        {
          groupLabel: "Medium Tier",
          columns: ["Size", "Wall Thickness", "Length"],
          rows: [
            ["Small", "Level 2", "Short"],
            ["Medium", "Level 3", "Standard"],
            ["Large", "Level 4", "Long"],
          ],
        },
        {
          groupLabel: "Heavy Tier",
          columns: ["Size", "Wall Thickness", "Length"],
          rows: [
            ["Small", "Level 3", "Short"],
            ["Medium", "Level 4", "Standard"],
            ["Large", "Level 5", "Long"],
          ],
        },
      ],
    },
  ],
} satisfies MarketSpecs;
