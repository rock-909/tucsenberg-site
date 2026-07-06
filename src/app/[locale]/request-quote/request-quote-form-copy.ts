import {
  createRequestQuotePayloadCopy,
  type RequestQuotePayloadCopy,
} from "@/app/[locale]/request-quote/request-quote-payload";

type RequestQuoteTranslate = (key: string) => string;

export interface RequestQuoteFormCopy {
  readonly title: string;
  readonly ariaLabel: string;
  readonly selectOne: string;
  readonly submit: string;
  readonly submitting: string;
  readonly success: string;
  readonly genericError: string;
  readonly networkError: string;
  readonly turnstilePending: string;
  readonly referenceLabel: string;
  readonly tradeEnquiry: string;
  readonly assetHint: string;
  readonly fields: {
    readonly protection: string;
    readonly dimensions: string;
    readonly mounting: string;
    readonly material: string;
    readonly quantity: string;
    readonly delivery: string;
    readonly timeline: string;
    readonly assetLinks: string;
    readonly fullName: string;
    readonly email: string;
    readonly company: string;
    readonly whatsApp: string;
  };
  readonly payload: RequestQuotePayloadCopy;
}

export function createRequestQuoteFormCopy(
  t: RequestQuoteTranslate,
): RequestQuoteFormCopy {
  return {
    title: t("title"),
    ariaLabel: t("ariaLabel"),
    selectOne: t("selectOne"),
    submit: t("submit"),
    submitting: t("submitting"),
    success: t("success"),
    genericError: t("genericError"),
    networkError: t("networkError"),
    turnstilePending: t("turnstilePending"),
    referenceLabel: t("referenceLabel"),
    tradeEnquiry: t("tradeEnquiry"),
    assetHint: t("assetHint"),
    fields: {
      protection: t("fields.protection"),
      dimensions: t("fields.dimensions"),
      mounting: t("fields.mounting"),
      material: t("fields.material"),
      quantity: t("fields.quantity"),
      delivery: t("fields.delivery"),
      timeline: t("fields.timeline"),
      assetLinks: t("fields.assetLinks"),
      fullName: t("fields.fullName"),
      email: t("fields.email"),
      company: t("fields.company"),
      whatsApp: t("fields.whatsApp"),
    },
    payload: createRequestQuotePayloadCopy(t),
  };
}
