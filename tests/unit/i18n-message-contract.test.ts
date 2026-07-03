import enCriticalMessages from "../../messages/en/critical.json";
import enDeferredMessages from "../../messages/en/deferred.json";
import zhCriticalMessages from "../../messages/zh/critical.json";
import zhDeferredMessages from "../../messages/zh/deferred.json";
import { describe, expect, it } from "vitest";

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
  "errors.productSlug.required",
  "errors.productSlug.invalid",
  "errors.productName.required",
  "errors.productName.invalid",
  "errors.productName.tooLong",
  "errors.productName.tooShort",
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
  it.each([
    ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
    ["zh", mergeMessages(zhCriticalMessages, zhDeferredMessages)],
  ] as const)(
    "keeps degraded-state form keys in the real %s split message bundle",
    (_locale, messages) => {
      for (const keyPath of REQUIRED_RUNTIME_KEYS) {
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each([
    ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
    ["zh", mergeMessages(zhCriticalMessages, zhDeferredMessages)],
  ] as const)(
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

  it.each([
    ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
    ["zh", mergeMessages(zhCriticalMessages, zhDeferredMessages)],
  ] as const)(
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
});
