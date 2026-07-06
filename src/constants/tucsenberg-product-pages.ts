import { TUCSENBERG_PRODUCT_META } from "@/constants/tucsenberg-product-meta";

export type TucsenbergProductContentKind = "paragraphs" | "bullets" | "table";

export interface TucsenbergProductCta {
  href: "/request-quote";
  label: string;
}

export interface TucsenbergProductTable {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
}

export interface TucsenbergProductSection {
  title: string;
  kind: TucsenbergProductContentKind;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  table?: TucsenbergProductTable;
}

export interface TucsenbergProductFaq {
  question: string;
  answer: string;
}

export interface TucsenbergProductPage {
  slug: string;
  meta: (typeof TUCSENBERG_PRODUCT_META)[keyof typeof TUCSENBERG_PRODUCT_META];
  eyebrow: string;
  title: string;
  subtitle: string;
  lead: string;
  cta: TucsenbergProductCta;
  downloadHref: string;
  sections: readonly TucsenbergProductSection[];
  faqs: readonly TucsenbergProductFaq[];
}

export const TUCSENBERG_PRODUCT_PAGES = {
  "abs-flood-barriers": {
    slug: "abs-flood-barriers",
    meta: TUCSENBERG_PRODUCT_META["abs-flood-barriers"],
    eyebrow: "TB-BW series",
    title: "ABS Interlocking Boxwall Flood Barriers",
    subtitle:
      "Freestanding flood barriers for driveways, doorways and paved perimeters — no drilling, no fixing to the building.",
    lead: "A freestanding flood barrier that needs no bolts, no rails, and no preparation on the building. Each ABS unit locks into the next; the approaching water presses the L-shaped base down and seals it against the ground. Heights from 50 to 85 cm, with straight, curved and gable-end units so the wall actually closes around real sites. We supply dealers, contractors and businesses factory-direct, from a single carton to full containers.",
    cta: {
      href: "/request-quote",
      label: "Request a Quote — standard items quoted within 12 hours",
    },
    downloadHref: "/downloads/spec-sheet-tb-bw.pdf",
    sections: [
      {
        title: "How it works",
        kind: "bullets",
        bullets: [
          "Freestanding L-profile. The barrier stands on its own foot. As floodwater rises, its weight pushes the foot down — the water itself makes the seal tighter. No anchors, no drilling, no damage to the surface.",
          "Mechanical interlock. Units connect by hand with a locking-and-coupling joint — no tools, no loose pins.",
          "Corners, curves and gable ends. Inward-curve, outward-curve and gable-end units are available at every height, so the wall follows driveways, entrances and property lines — the same configuration family our factory pool has shipped to US flood brands for years.",
          "Ground sealing. The base seal takes up small surface irregularities; on rough ground a ground sheet under the run improves sealing.",
        ],
      },
      {
        title: "Not the disposable kit you saw on Amazon",
        kind: "table",
        paragraphs: [
          "Cheap ABS flood kits exist. They are thinner, degrade in sunlight, and are sold as disposable. Professional boxwall systems differ in ways you can measure:",
        ],
        table: {
          columns: ["What to check", "Disposable kits", "TB-BW series"],
          rows: [
            ["Wall thickness", "typically unstated", "4–5 mm (±0.5)"],
            [
              "UV performance",
              "no / unstated",
              "UV-tested to ASTM G154-2016 (0.76 W/m² @340 nm, BPT 60 °C, 8 h)",
            ],
            ["Temperature range", "unstated", "−40 °C to +95 °C working range"],
            [
              "Interlock",
              "loose pins or none",
              "full mechanical locking-and-coupling joint",
            ],
            [
              "Configurations",
              "straight only",
              "straight, inward/outward curve, gable end",
            ],
            [
              "Spares",
              "none",
              "joints, seals and single units sold separately",
            ],
          ],
        },
      },
      {
        title: "Specifications",
        kind: "table",
        table: {
          columns: [
            "Height",
            "Model",
            "Straight unit",
            "Curve units (in/out)",
            "Wall thickness",
          ],
          rows: [
            ["50 cm", "TB-BW50", "3.8 kg", "2.8 / 2.7 kg", "4 mm"],
            ["60 cm", "TB-BW60", "7.4 kg", "3.3 / 3.3 kg", "4–5 mm"],
            ["75 cm", "TB-BW75", "9.8 kg", "3.2 / 3.2 kg", "4–5 mm"],
            [
              "85 cm (with handle)",
              "TB-BW85",
              "9.8 kg",
              "5 / 5 kg",
              "5 mm — effective stop height 75 cm",
            ],
          ],
        },
      },
      {
        title: "Small orders, samples, first-time buyers",
        kind: "bullets",
        bullets: [
          "Minimum order: one carton / small pallet lot. We don't ship single retail units — international freight on one unit costs more than the unit.",
          "Paid sample kit: 2 straight units + 1 corner + documentation, at sample price plus freight. The sample fee is credited against your first order.",
          "First time importing from China? We'll walk you through terms, documents and freight in plain language — ask anything in the RFQ form.",
        ],
      },
      {
        title: "OEM & private label",
        kind: "bullets",
        bullets: [
          "Moulded-in logo on the unit face (mould contribution applies, quoted per project)",
          "Printed labels, custom carton and pallet presentation",
          "Your manual / datasheet layout with your branding",
          "Custom colours from moulded-batch quantities — confirmed at quotation",
        ],
      },
    ],
    faqs: [
      {
        question: "Can one person deploy it?",
        answer:
          "Yes — units connect by hand at ground level. For long runs two people are faster: one places, one locks.",
      },
      {
        question: "How does it seal on uneven ground?",
        answer:
          "The base seal handles small irregularities, and rising water presses the foot down harder. For gravel, deep joints or slopes, use a ground sheet — or send photos with your RFQ and we'll advise, including when boxwall is the wrong tool.",
      },
      {
        question: "Can this replace sandbags?",
        answer:
          "For repeated seasonal use on paved ground, yes — no filling, no disposal, and one person can wall off a driveway. But we won't oversell it: sandbags still win for salt water, odd gaps, moving water and lowest possible cost.",
      },
      {
        question: "What's the warranty?",
        answer:
          "3 years on materials and workmanship — a year longer than the 2-year norm most suppliers offer. Custom-cut and custom-branded items are final sale.",
      },
    ],
  },
  "aluminum-flood-gates": {
    slug: "aluminum-flood-gates",
    meta: TUCSENBERG_PRODUCT_META["aluminum-flood-gates"],
    eyebrow: "TB-AG series",
    title: "Aluminum Flood Gates & Demountable Barrier Systems",
    subtitle:
      "The trade standard for protecting defined openings — doors, garages, loading docks, shopfronts.",
    lead: "Measure once, install the fixings once; from then on the opening seals in minutes, every season, with planks that stack between posts and store flat the rest of the year. We supply the planks, posts, seals and spares factory-direct, custom-cut to your opening schedule. Depending on your market you may know this category as flood boards (UK), removable flood panels or garage flood barriers — same system, same parts.",
    cta: {
      href: "/request-quote",
      label: "Request a Quote — standard items quoted within 12 hours",
    },
    downloadHref: "/downloads/spec-sheet-tb-ag.pdf",
    sections: [
      {
        title: "The system, part by part",
        kind: "bullets",
        bullets: [
          "Planks. Extruded aluminum profiles, 180 mm per plank, stacked to your protection height. Alloy and temper are the numbers to ask any supplier for — ours: 6063-T6, wall thickness ≥2.0 mm.",
          "Seals. EPDM rubber on every horizontal joint and at the base — compression sealing, the same principle the category has used for decades. Replacement seals sold separately, forever.",
          "Posts, three ways. Wall-mounted channels, ground-socket posts, and freestanding posts for runs where nothing may be drilled.",
          "Top clamps / tensioners. Screw-down clamps at the posts lock the stack tight so planks can't lift or rattle — exact form confirmed per configuration at quotation.",
        ],
      },
      {
        title: "Configurations",
        kind: "bullets",
        bullets: [
          "Single opening — doorways, garage doors: two channels + planks. The bread-and-butter configuration.",
          "Wide spans — beyond roughly 3 m, intermediate ground-socket posts split the span.",
          "Perimeter runs — corner posts take the system around building lines; combined with boxwall where fixing isn't allowed.",
          "Custom-cut, always. Every order is cut to your opening schedule — send widths and heights, we deliver planks per opening, labelled.",
        ],
      },
      {
        title: "Specifications",
        kind: "table",
        table: {
          columns: ["Parameter", "Value"],
          rows: [
            ["Plank profile height", "180 mm"],
            ["Alloy / temper", "6063-T6"],
            ["Wall thickness", "≥2.0 mm"],
            [
              "Plank weight",
              "typical 4.5–6.5 kg/m class — confirmed per profile at quotation",
            ],
            ["Standard protection height", "up to 1.8 m stacked"],
            [
              "Span between posts",
              "height-dependent — up to ~3 m single span at typical heights",
            ],
            ["Seals", "EPDM, replaceable"],
            ["Surface finish", "mill finish standard; anodised on request"],
          ],
        },
      },
      {
        title: "For dealers and installers",
        kind: "bullets",
        bullets: [
          "Your measurements, our cutting. You survey the opening; we cut, label and pack per opening.",
          "Spare-parts continuity — seals, clamps, single planks stay orderable for years.",
          "Measuring is the only skill barrier — our measuring guide and RFQ photo upload carry most of it.",
        ],
      },
    ],
    faqs: [
      {
        question: "How high can it protect?",
        answer:
          "Planks stack to 1.8 m as standard. Above that, engineering review applies — we'll say honestly when an opening needs more than a demountable system.",
      },
      {
        question: "What about wide garage doors and loading docks?",
        answer:
          "Spans beyond ~3 m take a removable intermediate post in a ground socket. Off-season, the socket sits flush — nothing above ground.",
      },
      {
        question: "Who installs it?",
        answer:
          "Your side — we're supply-only. We provide drawings, fixing specifications, manuals and responsive support for your installer or contractor.",
      },
      {
        question: "What's the warranty?",
        answer:
          "3 years on materials and workmanship. Custom-cut items are final sale — measure carefully, and use our RFQ review before you commit.",
      },
    ],
  },
  "absorbent-flood-bags": {
    slug: "absorbent-flood-bags",
    meta: TUCSENBERG_PRODUCT_META["absorbent-flood-bags"],
    eyebrow: "TB-FB series",
    title: "Absorbent Flood Bags (Sandless Sandbags) — Bulk & Private Label",
    subtitle:
      "Fresh water only — these are for rain and inland flooding, not coastal storm surge.",
    lead: "A flood bag that ships flat and weighs 230 grams — until water touches it. The super-absorbent polymer core swells to a 20 kg sandbag in 3–4 minutes: no sand, no shoveling, no pre-storm labor. We supply them factory-direct by the carton and by the pallet, with your label if you want it. It's the lowest-friction first order in our range.",
    cta: {
      href: "/request-quote",
      label: "Request a Quote — quoted within 12 hours",
    },
    downloadHref: "/downloads/spec-sheet-tb-fb.pdf",
    sections: [
      {
        title: "How they work",
        kind: "bullets",
        bullets: [
          "Store flat. Vacuum-packed 5 to a bag, 50 to a carton (TB-FB400).",
          "Activate with water. Submerge or hose down; the SAP core absorbs to 20 kg (±5%) in 3–4 minutes.",
          "Stack like sandbags. Same brick-laying pattern, overlapped seams, two layers for a standard doorway.",
          "Fresh water only. SAP cores do not activate properly in salt or brackish water.",
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
            ["Colours", "white / black", "white / black"],
          ],
        },
      },
      {
        title: "How many bags does a job take?",
        kind: "table",
        table: {
          columns: ["Application", "Bags"],
          rows: [
            ["Standard doorway (0.9 m)", "5–6"],
            ["Double door / single garage (2.4 m)", "9–11"],
            ["Double garage (4.9 m)", "18–22"],
            ["Whole-house entry points", "30–50"],
          ],
        },
      },
      {
        title: "Built for resale",
        kind: "bullets",
        bullets: [
          "Carton quantities from MOQ 300 bags — pallet (~1,600) and container tiers above.",
          "Private label from the first order: printed shell, your carton design, your instruction insert.",
          "Consolidation-friendly. Cartons fill the gaps in a mixed container of gates and boxwall.",
        ],
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
          "No — once activated they stay swollen. They're designed as single-event products.",
      },
      {
        question: "Do they work in salt water?",
        answer:
          "No. SAP doesn't activate properly in salt or brackish water. This matters for coastal buyers: pair bags with hard barriers.",
      },
      {
        question: "Sample policy?",
        answer:
          "Paid sample carton plus freight; the fee is credited against your first order.",
      },
    ],
  },
  "flood-tube-dams": {
    slug: "flood-tube-dams",
    meta: TUCSENBERG_PRODUCT_META["flood-tube-dams"],
    eyebrow: "TB-TD series",
    title: "Water & Air-Filled Flood Tube Dams",
    subtitle:
      "Where rigid barriers can't seal — grass, mud, gravel, long uneven runs — a tube dam can.",
    lead: "Roll it out, inflate it with the included pump (about 7–8 minutes per 10 m section), pin the skirt, and you have a metre-high wall. Sections connect for runs of any length. We supply them factory-direct with the full accessory kit in the bag.",
    cta: {
      href: "/request-quote",
      label: "Request a Quote — quoted within 12 hours",
    },
    downloadHref: "/downloads/spec-sheet-tb-td.pdf",
    sections: [
      {
        title: "How it works",
        kind: "bullets",
        bullets: [
          "Roll out the tube along your line — over grass, soil or broken ground.",
          "Inflate with the supplied AC pump: ~450 seconds to 6 PSI per 10 m section.",
          "Pin and tension — the integrated ground mat and skirt pin down with the included nails.",
          "Connect sections with the splicing sleeve for longer perimeters.",
        ],
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
            ["Inflation", "~450 s to 6 PSI (pump included)", "same"],
          ],
        },
      },
      {
        title: "Where tube dams win",
        kind: "bullets",
        bullets: [
          "Unpaved and uneven ground — grass, mud, gravel where boxwall and gates can't seal.",
          "Long perimeters, fast — hundreds of metres deploy from a pallet and a pump; no fixing, no surveys.",
          "Emergency and municipal stock — stores compact, deploys anywhere, one SKU covers unknown future sites.",
        ],
      },
      {
        title: "For trade buyers",
        kind: "bullets",
        bullets: [
          "MOQ from 10 metres — a single section qualifies the product.",
          "OEM: printed sleeve marking, custom section lengths, your carton and manual.",
          "Consumables & spares: repair patches, pumps, nails and sleeves reorderable.",
        ],
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
          "0.9 mm tarpaulin resists tears, and every section ships with repair patches. Field repair is a patch-and-reinflate job.",
      },
      {
        question: "Reuse and storage?",
        answer: "Deflate, dry, roll, bag. Store −30 °C to +70 °C.",
      },
    ],
  },
  "frp-flood-barriers": {
    slug: "frp-flood-barriers",
    meta: TUCSENBERG_PRODUCT_META["frp-flood-barriers"],
    eyebrow: "TB-CP series",
    title: "FRP Composite Flood Barrier Planks",
    subtitle:
      "A flood plank that never corrodes, conducts nothing, and shrugs off salt air.",
    lead: "Pultruded fiberglass (FRP), in the same stacked-plank logic as aluminum gates. This is our newest line, produced order-driven with our pultrusion partners. This page tells you honestly what's ready, what's in testing, and what it takes to open a profile — because nobody else in this category writes that down.",
    cta: {
      href: "/request-quote",
      label: "Register interest — we'll share test data as it completes",
    },
    downloadHref: "/downloads/product-catalog.pdf",
    sections: [
      {
        title: "Why FRP, and why now",
        kind: "bullets",
        bullets: [
          "Coastal and salt-air sites — corrosion is aluminum's one real weakness over decades; FRP simply doesn't participate.",
          "Chemical and industrial exposure — process plants, wastewater sites, de-icing salt zones.",
          "Electrical infrastructure — substations and switchyards, where a non-conductive barrier isn't a preference, it's a spec.",
        ],
      },
      {
        title: "Same logic as aluminum, different material",
        kind: "bullets",
        bullets: [
          "180 mm plank profile class — designed to the same stacked-plank, post-and-seal system as our aluminum gates.",
          "Pultruded fiberglass — continuous glass fibre in a resin matrix.",
          "EPDM sealing — unchanged; sealing is a geometry problem, not a material one.",
        ],
      },
      {
        title: "How order-driven production works",
        kind: "bullets",
        bullets: [
          "Tooling: a one-time die cost, quoted per profile, amortised across your first production run.",
          "First run: minimum volumes apply (hundreds of metres, not thousands).",
          "Testing: span and deflection verification on the produced profile.",
          "Reorders: the die is cut; subsequent runs price like a standard product.",
        ],
      },
      {
        title: "Span & deflection data",
        kind: "paragraphs",
        paragraphs: [
          "Testing data for the first profiles is being compiled with our pultrusion partners. Register interest below and we'll send span/deflection tables as they complete — no marketing sheet, the actual numbers.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is FRP stronger than aluminum?",
        answer:
          "Different, not simply stronger: excellent stiffness-to-weight and zero corrosion, but design data is profile-specific.",
      },
      {
        question: "Why doesn't anyone else sell FRP flood planks?",
        answer:
          "Pultrusion and flood barriers live in different industries; crossing them takes tooling risk nobody has taken at full specification.",
      },
      {
        question: "What does it cost?",
        answer:
          "More than aluminum per metre at first run (tooling amortisation), competitive at reorder. Real numbers come with your opening schedule — quoted within 48 hours as a custom line.",
      },
    ],
  },
} as const satisfies Record<string, TucsenbergProductPage>;

export type TucsenbergProductPageSlug = keyof typeof TUCSENBERG_PRODUCT_PAGES;

export function getTucsenbergProductPage(
  slug: string,
): TucsenbergProductPage | undefined {
  return TUCSENBERG_PRODUCT_PAGES[slug as TucsenbergProductPageSlug];
}
