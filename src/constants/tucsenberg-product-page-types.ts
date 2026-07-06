import type { TUCSENBERG_PRODUCT_META } from "@/constants/tucsenberg-product-meta";

export type TucsenbergProductContentKind = "paragraphs" | "bullets" | "table";

export interface TucsenbergProductCta {
  href: `/request-quote${string}`;
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

export interface TucsenbergProductPage {
  slug: string;
  meta: (typeof TUCSENBERG_PRODUCT_META)[keyof typeof TUCSENBERG_PRODUCT_META];
  image: TucsenbergProductImage;
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
  sections: readonly TucsenbergProductSection[];
  faqs: readonly TucsenbergProductFaq[];
}
