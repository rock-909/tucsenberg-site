import baseEnMessages from "../../messages/base/en/messages.json";
import b2bLeadMessages from "../../messages/profiles/b2b-lead/en/messages.json";
import catalogMessages from "../../messages/profiles/catalog/en/messages.json";
import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS } from "@/lib/api/inquiry-validation-details";

type JsonObject = Record<string, unknown>;

const enMessages = getComposedMessages("en") as JsonObject & {
  apiErrors: Record<string, unknown>;
  requestQuote?: unknown;
  inquiry?: JsonObject;
  contact?: JsonObject;
};

const INQUIRY_FORM_LEAF_KEYS = [
  "optional",
  "fullName",
  "email",
  "message",
  "messageHint",
  "contextLabel",
  "submit",
  "submitting",
  "success",
  "referenceLabel",
  "privacyNotice",
  "noJsExplanation",
  "noJsEmailPrefix",
  "contactAriaLabel",
  "requestQuoteAriaLabel",
  "errors.fieldSummary",
  "errors.securitySummary",
  "errors.serverSummary",
  "errors.fullName.required",
  "errors.fullName.invalid",
  "errors.fullName.tooLong",
  "errors.email.required",
  "errors.email.invalid",
  "errors.email.tooLong",
  "errors.message.invalid",
  "errors.message.tooLong",
] as const;

const REQUEST_QUOTE_PAGE_KEYS = [
  "requestQuote.metadata.title",
  "requestQuote.metadata.description",
  "requestQuote.page.heading",
  "requestQuote.page.intro",
] as const;

const CONTACT_PANEL_KEYS = [
  "contact.panel.contactTitle",
  "contact.panel.email",
  "contact.inquiryHandoff.title",
  "contact.inquiryHandoff.description",
] as const;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMessageValue(messages: JsonObject, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isJsonObject(current)) return undefined;
    return current[key];
  }, messages);
}

describe("real i18n runtime message contract", () => {
  it("keeps the inquiry.form leaf set used by InquiryFormCopy", () => {
    for (const keyPath of INQUIRY_FORM_LEAF_KEYS) {
      const value = getMessageValue(enMessages, `inquiry.form.${keyPath}`);

      expect(typeof value, `inquiry.form.${keyPath}`).toBe("string");
      expect(String(value).trim(), `inquiry.form.${keyPath}`).not.toBe("");
    }
  });

  it("keeps request quote page and metadata owners", () => {
    for (const keyPath of REQUEST_QUOTE_PAGE_KEYS) {
      const value = getMessageValue(enMessages, keyPath);

      expect(typeof value, keyPath).toBe("string");
      expect(String(value).trim(), keyPath).not.toBe("");
    }

    expect(enMessages).not.toHaveProperty("requestQuote.form");
  });

  it("keeps contact panel and inquiry handoff owners without contact.form", () => {
    for (const keyPath of CONTACT_PANEL_KEYS) {
      const value = getMessageValue(enMessages, keyPath);

      expect(typeof value, keyPath).toBe("string");
      expect(String(value).trim(), keyPath).not.toBe("");
    }

    expect(enMessages.contact).not.toHaveProperty("form");
  });

  it("keeps inquiry validation detail keys under inquiry.form", () => {
    const renderableDetails = PRODUCT_INQUIRY_VALIDATION_DETAIL_KEYS.filter(
      (detailKey) => detailKey !== "errors.generic",
    );

    for (const detailKey of renderableDetails) {
      const value = getMessageValue(enMessages, `inquiry.form.${detailKey}`);

      expect(typeof value, detailKey).toBe("string");
      expect(String(value).trim(), detailKey).not.toBe("");
    }

    expect(
      getMessageValue(enMessages, "inquiry.form.errors.generic"),
    ).toBeUndefined();
    expect(
      getMessageValue(enMessages, "inquiry.form.errors.fieldSummary"),
    ).toEqual(expect.any(String));
  });

  it("keeps RFQ copy owned by b2b-lead and inherited by catalog", () => {
    expect(b2bLeadMessages).toHaveProperty("requestQuote");
    expect(catalogMessages).not.toHaveProperty("requestQuote");
    expect(enMessages).toHaveProperty("requestQuote");
  });

  it("keeps API error messages aligned with live error codes", () => {
    const liveErrorCodes = Object.values(API_ERROR_CODES).sort();
    const authoringErrorKeys = Object.keys(baseEnMessages.apiErrors).sort();

    expect(authoringErrorKeys).toEqual(liveErrorCodes);
    expect(Object.keys(enMessages.apiErrors).sort()).toEqual(liveErrorCodes);
  });
});
