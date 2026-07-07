import type { TUCSENBERG_PRODUCT_META } from "@/constants/tucsenberg-product-meta";

export type TucsenbergProductContentKind = "paragraphs" | "bullets" | "table";

export interface TucsenbergProductCta {
  href: `/request-quote${string}`;
  label: string;
  /** Quote-SLA promise rendered as a muted line under the button, never inside it (mobile overflow). */
  note?: string;
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
  /** Closing line rendered after bullets/table; supports inline markdown links. */
  footer?: string;
}

export interface TucsenbergProductFaq {
  question: string;
  answer: string;
}

export type TucsenbergProductImage =
  | { status: "real"; src: string }
  | { status: "pending" | "omitted" };

export type TucsenbergProductDiagramKind =
  | "boxwall"
  | "gate"
  | "bag"
  | "tube"
  | "frp";

/**
 * Honest technical line drawing shown until owner photos land
 * (copy strategy: 截面图/线图 over stock imagery).
 */
export interface TucsenbergProductDiagram {
  kind: TucsenbergProductDiagramKind;
  ariaLabel: string;
  caption: string;
  /** Instrument-panel header label (mono microcopy) above the drawing. */
  panelLabel?: string;
  /** Upgrade the static drawing to the animated canvas cross-section. */
  animated?: boolean;
}

/**
 * Straight-run unit estimator (quote funnel: quantities only, never prices).
 * `unitWidthCm` must come from a real owner spec — never invented.
 */
export interface TucsenbergProductCalculator {
  heading: string;
  intro: string;
  inputLabel: string;
  unitSelectLabel: string;
  /** Width of one straight unit in cm (real spec basis for the estimate). */
  unitWidthCm: number;
  /** e.g. "straight units" */
  resultUnitLabel: string;
  /** Honest limits: what the estimate does not cover. */
  disclaimer: string;
  ctaLabel: string;
  /** interest slug forwarded to the RFQ page. */
  interest: string;
  /** RFQ prefill message; placeholders: {length}, {units}. */
  rfqMessageTemplate: string;
}

/** One scene tile: real photo when delivered, honest line-drawing base until then. */
export interface TucsenbergProductScene {
  title: string;
  note: string;
  image?: { src: string; alt: string };
}

/** "Can I use it on my site?" wall — answers by showing, not telling. */
export interface TucsenbergProductScenes {
  title: string;
  intro?: string;
  /** Section title after which the wall renders (visual-translation order). */
  afterSection: string;
  items: readonly TucsenbergProductScene[];
}

export interface TucsenbergProductPage {
  slug: string;
  meta: (typeof TUCSENBERG_PRODUCT_META)[keyof typeof TUCSENBERG_PRODUCT_META];
  image: TucsenbergProductImage;
  diagram?: TucsenbergProductDiagram;
  eyebrow: string;
  title: string;
  subtitle: string;
  lead: string;
  /** Honest-boundary note rendered after the lead; supports inline markdown links. */
  leadNote?: string;
  cta: TucsenbergProductCta;
  downloadHref: string;
  /** Page-specific request-a-quote guidance shown in the final CTA section. */
  rfqNote?: string;
  /** Scannable proof strip under the hero; verifiable facts only, never invented. */
  proofStrip?: readonly string[];
  /** Scene wall rendered after `scenes.afterSection`. */
  scenes?: TucsenbergProductScenes;
  /** Optional straight-run estimator rendered after the content sections. */
  calculator?: TucsenbergProductCalculator;
  sections: readonly TucsenbergProductSection[];
  faqs: readonly TucsenbergProductFaq[];
}
