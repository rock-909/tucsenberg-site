import { readRequiredMessagePath } from "@/lib/i18n/read-message-path";

export type InquiryFormSource = "contact" | "request-quote";

type InquiryFormMessageKey =
  | "optional"
  | "fullName"
  | "email"
  | "message"
  | "messageHint"
  | "contextLabel"
  | "submit"
  | "submitting"
  | "success"
  | "referenceLabel"
  | "privacyNotice"
  | "noJsExplanation"
  | "noJsEmailPrefix"
  | "contactAriaLabel"
  | "requestQuoteAriaLabel"
  | "errors.fieldSummary"
  | "errors.securitySummary"
  | "errors.serverSummary"
  | "errors.fullName.required"
  | "errors.fullName.invalid"
  | "errors.fullName.tooLong"
  | "errors.email.required"
  | "errors.email.invalid"
  | "errors.email.tooLong"
  | "errors.message.invalid"
  | "errors.message.tooLong";

type InquiryTranslate = (key: InquiryFormMessageKey) => string;

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
    readonly fullName: {
      readonly required: string;
      readonly invalid: string;
      readonly tooLong: string;
    };
    readonly email: {
      readonly required: string;
      readonly invalid: string;
      readonly tooLong: string;
    };
    readonly message: {
      readonly invalid: string;
      readonly tooLong: string;
    };
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
      fullName: {
        required: t("errors.fullName.required"),
        invalid: t("errors.fullName.invalid"),
        tooLong: t("errors.fullName.tooLong"),
      },
      email: {
        required: t("errors.email.required"),
        invalid: t("errors.email.invalid"),
        tooLong: t("errors.email.tooLong"),
      },
      message: {
        invalid: t("errors.message.invalid"),
        tooLong: t("errors.message.tooLong"),
      },
    },
  };
}

export function createInquiryFormCopyFromMessages(
  messages: Record<string, unknown>,
): InquiryFormCopy {
  return createInquiryFormCopy((key: InquiryFormMessageKey) =>
    readRequiredMessagePath(messages, ["inquiry", "form", ...key.split(".")]),
  );
}
