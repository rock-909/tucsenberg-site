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
  readonly turnstilePending: string;
  readonly noJsExplanation: string;
  readonly noJsEmailPrefix: string;
  readonly contactAriaLabel: string;
  readonly requestQuoteAriaLabel: string;
  readonly errors: {
    readonly fieldSummary: string;
    readonly securitySummary: string;
    readonly serverSummary: string;
    readonly networkSummary: string;
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
    turnstilePending: t("turnstilePending"),
    noJsExplanation: t("noJsExplanation"),
    noJsEmailPrefix: t("noJsEmailPrefix"),
    contactAriaLabel: t("contactAriaLabel"),
    requestQuoteAriaLabel: t("requestQuoteAriaLabel"),
    errors: {
      fieldSummary: t("errors.fieldSummary"),
      securitySummary: t("errors.securitySummary"),
      serverSummary: t("errors.serverSummary"),
      networkSummary: t("errors.networkSummary"),
    },
  };
}

export function createInquiryFormCopyFromMessages(
  messages: Record<string, unknown>,
): InquiryFormCopy {
  return {
    optional: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "optional",
    ]),
    fullName: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "fullName",
    ]),
    email: readRequiredMessagePath(messages, ["inquiry", "form", "email"]),
    message: readRequiredMessagePath(messages, ["inquiry", "form", "message"]),
    messageHint: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "messageHint",
    ]),
    contextLabel: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "contextLabel",
    ]),
    submit: readRequiredMessagePath(messages, ["inquiry", "form", "submit"]),
    submitting: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "submitting",
    ]),
    success: readRequiredMessagePath(messages, ["inquiry", "form", "success"]),
    referenceLabel: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "referenceLabel",
    ]),
    privacyNotice: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "privacyNotice",
    ]),
    turnstilePending: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "turnstilePending",
    ]),
    noJsExplanation: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "noJsExplanation",
    ]),
    noJsEmailPrefix: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "noJsEmailPrefix",
    ]),
    contactAriaLabel: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "contactAriaLabel",
    ]),
    requestQuoteAriaLabel: readRequiredMessagePath(messages, [
      "inquiry",
      "form",
      "requestQuoteAriaLabel",
    ]),
    errors: {
      fieldSummary: readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "errors",
        "fieldSummary",
      ]),
      securitySummary: readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "errors",
        "securitySummary",
      ]),
      serverSummary: readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "errors",
        "serverSummary",
      ]),
      networkSummary: readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "errors",
        "networkSummary",
      ]),
    },
  };
}
