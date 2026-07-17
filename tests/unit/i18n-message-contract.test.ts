import enMessages from "../../messages/en/messages.json";
import baseEnMessages from "../../messages/base/en/messages.json";
import b2bLeadMessages from "../../messages/profiles/b2b-lead/en/messages.json";
import catalogMessages from "../../messages/profiles/catalog/en/messages.json";
import { describe, expect, it } from "vitest";
import {
  API_ERROR_CODES,
  FORM_NETWORK_ERROR,
} from "@/constants/api-error-codes";

type JsonObject = Record<string, unknown>;

const REQUIRED_RUNTIME_KEYS = [
  "accessibility.securityVerificationUnavailable",
  "accessibility.turnstileDevBypass",
  "accessibility.turnstileTestMode",
  "accessibility.turnstileLoadFailed",
  "contact.form.networkError",
  "contact.form.privacyNotice",
] as const;

const CONTACT_API_VALIDATION_DETAIL_KEYS = [
  "errors.message.required",
  "errors.message.tooShort",
  "errors.message.tooLong",
  "errors.subject.length",
  "errors.fullName.tooShort",
  "errors.company.tooShort",
] as const;

const REQUEST_QUOTE_RUNTIME_KEYS = [
  "requestQuote.metadata.title",
  "requestQuote.metadata.description",
  "requestQuote.page.heading",
  "requestQuote.form.title",
  "requestQuote.form.submit",
  "requestQuote.form.success",
  "requestQuote.form.genericError",
  "requestQuote.form.networkError",
  "requestQuote.form.turnstilePending",
  "requestQuote.form.messageHint",
  "requestQuote.form.privacyNotice",
  "requestQuote.form.fields.fullName",
  "requestQuote.form.fields.email",
  "requestQuote.form.fields.message",
  "requestQuote.form.payload.source",
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
  const runtimeMessageCases = [["en", enMessages]] as const;

  it.each(runtimeMessageCases)(
    "keeps degraded-state form keys in the real %s message bundle",
    (_locale, messages) => {
      for (const keyPath of REQUIRED_RUNTIME_KEYS) {
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(runtimeMessageCases)(
    "keeps contact-only API validation detail keys in the real %s contact form bundle",
    (_locale, messages) => {
      for (const detailKey of CONTACT_API_VALIDATION_DETAIL_KEYS) {
        const keyPath = `contact.form.${detailKey}`;
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(runtimeMessageCases)(
    "keeps RFQ page and option keys in the real %s message bundle",
    (_locale, messages) => {
      for (const keyPath of REQUEST_QUOTE_RUNTIME_KEYS) {
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
        expect(String(value), keyPath).not.toBe(keyPath);
      }
    },
  );

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

  it("keeps the client-only network fallback on its dedicated form message", () => {
    expect(baseEnMessages.apiErrors).not.toHaveProperty(FORM_NETWORK_ERROR);
    expect(getMessageValue(enMessages, "contact.form.networkError")).toEqual(
      expect.any(String),
    );
  });
});
