import type { MarketSpecs } from "@/constants/product-specs/types";

export const NORTH_AMERICA_SPECS = {
  updatedAt: "2026-04-26T00:00:00Z",
  technical: {
    material: "Replaceable core material",
    surface: "Example finish or presentation layer",
    uvResistance: "Outdoor-ready placeholder attribute",
    temperatureRange: "Project-specific operating range",
    lifespan: "Replace with real lifecycle claim",
    fireRating: "Replace with real safety claim",
  },

  certifications: ["Example Standard A", "ISO 9001:2015"],

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
      images: ["/images/products/sample-product-a.svg"],
      highlights: [
        "Example Standard A ready",
        "Configurable material",
        "Multiple layout options",
      ],
      specGroups: [
        {
          groupLabel: "Basic Option",
          columns: ["Size", "Angle", "Wall Thickness", "End Type", "Radius"],
          rows: [
            ["Small", "Option A", "Level 1", "Default", "Compact"],
            ["Small", "Option B", "Level 1", "Default", "Compact"],
            ["Medium", "Option A", "Level 2", "Default", "Standard"],
            ["Medium", "Option B", "Level 2", "Default", "Standard"],
            ["Large", "Option A", "Level 3", "Custom", "Extended"],
            ["Large", "Option B", "Level 3", "Custom", "Extended"],
          ],
        },
        {
          groupLabel: "Advanced Option",
          columns: ["Size", "Angle", "Wall Thickness", "End Type", "Radius"],
          rows: [
            ["Small", "Option A", "Level 2", "Default", "Compact"],
            ["Small", "Option B", "Level 2", "Default", "Compact"],
            ["Medium", "Option A", "Level 3", "Custom", "Standard"],
            ["Medium", "Option B", "Level 3", "Custom", "Standard"],
            ["Large", "Option A", "Level 4", "Custom", "Extended"],
            ["Large", "Option B", "Level 4", "Custom", "Extended"],
          ],
        },
      ],
    },
    {
      slug: "couplings",
      images: ["/images/products/placeholder-coupling.svg"],
      highlights: [
        "Bundle-ready structure",
        "Secure handoff path",
        "Multi-size range",
      ],
      specGroups: [
        {
          groupLabel: "Basic Option",
          columns: ["Size", "Type", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Standard Bundle", "Level 1", "Default"],
            ["Medium", "Standard Bundle", "Level 2", "Default"],
            ["Large", "Extended Bundle", "Level 3", "Custom"],
          ],
        },
        {
          groupLabel: "Advanced Option",
          columns: ["Size", "Type", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Standard Bundle", "Level 2", "Default"],
            ["Medium", "Extended Bundle", "Level 3", "Custom"],
            ["Large", "Extended Bundle", "Level 4", "Custom"],
          ],
        },
      ],
    },
    {
      slug: "sample-product-runs",
      images: ["/images/products/placeholder-item.svg"],
      highlights: [
        "Basic and advanced tiers",
        "Standard package lengths",
        "Straightforward example entries",
      ],
      specGroups: [
        {
          groupLabel: "Basic Option",
          columns: ["Size", "Wall Thickness", "Length", "Schedule"],
          rows: [
            ["Small", "Level 1", "Short", "Basic"],
            ["Medium", "Level 2", "Standard", "Basic"],
            ["Large", "Level 3", "Long", "Basic"],
          ],
        },
        {
          groupLabel: "Advanced Option",
          columns: ["Size", "Wall Thickness", "Length", "Schedule"],
          rows: [
            ["Small", "Level 2", "Short", "Advanced"],
            ["Medium", "Level 3", "Standard", "Advanced"],
            ["Large", "Level 4", "Long", "Advanced"],
          ],
        },
      ],
    },
  ],
} satisfies MarketSpecs;
