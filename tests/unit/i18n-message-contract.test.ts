import enCriticalMessages from "../../messages/en/critical.json";
import enDeferredMessages from "../../messages/en/deferred.json";
import baseEnCriticalMessages from "../../messages/base/en/critical.json";
import b2bLeadDeferredMessages from "../../messages/profiles/b2b-lead/en/deferred.json";
import catalogDeferredMessages from "../../messages/profiles/catalog/en/deferred.json";
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
] as const;

const INQUIRY_API_VALIDATION_DETAIL_KEYS = [
  "errors.fullName.required",
  "errors.fullName.invalid",
  "errors.fullName.tooLong",
  "errors.fullName.tooShort",
  "errors.email.required",
  "errors.email.invalid",
  "errors.email.tooLong",
  "errors.company.tooShort",
  "errors.company.tooLong",
  "errors.company.invalid",
  "errors.productInquiryKind.required",
  "errors.productInquiryKind.invalid",
  "errors.catalogProductId.required",
  "errors.catalogProductId.invalid",
  "errors.buyerInterest.tooLong",
  "errors.buyerInterest.invalid",
  "errors.quantity.required",
  "errors.quantity.invalid",
  "errors.requirements.invalid",
  "errors.requirements.tooLong",
] as const;

const CONTACT_API_VALIDATION_DETAIL_KEYS = [
  "errors.message.required",
  "errors.message.tooShort",
  "errors.message.tooLong",
  "errors.subject.length",
  "errors.acceptPrivacy.required",
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
  "requestQuote.form.fields.fullName",
  "requestQuote.form.fields.email",
  "requestQuote.form.fields.message",
  "requestQuote.form.payload.source",
] as const;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(critical: JsonObject, deferred: JsonObject): JsonObject {
  const result: JsonObject = { ...critical };

  for (const [key, value] of Object.entries(deferred)) {
    const existingValue = result[key];
    result[key] =
      isJsonObject(existingValue) && isJsonObject(value)
        ? mergeMessages(existingValue, value)
        : value;
  }

  return result;
}

function getMessageValue(messages: JsonObject, keyPath: string): unknown {
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isJsonObject(current)) return undefined;
    return current[key];
  }, messages);
}

describe("real i18n runtime message contract", () => {
  const runtimeMessageCases = [
    ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
  ] as const;

  it.each(runtimeMessageCases)(
    "keeps degraded-state form keys in the real %s split message bundle",
    (_locale, messages) => {
      for (const keyPath of REQUIRED_RUNTIME_KEYS) {
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(runtimeMessageCases)(
    "keeps inquiry API validation detail keys in the real %s contact form bundle",
    (_locale, messages) => {
      for (const detailKey of INQUIRY_API_VALIDATION_DETAIL_KEYS) {
        const keyPath = `contact.form.${detailKey}`;
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(runtimeMessageCases)(
    "keeps contact API validation detail keys in the real %s contact form bundle",
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
    "keeps RFQ page and option keys in the real %s split message bundle",
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
    expect(b2bLeadDeferredMessages).toHaveProperty("requestQuote");
    expect(catalogDeferredMessages).not.toHaveProperty("requestQuote");

    const catalogRuntimeMessages = mergeMessages(
      enCriticalMessages,
      enDeferredMessages,
    );

    expect(catalogRuntimeMessages).toHaveProperty("requestQuote");
  });

  it("keeps API error messages aligned with live error codes", () => {
    const liveErrorCodes = Object.values(API_ERROR_CODES).sort();
    const authoringErrorKeys = Object.keys(
      baseEnCriticalMessages.apiErrors,
    ).sort();

    expect(authoringErrorKeys).toEqual(liveErrorCodes);
    expect(Object.keys(enCriticalMessages.apiErrors).sort()).toEqual(
      liveErrorCodes,
    );
  });

  it("keeps the client-only network fallback on its dedicated form message", () => {
    expect(baseEnCriticalMessages.apiErrors).not.toHaveProperty(
      FORM_NETWORK_ERROR,
    );
    expect(
      getMessageValue(
        mergeMessages(enCriticalMessages, enDeferredMessages),
        "contact.form.networkError",
      ),
    ).toEqual(expect.any(String));
  });
});
