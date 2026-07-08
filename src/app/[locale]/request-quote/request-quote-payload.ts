import {
  pickAttributionFieldsFromFormData,
  type MarketingAttributionFields,
} from "@/lib/marketing/attribution-fields";

type RequestQuoteTranslate = (key: string) => string;

/**
 * Copy consumed by the payload builder. The RFQ form is deliberately minimal
 * (name + email required, one optional message); these strings keep the lead
 * record readable for the owner without buyer-facing form fields.
 */
export interface RequestQuotePayloadCopy {
  readonly source: string;
  readonly productName: string;
  readonly quantityFallback: string;
}

interface RequestQuotePayload extends MarketingAttributionFields {
  readonly fullName: string;
  readonly email: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly quantity: string;
  readonly requirements: string;
  readonly marketingConsent: false;
  readonly turnstileToken: string;
}

const REQUEST_QUOTE_PRODUCT_SLUG = "request-quote";

export function createRequestQuotePayloadCopy(
  t: RequestQuoteTranslate,
): RequestQuotePayloadCopy {
  return {
    source: t("payload.source"),
    productName: t("payload.productName"),
    quantityFallback: t("payload.quantityFallback"),
  };
}

function getOptionalString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function createRequestQuoteRequirements(
  formData: FormData,
  copy: RequestQuotePayloadCopy,
): string {
  const interest = getOptionalString(formData, "interest");
  const message = getOptionalString(formData, "message");

  return [
    copy.source,
    ...(interest ? [`Interest: ${interest}`] : []),
    ...(message ? [message] : []),
  ].join("\n");
}

export function createRequestQuotePayload(
  formData: FormData,
  turnstileToken: string,
  copy: RequestQuotePayloadCopy,
): RequestQuotePayload {
  return {
    fullName: getOptionalString(formData, "fullName"),
    email: getOptionalString(formData, "email"),
    productSlug: REQUEST_QUOTE_PRODUCT_SLUG,
    productName: copy.productName,
    quantity: copy.quantityFallback,
    requirements: createRequestQuoteRequirements(formData, copy),
    marketingConsent: false,
    turnstileToken,
    ...pickAttributionFieldsFromFormData(formData),
  };
}
