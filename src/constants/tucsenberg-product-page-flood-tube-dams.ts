import { TUCSENBERG_PRODUCT_META } from "@/constants/tucsenberg-product-meta";
import type { TucsenbergProductPage } from "@/constants/tucsenberg-product-page-types";

export const FLOOD_TUBE_DAMS_PRODUCT_PAGE = {
  slug: "flood-tube-dams",
  meta: TUCSENBERG_PRODUCT_META["flood-tube-dams"],
  image: { status: "pending" },
  diagram: {
    kind: "tube",
    ariaLabel:
      "TB-TD flood tube dam — cross-section on ground mat with pinned skirt and water side",
    caption:
      "Cross-section: the tube sits on its ground mat with the skirt pinned toward the water side. Schematic, not to scale — section lengths confirmed at quotation. Product photography in preparation.",
  },
  eyebrow: "TB-TD series",
  title: "Water & Air-Filled Flood Tube Dams",
  subtitle:
    "Where rigid barriers can't seal — grass, mud, gravel, long uneven runs — a tube dam can.",
  lead: "Roll it out, inflate it with the included pump (about 7–8 minutes per 10 m section), pin the skirt, and you have a metre-high wall. Sections connect for runs of any length. We supply them factory-direct with the full accessory kit in the bag.",
  cta: {
    href: "/request-quote",
    label: "Request a Quote",
    note: "Quoted within 12 hours.",
  },
  downloadHref: "/downloads/spec-sheet-tb-td.pdf",
  proofStrip: [
    "1 m protection height",
    "5 m / 10 m sections",
    "~7–8 min inflation per 10 m",
    "EN 13501 B1 fire rating",
    "−30 °C to +70 °C",
    "Accessory kit included",
  ],
  scenes: {
    title: "Where it works",
    intro:
      "Built for the ground rigid barriers can't seal. Site photography is being prepared; schematics hold each position until it lands.",
    items: [
      {
        title: "Grass & mud runs",
        note: "The reason this product exists — seals where boxwall and gates can't.",
      },
      {
        title: "Gravel & broken ground",
        note: "The ground mat and pinned skirt take up what rigid bases can't.",
      },
      {
        title: "Long perimeters",
        note: "Hundreds of metres deploy from a pallet and a pump.",
      },
      {
        title: "Municipal & emergency stock",
        note: "Stores compact, deploys anywhere; reflective marking for night work.",
      },
      {
        title: "Planned seasonal defence",
        note: "Set the line first, then fill — a dry run before the season is worth an hour.",
      },
      {
        title: "Spill & runoff containment",
        note: "The same tubes bund spills and contain runoff.",
      },
    ],
  },
  sections: [
    {
      title: "How it works",
      kind: "bullets",
      bullets: [
        "Roll out the tube along your line — over grass, soil or broken ground.",
        "Inflate with the supplied AC pump: ~450 seconds to 6 PSI per 10 m section. (Water-fill deployment is also supported where compressors aren't practical.)",
        "Pin and tension — the integrated ground mat and skirt pin down with the included nails; wind ropes brace exposed runs.",
        "Connect sections with the splicing sleeve for longer perimeters.",
      ],
      footer:
        "A tube dam needs four things a doorway product doesn't: a pump or water source, fill time, a crew, and space to set the line — because once a water-filled tube is full it is heavy and hard to reposition. Set your line first, then fill; a dry run before the season is worth an hour. It's a planned-response product, not a last-minute one. Two more honest notes: on hard paving with narrow recessed joints (tile lines, expansion gaps) water can track under the skirt — use the ground mat and consider [ABS boxwall](/products/abs-flood-barriers) there; and for defined openings that must seal in minutes, use [aluminum flood gates](/products/aluminum-flood-gates) instead.",
    },
    {
      title: "Specifications",
      kind: "table",
      table: {
        columns: ["", "TB-TD500", "TB-TD1000"],
        rows: [
          ["Section length", "5 m", "10 m"],
          ["Protection height", "1 m", "1 m"],
          ["Tube wall", "0.9 mm PVC tarpaulin, thermally moulded", "same"],
          ["Ground mat", "0.6 mm PVC", "0.6 mm PVC, 10.8 m × 2 m"],
          ["Fabric weight", "1,120 g/m²", "same"],
          ["Section weight", "Available on request", "52 kg ±5%"],
          ["Tear strength", "warp 280 N / weft 320 N", "same"],
          ["Tensile strength", "2,800 / 2,500 N/5 cm", "same"],
          ["Flex durability", "100,000 cycles", "same"],
          ["Fire rating", "EN 13501 B1", "same"],
          ["Working temperature", "−30 °C to +70 °C", "same"],
          ["Surface", "anti-UV with reflective marking", "same"],
          ["Inflation", "~450 s to 6 PSI (pump included)", "same"],
        ],
      },
      footer:
        "In the bag, per section: pressure-relief tube, AC inflation pump, 10 ground nails, 5 wind ropes, splicing sleeve, 2 repair patches, carry bag.",
    },
    {
      title: "Where tube dams win",
      kind: "bullets",
      bullets: [
        "Unpaved and uneven ground — the reason this product exists: grass, mud, gravel where boxwall and gates can't seal.",
        "Long perimeters, fast — hundreds of metres deploy from a pallet and a pump; no fixing, no surveys.",
        "Emergency and municipal stock — stores compact, deploys anywhere, one SKU covers unknown future sites. Reflective marking keeps night deployments visible.",
        "Spill and containment double-duty — the same tubes bund spills and contain runoff; ask if that's your use case.",
      ],
      footer:
        "Comparing tube dams against rigid barriers? [ABS vs Aluminum vs FRP vs Water-Filled — How to Choose](/guides/flood-barrier-materials-guide).",
    },
    {
      title: "For trade buyers",
      kind: "bullets",
      bullets: [
        "MOQ from 10 metres — a single section qualifies the product.",
        "OEM: printed sleeve marking, custom section lengths, your carton and manual.",
        "Consumables & spares: repair patches, pumps, nails and sleeves reorderable — the accessory kit is also a reorder stream.",
        "Consolidates with gates, boxwall and bag cartons in one container.",
      ],
      footer:
        "Private label across the range: see [OEM & Wholesale](/oem-wholesale).",
    },
  ],
  faqs: [
    {
      question: "Air or water fill — which?",
      answer:
        "Air is faster and standard (pump included). Water-fill suits sites with no power and abundant water. Same tube either way.",
    },
    {
      question: "How long does deployment take?",
      answer:
        "About 7–8 minutes inflation per 10 m section, plus roll-out and pinning — a two-person crew handles a 50 m run well inside an hour.",
    },
    {
      question: "What happens if it gets punctured?",
      answer:
        "0.9 mm tarpaulin resists tears (280–320 N), and every section ships with repair patches. Field repair is a patch-and-reinflate job.",
    },
    {
      question: "How does it handle overtopping or debris?",
      answer:
        "Like every barrier: overtopping ends protection — height planning matters (1 m tubes, stack/parallel configurations on request). Debris impact is where the 100,000-cycle flex fabric earns its spec.",
    },
    {
      question: "Reuse and storage?",
      answer:
        "Deflate, dry, roll, bag. Store −30 °C to +70 °C. Replace patches and nails as consumed.",
    },
    {
      question: "Warranty and lead time?",
      answer:
        "3 years on materials and workmanship (consumable accessories excluded). In-stock: ships in 2–7 days; custom lengths confirmed at quotation.",
    },
  ],
  calculator: {
    heading: "How many sections do I need?",
    intro:
      "Enter the run you want to protect and we'll estimate the number of 10 m sections (TB-TD1000). 5 m sections (TB-TD500) are available to fine-tune the remainder.",
    inputLabel: "Run length to protect",
    unitSelectLabel: "Unit of length",
    unitWidthCm: 1000,
    resultUnitLabel: "sections of 10 m",
    disclaimer:
      "Straight-run estimate, quantities only — no prices here by design. Sections join with the included splicing sleeves; corners, terrain and how the run terminates change the final count, and height planning matters — overtopping ends protection. Send this estimate with your ground type and we'll confirm the exact configuration at quotation.",
    ctaLabel: "Get a quote for this configuration",
    interest: "flood-tube-dams",
    rfqMessageTemplate:
      "TB-TD flood tube dams: protect approx. {length}, estimated {units} sections of 10 m (TB-TD1000 basis; 5 m sections available for the remainder). Please confirm layout and exact configuration.",
  },
  rfqNote:
    "Tell us run length, ground type, whether you need air or water fill, and what pump or water source the site will have. Quoted within 12 hours.",
} as const satisfies TucsenbergProductPage;
