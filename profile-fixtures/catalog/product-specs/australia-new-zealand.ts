import type { MarketSpecs } from "@/constants/product-specs/types";

export const AUSTRALIA_NZ_SPECS = {
  updatedAt: "2026-04-26T00:00:00Z",
  technical: {
    material: "Replaceable secondary material",
    surface: "Example finish or content layer",
    uvResistance: "Outdoor-ready placeholder attribute",
    temperatureRange: "Project-specific operating range",
    lifespan: "Replace with real lifecycle claim",
    fireRating: "Replace with real safety claim",
    standard: "Example Standard B",
  },

  certifications: ["Example Standard B", "ISO 9001:2015"],

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
        "Example Standard B ready",
        "Standard and premium tiers",
        "Multiple layout options",
      ],
      specGroups: [
        {
          groupLabel: "Standard Tier",
          columns: ["Size", "Angle", "Wall Thickness", "End Type", "Radius"],
          rows: [
            ["Small", "Option A", "Level 1", "Default", "Compact"],
            ["Medium", "Option A", "Level 2", "Default", "Standard"],
            ["Large", "Option A", "Level 3", "Custom", "Extended"],
          ],
        },
        {
          groupLabel: "Premium Tier",
          columns: ["Size", "Angle", "Wall Thickness", "End Type", "Radius"],
          rows: [
            ["Small", "Option B", "Level 2", "Default", "Compact"],
            ["Medium", "Option B", "Level 3", "Custom", "Standard"],
            ["Large", "Option B", "Level 4", "Custom", "Extended"],
          ],
        },
      ],
    },
    {
      slug: "bellmouths",
      images: ["/profile-fixtures/catalog/products/placeholder-product.svg"],
      highlights: [
        "Resource entry support",
        "Example Standard B compatible",
        "Visitor guidance ready",
      ],
      specGroups: [
        {
          groupLabel: "Standard Tier",
          columns: ["Size", "Type", "End Type"],
          rows: [
            ["Small", "Resource Kit", "Default"],
            ["Medium", "Resource Kit", "Default"],
            ["Large", "Resource Kit", "Custom"],
          ],
        },
        {
          groupLabel: "Premium Tier",
          columns: ["Size", "Type", "End Type"],
          rows: [
            ["Small", "Extended Resource Kit", "Default"],
            ["Medium", "Extended Resource Kit", "Custom"],
            ["Large", "Extended Resource Kit", "Custom"],
          ],
        },
      ],
    },
    {
      slug: "couplings",
      images: ["/profile-fixtures/catalog/products/placeholder-coupling.svg"],
      highlights: [
        "Bundle-ready structure",
        "Example Standard B compatible",
        "Standard and premium tiers",
      ],
      specGroups: [
        {
          groupLabel: "Standard Tier",
          columns: ["Size", "Type", "Wall Thickness", "End Type"],
          rows: [
            ["Small", "Standard Bundle", "Level 1", "Default"],
            ["Medium", "Standard Bundle", "Level 2", "Default"],
            ["Large", "Extended Bundle", "Level 3", "Custom"],
          ],
        },
        {
          groupLabel: "Premium Tier",
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
      images: ["/profile-fixtures/catalog/products/placeholder-item.svg"],
      highlights: [
        "Standard and premium tiers",
        "Reusable package lengths",
        "Straightforward example entries",
      ],
      specGroups: [
        {
          groupLabel: "Standard Tier",
          columns: ["Size", "Wall Thickness", "Length", "Duty"],
          rows: [
            ["Small", "Level 1", "Short", "Standard"],
            ["Medium", "Level 2", "Standard", "Standard"],
            ["Large", "Level 3", "Long", "Standard"],
          ],
        },
        {
          groupLabel: "Premium Tier",
          columns: ["Size", "Wall Thickness", "Length", "Duty"],
          rows: [
            ["Small", "Level 2", "Short", "Premium"],
            ["Medium", "Level 3", "Standard", "Premium"],
            ["Large", "Level 4", "Long", "Premium"],
          ],
        },
      ],
    },
  ],
} satisfies MarketSpecs;
