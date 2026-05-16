import { QuoteForm } from "@/app/[locale]/quote/quote-form";
import type {
  QuoteContext,
  QuoteFormValues,
} from "@/app/[locale]/quote/use-quote-form";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

function readParam(
  searchParams: SearchParamsRecord,
  key: string,
): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

/**
 * `searchParams` is uncached request data. Under Cache Components it must be
 * read inside a `<Suspense>` boundary so the static hero is not blocked from
 * prerendering (mirrors the contact page's `ContactFormWithFallback`).
 */
export async function QuoteFormSection({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRecord>;
}) {
  const resolvedSearchParams = await searchParams;

  const prefill: Partial<QuoteFormValues> = {};
  const partNumber =
    readParam(resolvedSearchParams, "sku") ??
    readParam(resolvedSearchParams, "partNumber");
  if (partNumber) prefill.partNumbers = partNumber;
  const quantity = readParam(resolvedSearchParams, "quantity");
  if (quantity) prefill.quantity = quantity;

  const context: QuoteContext = {};
  const brand = readParam(resolvedSearchParams, "brand");
  if (brand) context.brand = brand;
  const model = readParam(resolvedSearchParams, "model");
  if (model) context.model = model;
  const product = readParam(resolvedSearchParams, "product");
  if (product) context.product = product;

  return <QuoteForm prefill={prefill} context={context} />;
}
