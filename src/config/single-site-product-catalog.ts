import type {
  MarketDefinition,
  ProductCatalog,
  ProductFamilyDefinition,
} from "@/config/site-types";

const markets = [
  {
    slug: "north-america",
    label: "Primary Offer Example",
    standardLabel: "Example Standard A",
    description:
      "Replaceable catalog example for a standards-based product or service group. Use this slot for one real market, segment, or compliance category.",
    sizeSystem: "inch",
    standardIds: ["example_a"],
    familySlugs: ["sample-product-shapes", "couplings", "sample-product-runs"],
  },
  {
    slug: "australia-new-zealand",
    label: "Secondary Offer Example",
    standardLabel: "Example Standard B",
    description:
      "Replaceable catalog example for a second market, service tier, or regional offer.",
    sizeSystem: "mm",
    standardIds: ["example_b"],
    familySlugs: [
      "sample-product-shapes",
      "bellmouths",
      "couplings",
      "sample-product-runs",
    ],
  },
  {
    slug: "mexico",
    label: "Regional Offer Example",
    standardLabel: "Example Standard C",
    description:
      "Replaceable catalog example for a regional or compliance-based offer.",
    sizeSystem: "mm",
    standardIds: ["example_c"],
    familySlugs: ["sample-product-shapes", "couplings", "sample-product-runs"],
  },
  {
    slug: "europe",
    label: "Platform Offer Example",
    standardLabel: "Example Standard D",
    description:
      "Replaceable catalog example for another market, platform, or standards group.",
    sizeSystem: "mm",
    standardIds: ["example_d"],
    familySlugs: ["sample-product-shapes", "couplings", "sample-product-runs"],
  },
  {
    slug: "specialty-product-systems",
    label: "Specialty Examples",
    standardLabel: "Specialty Example",
    description:
      "Replaceable specialty examples for niche product, service, or project workflows.",
    sizeSystem: "mm",
    standardIds: ["specialty"],
    familySlugs: ["specialty-units", "fittings"],
  },
] as const satisfies readonly MarketDefinition[];

const families = [
  {
    slug: "sample-product-shapes",
    label: "Sample Product Shapes",
    description:
      "Replaceable item examples for versions, shapes, packages, or service variants.",
    marketSlug: "north-america",
  },
  {
    slug: "couplings",
    label: "Support Packages",
    description:
      "Replaceable companion examples for add-ons, connectors, bundles, or supporting services.",
    marketSlug: "north-america",
  },
  {
    slug: "sample-product-runs",
    label: "Sample Product Runs",
    description:
      "Replaceable item examples with size, standard, or package details.",
    marketSlug: "north-america",
  },
  {
    slug: "sample-product-shapes",
    label: "Sample Product Shapes",
    description:
      "Replaceable item examples for a second market or service variant.",
    marketSlug: "australia-new-zealand",
  },
  {
    slug: "bellmouths",
    label: "Resource Kits",
    description:
      "Replaceable accessory examples for a product, service, or resource variant.",
    marketSlug: "australia-new-zealand",
  },
  {
    slug: "couplings",
    label: "Support Packages",
    description:
      "Replaceable companion examples for a second market or service variant.",
    marketSlug: "australia-new-zealand",
  },
  {
    slug: "sample-product-runs",
    label: "Sample Product Runs",
    description:
      "Replaceable item examples for a second market or service variant.",
    marketSlug: "australia-new-zealand",
  },
  {
    slug: "sample-product-shapes",
    label: "Sample Product Shapes",
    description:
      "Replaceable item examples for a regional or compliance-based offer.",
    marketSlug: "mexico",
  },
  {
    slug: "couplings",
    label: "Support Packages",
    description: "Replaceable companion examples for a regional offer.",
    marketSlug: "mexico",
  },
  {
    slug: "sample-product-runs",
    label: "Sample Product Runs",
    description: "Replaceable item examples for a regional offer.",
    marketSlug: "mexico",
  },
  {
    slug: "sample-product-shapes",
    label: "Sample Product Shapes",
    description:
      "Replaceable item examples for another market or standards group.",
    marketSlug: "europe",
  },
  {
    slug: "couplings",
    label: "Support Packages",
    description: "Replaceable companion examples for another market group.",
    marketSlug: "europe",
  },
  {
    slug: "sample-product-runs",
    label: "Sample Product Runs",
    description: "Replaceable item examples for another market group.",
    marketSlug: "europe",
  },
  {
    slug: "specialty-units",
    label: "Specialty Units",
    description:
      "Replaceable specialty examples for niche products, services, or workflows.",
    marketSlug: "specialty-product-systems",
  },
  {
    slug: "fittings",
    label: "Integration Examples",
    description:
      "Integration examples for product, service, or workflow systems.",
    marketSlug: "specialty-product-systems",
  },
] as const satisfies readonly ProductFamilyDefinition[];

export type ProductMarketSlug = (typeof markets)[number]["slug"];

export const singleSiteProductCatalog = {
  markets,
  families,
} as const satisfies ProductCatalog;
