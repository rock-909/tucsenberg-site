import {
  pickAttributionFieldsFromFormData,
  type MarketingAttributionFields,
} from "@/lib/marketing/attribution-fields";
import {
  PRODUCT_INQUIRY_KINDS,
  type ProductInquiryKind,
} from "@/lib/lead-pipeline/product-inquiry-kinds";

type RequestQuoteTranslate = (key: string) => string;

/**
 * Copy consumed by the payload builder. The RFQ form is deliberately minimal
 * (name + email required, one optional message); the source line keeps the lead
 * record readable for the owner without buyer-facing form fields.
 */
export interface RequestQuotePayloadCopy {
  readonly source: string;
}

/**
 * The Request-a-Quote page produces an explicit general RFQ: it never claims a
 * per-product identity. Any product-line hint the buyer arrived with is carried
 * as `buyerInterest` free text (description only), not as product attribution.
 */
interface RequestQuotePayload extends MarketingAttributionFields {
  readonly fullName: string;
  readonly email: string;
  readonly productInquiryKind: ProductInquiryKind;
  readonly buyerInterest?: string;
  readonly requirements: string;
  readonly marketingConsent: false;
  readonly turnstileToken: string;
}

export function createRequestQuotePayloadCopy(
  t: RequestQuoteTranslate,
): RequestQuotePayloadCopy {
  return {
    source: t("payload.source"),
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
  const message = getOptionalString(formData, "message");

  return [copy.source, ...(message ? [message] : [])].join("\n");
}

export function createRequestQuotePayload(
  formData: FormData,
  turnstileToken: string,
  copy: RequestQuotePayloadCopy,
): RequestQuotePayload {
  const buyerInterest = getOptionalString(formData, "interest");

  return {
    fullName: getOptionalString(formData, "fullName"),
    email: getOptionalString(formData, "email"),
    productInquiryKind: PRODUCT_INQUIRY_KINDS.GENERAL_RFQ,
    ...(buyerInterest ? { buyerInterest } : {}),
    requirements: createRequestQuoteRequirements(formData, copy),
    marketingConsent: false,
    turnstileToken,
    ...pickAttributionFieldsFromFormData(formData),
  };
}
