import {
  pickAttributionFieldsFromFormData,
  type MarketingAttributionFields,
} from "@/lib/marketing/attribution-fields";
import {
  REQUEST_QUOTE_DEFAULT_MATERIAL_VALUE,
  REQUEST_QUOTE_MATERIAL_OPTIONS,
  REQUEST_QUOTE_MOUNTING_SURFACE_OPTIONS,
  REQUEST_QUOTE_PROTECTION_OPTIONS,
  REQUEST_QUOTE_QUANTITY_OPTIONS,
  REQUEST_QUOTE_TIMELINE_OPTIONS,
  type RequestQuoteOption,
} from "@/config/request-quote-form-config";

type RequestQuoteTranslate = (key: string) => string;

interface RequestQuoteLabelGroup {
  readonly source: string;
  readonly notSpecified: string;
  readonly yes: string;
  readonly no: string;
  readonly productNamePrefix: string;
  readonly protection: string;
  readonly dimensions: string;
  readonly mounting: string;
  readonly material: string;
  readonly quantity: string;
  readonly delivery: string;
  readonly timeline: string;
  readonly assetLinks: string;
  readonly whatsApp: string;
  readonly tradeEnquiry: string;
}

export interface RequestQuotePayloadCopy {
  readonly requirements: RequestQuoteLabelGroup;
  readonly options: {
    readonly protection: Readonly<Record<string, string>>;
    readonly mounting: Readonly<Record<string, string>>;
    readonly material: Readonly<Record<string, string>>;
    readonly quantity: Readonly<Record<string, string>>;
    readonly timeline: Readonly<Record<string, string>>;
  };
}

interface RequestQuotePayload extends MarketingAttributionFields {
  readonly fullName: string;
  readonly email: string;
  readonly company?: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly quantity: string;
  readonly requirements: string;
  readonly marketingConsent: false;
  readonly turnstileToken: string;
}

function createOptionLabelMap(
  options: readonly RequestQuoteOption[],
  t: RequestQuoteTranslate,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    options.map((option) => [option.value, t(option.labelKey)]),
  );
}

export function createRequestQuotePayloadCopy(
  t: RequestQuoteTranslate,
): RequestQuotePayloadCopy {
  return {
    requirements: {
      source: t("requirements.source"),
      notSpecified: t("requirements.notSpecified"),
      yes: t("requirements.yes"),
      no: t("requirements.no"),
      productNamePrefix: t("requirements.productNamePrefix"),
      protection: t("requirements.protection"),
      dimensions: t("requirements.dimensions"),
      mounting: t("requirements.mounting"),
      material: t("requirements.material"),
      quantity: t("requirements.quantity"),
      delivery: t("requirements.delivery"),
      timeline: t("requirements.timeline"),
      assetLinks: t("requirements.assetLinks"),
      whatsApp: t("requirements.whatsApp"),
      tradeEnquiry: t("requirements.tradeEnquiry"),
    },
    options: {
      protection: createOptionLabelMap(REQUEST_QUOTE_PROTECTION_OPTIONS, t),
      mounting: createOptionLabelMap(REQUEST_QUOTE_MOUNTING_SURFACE_OPTIONS, t),
      material: createOptionLabelMap(REQUEST_QUOTE_MATERIAL_OPTIONS, t),
      quantity: createOptionLabelMap(REQUEST_QUOTE_QUANTITY_OPTIONS, t),
      timeline: createOptionLabelMap(REQUEST_QUOTE_TIMELINE_OPTIONS, t),
    },
  };
}

function getOptionalString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionLabel(
  options: Readonly<Record<string, string>>,
  value: string,
  fallback: string,
): string {
  return options[value] ?? fallback;
}

function createRequirementLine(label: string, value: string): string | null {
  return value ? `${label}: ${value}` : null;
}

export function createRequestQuoteRequirements(
  formData: FormData,
  copy: RequestQuotePayloadCopy,
): string {
  const { requirements } = copy;
  const protection = getOptionLabel(
    copy.options.protection,
    getOptionalString(formData, "protection"),
    requirements.notSpecified,
  );
  const mounting = getOptionLabel(
    copy.options.mounting,
    getOptionalString(formData, "mounting"),
    requirements.notSpecified,
  );
  const materialValue =
    getOptionalString(formData, "material") ||
    REQUEST_QUOTE_DEFAULT_MATERIAL_VALUE;
  const material = getOptionLabel(
    copy.options.material,
    materialValue,
    requirements.notSpecified,
  );
  const quantity = getOptionLabel(
    copy.options.quantity,
    getOptionalString(formData, "quantity"),
    requirements.notSpecified,
  );
  const timeline = getOptionLabel(
    copy.options.timeline,
    getOptionalString(formData, "timeline"),
    requirements.notSpecified,
  );
  const tradeEnquiry =
    formData.get("tradeEnquiry") === "on" ? requirements.yes : requirements.no;

  return [
    requirements.source,
    `${requirements.protection}: ${protection}`,
    createRequirementLine(
      requirements.dimensions,
      getOptionalString(formData, "dimensions"),
    ),
    `${requirements.mounting}: ${mounting}`,
    `${requirements.material}: ${material}`,
    `${requirements.quantity}: ${quantity}`,
    createRequirementLine(
      requirements.delivery,
      getOptionalString(formData, "delivery"),
    ),
    `${requirements.timeline}: ${timeline}`,
    createRequirementLine(
      requirements.assetLinks,
      getOptionalString(formData, "assetLinks"),
    ),
    createRequirementLine(
      requirements.whatsApp,
      getOptionalString(formData, "whatsApp"),
    ),
    `${requirements.tradeEnquiry}: ${tradeEnquiry}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function createRequestQuotePayload(
  formData: FormData,
  turnstileToken: string,
  copy: RequestQuotePayloadCopy,
): RequestQuotePayload {
  const materialValue =
    getOptionalString(formData, "material") ||
    REQUEST_QUOTE_DEFAULT_MATERIAL_VALUE;
  const materialLabel = getOptionLabel(
    copy.options.material,
    materialValue,
    copy.requirements.notSpecified,
  );
  const quantityLabel = getOptionLabel(
    copy.options.quantity,
    getOptionalString(formData, "quantity"),
    copy.requirements.notSpecified,
  );
  const company = getOptionalString(formData, "company");

  return {
    fullName: getOptionalString(formData, "fullName"),
    email: getOptionalString(formData, "email"),
    ...(company ? { company } : {}),
    productSlug: materialValue,
    productName: `${copy.requirements.productNamePrefix}: ${materialLabel}`,
    quantity: quantityLabel,
    requirements: createRequestQuoteRequirements(formData, copy),
    marketingConsent: false,
    turnstileToken,
    ...pickAttributionFieldsFromFormData(formData),
  };
}
