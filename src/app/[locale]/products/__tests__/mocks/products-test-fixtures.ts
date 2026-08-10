import { screen } from "@testing-library/react";
import { expect } from "vitest";

export const mockCatalogTranslationsEn = {
  "overview.title": "Flood Barrier Product Lines",
  "overview.description":
    "Five flood barrier lines for dealers, importers, brands, contractors and small business buyers: ABS boxwall, aluminum flood gates, absorbent flood bags, tube dams and FRP composite planks.",
  "overview.cardsTitle": "Start with the product line",
  "overview.cardsDescription":
    "Match the opening, ground type and order size before asking for exact quotation details.",
  "overview.boundaryTitle": "No published-price games",
  "overview.boundaryDescription":
    "The quote is the price conversation. Send dimensions, quantity, market and delivery port so the line can be checked properly.",
  "overview.pathTitle": "How this overview should work",
  "overview.pathDescription":
    "Scan the five lines, compare where each one fits, then send an RFQ with dimensions, quantity and market.",
  "overview.detailTitle": "When to open a product page",
  "overview.detailDescription":
    "Use the detail pages when the buying question depends on material, opening type, deployment method or OEM/private label options.",
  "boundary.items.content": "Prices stay in the quotation, not on public pages",
  "boundary.items.assets": "Photos and drawings are welcome with the RFQ",
  "boundary.items.details":
    "Custom-cut and private label details are confirmed per order",
  "path.items.scan.title": "Scan the five lines",
  "path.items.scan.description":
    "ABS boxwall, aluminum gates, flood bags, tube dams and FRP planks cover different site conditions.",
  "path.items.compare.title": "Check the fit",
  "path.items.compare.description":
    "Defined openings, perimeters, emergency stock, rough ground and corrosive sites need different materials.",
  "path.items.ask.title": "Send the RFQ",
  "path.items.ask.description":
    "Standard items are quoted in 12 hours; custom configurations within 48.",
  "detail.items.families":
    "Product family, material and deployment method affect the recommendation",
  "detail.items.comparison":
    "Specification tables and drawings decide custom-cut configurations",
  "detail.items.markets":
    "OEM/private label, cartons, pallets, LCL, container and project schedules are quoted differently",
  "cta.title": "Need more detail before contacting?",
  "cta.description":
    "Send an RFQ with openings, quantity, market and delivery port.",
  "cta.resources": "View guides",
  "cta.specificationsGuide": "View specifications guide",
  "cta.contact": "Request a Quote",
  "markets.abs-flood-barriers.label": "ABS Interlocking Boxwall Flood Barriers",
  "markets.abs-flood-barriers.description":
    "Freestanding ABS interlocking flood barriers for driveways, doorways and paved perimeters.",
  "markets.aluminum-flood-gates.label":
    "Aluminum Flood Gates & Demountable Barrier Systems",
  "markets.aluminum-flood-gates.description":
    "Demountable plank systems for doors, garages, loading docks and shopfronts.",
  "markets.absorbent-flood-bags.label":
    "Absorbent Flood Bags (Sandless Sandbags)",
  "markets.absorbent-flood-bags.description":
    "Water-activated sandless flood bags for low-level freshwater leaks, thresholds and reseller stock.",
  "markets.flood-tube-dams.label": "Water & Air-Filled Tube Dams",
  "markets.flood-tube-dams.description":
    "Inflatable PVC tube dams for long runs, rough ground and planned emergency stock.",
  "markets.frp-flood-barriers.label": "FRP Composite Planks",
  "markets.frp-flood-barriers.description":
    "Order-driven pultruded FRP flood planks for coastal, industrial and electrical sites.",
} as const;

export function createCatalogTranslator(
  _locale: string,
): (key: string) => string {
  return (key: string) =>
    mockCatalogTranslationsEn[key as keyof typeof mockCatalogTranslationsEn] ||
    key;
}

export function assertNoHeavyCatalogOrDeveloperDemoCopy() {
  expect(screen.queryByText(/Technical proof/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Cloudflare\/OpenNext/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Example Standard/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/certification/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/spec matrix/i)).not.toBeInTheDocument();
}
