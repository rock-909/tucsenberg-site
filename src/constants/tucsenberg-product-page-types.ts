import type { TUCSENBERG_PRODUCT_META } from "@/constants/tucsenberg-product-meta";

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
  cta: TucsenbergProductCta;
  downloadHref: string;
  sections: readonly TucsenbergProductSection[];
  faqs: readonly TucsenbergProductFaq[];
}
