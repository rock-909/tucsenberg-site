import {
  createRequestQuotePayloadCopy,
  type RequestQuotePayloadCopy,
} from "@/app/[locale]/request-quote/request-quote-payload";

type RequestQuoteTranslate = (key: string) => string;

export interface RequestQuoteFormCopy {
  readonly title: string;
  readonly ariaLabel: string;
  readonly submit: string;
  readonly submitting: string;
  readonly success: string;
  readonly successReading: string;
  readonly successReadingLinkLabel: string;
  readonly genericError: string;
  readonly networkError: string;
  readonly turnstilePending: string;
  readonly referenceLabel: string;
  readonly messageHint: string;
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly message: string;
  };
  readonly payload: RequestQuotePayloadCopy;
}

export function createRequestQuoteFormCopy(
  t: RequestQuoteTranslate,
): RequestQuoteFormCopy {
  return {
    title: t("title"),
    ariaLabel: t("ariaLabel"),
    submit: t("submit"),
    submitting: t("submitting"),
    success: t("success"),
    successReading: t("successReading"),
    successReadingLinkLabel: t("successReadingLinkLabel"),
    genericError: t("genericError"),
    networkError: t("networkError"),
    turnstilePending: t("turnstilePending"),
    referenceLabel: t("referenceLabel"),
    messageHint: t("messageHint"),
    fields: {
      fullName: t("fields.fullName"),
      email: t("fields.email"),
      message: t("fields.message"),
    },
    payload: createRequestQuotePayloadCopy(t),
  };
}
