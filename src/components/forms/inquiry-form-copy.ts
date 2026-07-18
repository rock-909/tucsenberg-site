import { readRequiredMessagePath } from "@/lib/i18n/read-message-path";

export type InquiryFormSource = "contact" | "request-quote";

type InquiryTranslate = (key: string) => string;

export interface InquiryFormCopy {
  readonly optional: string;
  readonly fullName: string;
  readonly email: string;
  readonly message: string;
  readonly messageHint: string;
  readonly contextLabel: string;
  readonly submit: string;
  readonly submitting: string;
  readonly success: string;
  readonly referenceLabel: string;
  readonly privacyNotice: string;
  readonly noJsExplanation: string;
  readonly noJsEmailPrefix: string;
  readonly contactAriaLabel: string;
  readonly requestQuoteAriaLabel: string;
  readonly errors: {
    readonly fieldSummary: string;
    readonly securitySummary: string;
    readonly serverSummary: string;
  };
}

export function createInquiryFormCopy(t: InquiryTranslate): InquiryFormCopy {
  return {
    optional: t("optional"),
    fullName: t("fullName"),
    email: t("email"),
    message: t("message"),
    messageHint: t("messageHint"),
    contextLabel: t("contextLabel"),
    submit: t("submit"),
    submitting: t("submitting"),
    success: t("success"),
    referenceLabel: t("referenceLabel"),
    privacyNotice: t("privacyNotice"),
    noJsExplanation: t("noJsExplanation"),
    noJsEmailPrefix: t("noJsEmailPrefix"),
    contactAriaLabel: t("contactAriaLabel"),
    requestQuoteAriaLabel: t("requestQuoteAriaLabel"),
    errors: {
      fieldSummary: t("errors.fieldSummary"),
      securitySummary: t("errors.securitySummary"),
      serverSummary: t("errors.serverSummary"),
    },
  };
}

export function createInquiryFormCopyFromMessages(
  messages: Record<string, unknown>,
): InquiryFormCopy {
  return createInquiryFormCopy((key) =>
    readRequiredMessagePath(messages, ["inquiry", "form", ...key.split(".")]),
  );
}
