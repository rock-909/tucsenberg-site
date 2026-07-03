import type { MarketSpecs } from "@/constants/product-specs/types";

export const SPECIALTY_PRODUCT_SPECS = {
  updatedAt: "2026-04-26T00:00:00Z",
  technical: {
    material: "Specialty example material",
    transparency: "Optional visibility or reporting layer",
    maxWorkingPressure: "Project-specific limit",
    temperatureRange: "Project-specific operating range",
    surface: "Example finish or experience layer",
    impactResistance: "Replace with real durability claim",
  },

  certifications: ["ISO 9001:2015"],

  trade: {
    moq: "Example minimum order",
    leadTime: "Replace with real timeline",
    supplyCapacity: "Replace with real monthly capacity",
    packaging: "Replace with real packaging or delivery model",
    portOfLoading: "Replace with real dispatch point",
  },

  families: [
    {
      slug: "specialty-units",
      images: ["/profile-fixtures/catalog/products/sample-product-b.svg"],
      highlights: [
        "Specialty example material",
        "Quiet experience option",
        "Controlled handoff points",
      ],
      specGroups: [
        {
          groupLabel: "Compact Format",
          columns: [
            "Outer Diameter",
            "Wall Thickness",
            "Length",
            "Bend Radius",
          ],
          rows: [
            ["Small", "Level 1", "Short", "Compact"],
            ["Medium", "Level 2", "Standard", "Standard"],
            ["Large", "Level 3", "Long", "Extended"],
          ],
        },
        {
          groupLabel: "Extended Format",
          columns: [
            "Outer Diameter",
            "Wall Thickness",
            "Length",
            "Bend Radius",
          ],
          rows: [
            ["Small", "Level 2", "Short", "Compact"],
            ["Medium", "Level 3", "Standard", "Standard"],
            ["Large", "Level 4", "Long", "Extended"],
          ],
        },
      ],
    },
    {
      slug: "fittings",
      images: ["/profile-fixtures/catalog/products/placeholder-coupling.svg"],
      highlights: [
        "Impact-aware example",
        "High-requirement scenario",
        "Multiple connection options",
      ],
      specGroups: [
        {
          groupLabel: "Compact Integrations",
          columns: ["Type", "Size", "Connection", "Material"],
          rows: [
            ["Connector", "Small", "Default", "Specialty Example"],
            ["90° Bend", "Small", "Default", "Specialty Example"],
            ["45° Bend", "Small", "Default", "Specialty Example"],
            ["Y-Diverter", "Small", "Custom", "Specialty Example"],
            ["Access Panel", "Small", "Custom", "Specialty Example"],
          ],
        },
        {
          groupLabel: "Extended Integrations",
          columns: ["Type", "Size", "Connection", "Material"],
          rows: [
            ["Connector", "Large", "Default", "Specialty Example"],
            ["90° Bend", "Large", "Default", "Specialty Example"],
            ["45° Bend", "Large", "Default", "Specialty Example"],
            ["Y-Diverter", "Large", "Custom", "Specialty Example"],
            ["Access Panel", "Large", "Custom", "Specialty Example"],
          ],
        },
      ],
    },
  ],
} satisfies MarketSpecs;
