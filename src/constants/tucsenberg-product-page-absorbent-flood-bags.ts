import { TUCSENBERG_PRODUCT_META } from "@/constants/tucsenberg-product-meta";
import type { TucsenbergProductPage } from "@/constants/tucsenberg-product-page-types";

export const ABSORBENT_FLOOD_BAGS_PRODUCT_PAGE = {
  slug: "absorbent-flood-bags",
  meta: TUCSENBERG_PRODUCT_META["absorbent-flood-bags"],
  image: { status: "pending" },
  diagram: {
    kind: "bag",
    ariaLabel:
      "TB-FB absorbent flood bag — flat bag activating with water and stacked deployment",
    caption:
      "Activation and deployment: a flat 0.23 kg bag swells to 20 kg in 3–4 minutes, then stacks like sandbags. Schematic, not to scale. Product photography in preparation.",
  },
  eyebrow: "TB-FB series",
  title: "Absorbent Flood Bags (Sandless Sandbags) — Bulk & Private Label",
  subtitle:
    "Fresh water only — these are for rain and inland flooding, not coastal storm surge.",
  lead: "A flood bag that ships flat and weighs 230 grams — until water touches it. The super-absorbent polymer core swells to a 20 kg sandbag in 3–4 minutes: no sand, no shoveling, no pre-storm labor. We supply them factory-direct by the carton and by the pallet, with your label if you want it. It's the lowest-friction first order in our range.",
  cta: {
    href: "/request-quote",
    label: "Request a Quote",
    note: "Standard cartons quoted within 12 hours.",
  },
  downloadHref: "/downloads/spec-sheet-tb-fb.pdf",
  sections: [
    {
      title: "How they work",
      kind: "bullets",
      bullets: [
        "Store flat. Vacuum-packed 5 to a bag, 50 to a carton (TB-FB400). A carton is 50 × 36 × 42 cm and under 15 kg — one shelf holds what a sand pile can't.",
        "Activate with water. Submerge or hose down; the SAP core absorbs to 20 kg (±5%) in 3–4 minutes. Warmer water activates faster.",
        "Stack like sandbags. Same brick-laying pattern, overlapped seams, two layers for a standard doorway. Each deployed bag stands about 12 cm high.",
      ],
    },
    {
      title: "Honest limits — read before you order",
      kind: "paragraphs",
      paragraphs: [
        "Fresh water only. SAP cores do not activate properly in salt or brackish water. For coastal storm surge, use hard barriers — [ABS boxwall](/products/abs-flood-barriers) or [aluminum flood gates](/products/aluminum-flood-gates) — and keep bags for rain and freshwater flooding inland.",
        "Absorbent bags are for low-level water: door gaps, garage thresholds, low points, leak response and last-minute rain prep. For knee-high water or structural protection they're the wrong tool, and in fast-moving water a swollen bag is close to neutral buoyancy — current can shift what a sandbag would hold. We'd rather tell you that here than after you've ordered.",
      ],
    },
    {
      title: "Specifications",
      kind: "table",
      table: {
        columns: ["", "TB-FB400 (no handle)", "TB-FB436 (with handle)"],
        rows: [
          ["Dry size", "400 × 600 mm", "400 × 360 × 150 mm"],
          ["Dry weight", "0.23 kg ±5%", "0.25 kg ±5%"],
          ["Deployed weight", "20 kg ±5%", "20 kg ±5%"],
          ["Activation time", "3–4 min", "3–4 min"],
          ["Deployed height", "~12 cm", "~12 cm"],
          ["Packing", "5/vacuum bag · 50/carton", "4/vacuum bag · 40/carton"],
          [
            "Carton (NW/GW)",
            "50×36×42 cm · 13.5/14.5 kg",
            "50×36×42 cm · 14.5/15.5 kg",
          ],
          ["Colours", "white / black", "white / black"],
          ["Materials", "PP non-woven shell · SAP core (non-toxic)", "same"],
          ["Shelf life", "3 years vacuum-packed, stored cool & dry", "same"],
        ],
      },
    },
    {
      title: "How many bags does a job take?",
      kind: "table",
      paragraphs: [
        "Based on TB-FB400 (600 mm laid along the run, two layers, ~15% overlap):",
      ],
      table: {
        columns: ["Application", "Bags"],
        rows: [
          ["Standard doorway (0.9 m)", "5–6"],
          ["Double door / single garage (2.4 m)", "9–11"],
          ["Double garage (4.9 m)", "18–22"],
          ["Whole-house entry points", "30–50"],
        ],
      },
      footer:
        "Dealers: this table is yours to reuse in your own sales material once you stock the line.",
    },
    {
      title: "Built for resale",
      kind: "bullets",
      bullets: [
        "Carton quantities from MOQ 300 bags — pallet (~1,600) and container tiers above.",
        "Consumable demand. Bags are single-event products; storm seasons empty shelves. Repeat orders are the norm, not the hope.",
        "Private label from the first order: printed shell, your carton design, your instruction insert. No moulds — just print. Lowest branding cost in our range.",
        "Consolidation-friendly. Cartons fill the gaps in a mixed container of gates and boxwall — ask for a consolidated quote.",
      ],
      footer:
        "Private label details: [OEM & Wholesale](/oem-wholesale). Comparing materials? [How to choose](/guides/flood-barrier-materials-guide).",
    },
    {
      title: "Works as a system",
      kind: "bullets",
      bullets: [
        "Perimeter — [tube dams](/products/flood-tube-dams) or [boxwall](/products/abs-flood-barriers)",
        "Openings — [aluminum flood gates](/products/aluminum-flood-gates)",
        "Leaks, thresholds, low points — absorbent bags (this page)",
      ],
      footer:
        "One RFQ covers all three layers; we consolidate across the factory pool into one shipment.",
    },
  ],
  faqs: [
    {
      question: "How long do unused bags keep?",
      answer:
        "3 years in the original vacuum packaging, stored cool and dry. Keep cartons off concrete floors.",
    },
    {
      question: "Can they be reused?",
      answer:
        "No — once activated they stay swollen. They're designed as single-event products (that's also why dealers reorder). Shells and cores are non-toxic; dispose as regular waste unless contaminated by floodwater.",
    },
    {
      question: "Do they work in salt water?",
      answer:
        "No. SAP doesn't activate properly in salt or brackish water — see the honest limits above. This matters for coastal buyers: pair bags with hard barriers.",
    },
    {
      question: "Are they a full sandbag replacement?",
      answer:
        "For weight, storage, stacking and speed, yes — one person carries a carton of 50 where two sandbags would be the limit. But sandbags still win in three cases: salt water, fast-moving water, and lowest possible cost. For high water or long immersion, hard barriers outperform any bag.",
    },
    {
      question: "Minimum order and lead time?",
      answer:
        "MOQ 300 bags. In-stock: ships in 2–7 days. Private label print runs confirmed at quotation.",
    },
    {
      question: "Sample policy?",
      answer:
        "Paid sample carton plus freight; the fee is credited against your first order.",
    },
  ],
  rfqNote:
    "Tell us your market, quantity band and whether you need private label. Standard cartons quoted within 12 hours.",
} as const satisfies TucsenbergProductPage;
