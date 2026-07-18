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

function readInquiryFormErrorMessage(
  messages: Record<string, unknown>,
  key: string,
): string {
  switch (key) {
    case "errors.fieldSummary":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "errors",
        "fieldSummary",
      ]);
    case "errors.securitySummary":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "errors",
        "securitySummary",
      ]);
    case "errors.serverSummary":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "errors",
        "serverSummary",
      ]);
    default:
      throw new Error(`Unknown inquiry.form key: ${key}`);
  }
}

function readInquiryFormPrimaryMessage(
  messages: Record<string, unknown>,
  key: string,
): string | undefined {
  switch (key) {
    case "optional":
      return readRequiredMessagePath(messages, ["inquiry", "form", "optional"]);
    case "fullName":
      return readRequiredMessagePath(messages, ["inquiry", "form", "fullName"]);
    case "email":
      return readRequiredMessagePath(messages, ["inquiry", "form", "email"]);
    case "message":
      return readRequiredMessagePath(messages, ["inquiry", "form", "message"]);
    case "messageHint":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "messageHint",
      ]);
    case "contextLabel":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "contextLabel",
      ]);
    case "submit":
      return readRequiredMessagePath(messages, ["inquiry", "form", "submit"]);
    case "submitting":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "submitting",
      ]);
    default:
      return undefined;
  }
}

function readInquiryFormScalarMessage(
  messages: Record<string, unknown>,
  key: string,
): string {
  const primary = readInquiryFormPrimaryMessage(messages, key);
  if (primary !== undefined) {
    return primary;
  }

  switch (key) {
    case "success":
      return readRequiredMessagePath(messages, ["inquiry", "form", "success"]);
    case "referenceLabel":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "referenceLabel",
      ]);
    case "privacyNotice":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "privacyNotice",
      ]);
    case "noJsExplanation":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "noJsExplanation",
      ]);
    case "noJsEmailPrefix":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "noJsEmailPrefix",
      ]);
    case "contactAriaLabel":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "contactAriaLabel",
      ]);
    case "requestQuoteAriaLabel":
      return readRequiredMessagePath(messages, [
        "inquiry",
        "form",
        "requestQuoteAriaLabel",
      ]);
    default:
      return readInquiryFormErrorMessage(messages, key);
  }
}

export function createInquiryFormCopyFromMessages(
  messages: Record<string, unknown>,
): InquiryFormCopy {
  return createInquiryFormCopy((key) =>
    readInquiryFormScalarMessage(messages, key),
  );
}
