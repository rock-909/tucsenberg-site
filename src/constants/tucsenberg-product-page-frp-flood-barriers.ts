import { TUCSENBERG_PRODUCT_META } from "@/constants/tucsenberg-product-meta";
import type { TucsenbergProductPage } from "@/constants/tucsenberg-product-page-types";

export const FRP_FLOOD_BARRIERS_PRODUCT_PAGE = {
  slug: "frp-flood-barriers",
  meta: TUCSENBERG_PRODUCT_META["frp-flood-barriers"],
  image: { status: "pending" },
  eyebrow: "TB-CP series",
  title: "FRP Composite Flood Barrier Planks",
  subtitle:
    "A flood plank that never corrodes, conducts nothing, and shrugs off salt air.",
  lead: "Pultruded fiberglass (FRP), in the same stacked-plank logic as aluminum gates. This is our newest line, produced order-driven with our pultrusion partners. This page tells you honestly what's ready, what's in testing, and what it takes to open a profile — because nobody else in this category writes that down.",
  cta: {
    href: "/request-quote?interest=frp-planks",
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
} as const satisfies TucsenbergProductPage;
