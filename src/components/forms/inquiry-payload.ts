import {
  MAX_INQUIRY_CONFIG_PREFILL_LENGTH,
  MAX_LEAD_MESSAGE_LENGTH,
  MAX_LEAD_PRODUCT_NAME_LENGTH,
} from "@/constants/validation-limits";
import { PRODUCT_INQUIRY_KINDS } from "@/lib/lead-pipeline/product-inquiry-kinds";
import {
  pickAttributionFieldsFromFormData,
  type MarketingAttributionFields,
} from "@/lib/marketing/attribution-fields";

export const CONFIG_PREFILL_MAX_LENGTH = MAX_INQUIRY_CONFIG_PREFILL_LENGTH;

interface InquiryPayload extends MarketingAttributionFields {
  readonly fullName: string;
  readonly email: string;
  readonly productInquiryKind: typeof PRODUCT_INQUIRY_KINDS.GENERAL_RFQ;
  readonly message?: string;
  readonly buyerInterest?: string;
  readonly website: string;
  readonly turnstileToken: string;
}

function getOptionalString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function capBuyerInterest(raw: string | null): string | undefined {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.slice(0, MAX_LEAD_PRODUCT_NAME_LENGTH);
}

export function capConfigPrefill(raw: string | null): string | undefined {
  if (!raw) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.slice(0, CONFIG_PREFILL_MAX_LENGTH);
}

export function createInquiryPayload(
  formData: FormData,
  turnstileToken: string,
  buyerInterest?: string,
): InquiryPayload {
  const fullName = getOptionalString(formData, "fullName");
  const email = getOptionalString(formData, "email");
  const message = getOptionalString(formData, "message");
  const website = getOptionalString(formData, "website");

  return {
    fullName,
    email,
    productInquiryKind: PRODUCT_INQUIRY_KINDS.GENERAL_RFQ,
    website,
    ...(message ? { message } : {}),
    ...(buyerInterest ? { buyerInterest } : {}),
    turnstileToken,
    ...pickAttributionFieldsFromFormData(formData),
  };
}

export function getInquiryMessageMaxLength(): number {
  return MAX_LEAD_MESSAGE_LENGTH;
}
