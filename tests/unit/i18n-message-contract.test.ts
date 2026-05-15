import enCriticalMessages from "../../messages/en/critical.json";
import enDeferredMessages from "../../messages/en/deferred.json";
import esCriticalMessages from "../../messages/es/critical.json";
import esDeferredMessages from "../../messages/es/deferred.json";
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

function collectLeafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectLeafPaths(entry, `${prefix}.${index}`.replace(/^\./u, "")),
    );
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectLeafPaths(child, `${prefix}.${key}`.replace(/^\./u, "")),
  );
}

const LOCALE_MESSAGES = [
  ["en", mergeMessages(enCriticalMessages, enDeferredMessages)],
  ["es", mergeMessages(esCriticalMessages, esDeferredMessages)],
  ["zh", mergeMessages(zhCriticalMessages, zhDeferredMessages)],
] as const;

describe("real i18n runtime message contract", () => {
  it.each(LOCALE_MESSAGES)(
    "keeps degraded-state form keys in the real %s split message bundle",
    (_locale, messages) => {
      for (const keyPath of REQUIRED_RUNTIME_KEYS) {
        const value = getMessageValue(messages, keyPath);

        expect(typeof value, keyPath).toBe("string");
        expect(String(value).trim(), keyPath).not.toBe("");
      }
    },
  );

  it.each(LOCALE_MESSAGES)(
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

  it.each(LOCALE_MESSAGES)(
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

  it("keeps Spanish split message keys structurally aligned with English", () => {
    expect(collectLeafPaths(esCriticalMessages).sort()).toEqual(
      collectLeafPaths(enCriticalMessages).sort(),
    );
    expect(collectLeafPaths(esDeferredMessages).sort()).toEqual(
      collectLeafPaths(enDeferredMessages).sort(),
    );
  });

  // Spanish leaves that are legitimately identical to English (technical
  // material tokens kept in English per content rules), so an untranslated
  // copy here is intentional and must not require the [ES-TODO] marker.
  const ES_IDENTICAL_ALLOWLIST = new Set<string>([
    "home.materials.epdm.name",
    "home.materials.tpu.name",
    "membraneProduct.hero.specBar.material",
    "membraneProduct.hero.specBar.sku",
    "compatibleBrand.filter.material",
    "quote.form.materialOptions.epdm",
    "quote.form.materialOptions.tpu",
  ]);

  it("marks untranslated Spanish copies with ES-TODO", () => {
    const enMessages = mergeMessages(enCriticalMessages, enDeferredMessages);
    const esMessages = mergeMessages(esCriticalMessages, esDeferredMessages);
    const esPaths = collectLeafPaths(esMessages);

    expect(esPaths.length).toBeGreaterThan(0);

    const untranslatedCopies = esPaths.filter((path) => {
      if (ES_IDENTICAL_ALLOWLIST.has(path)) return false;
      const esValue = getMessageValue(esMessages, path);
      const enValue = getMessageValue(enMessages, path);
      if (typeof esValue !== "string" || typeof enValue !== "string") {
        return false;
      }
      // A verbatim English copy that is NOT flagged is a contract violation.
      return esValue === enValue && !esValue.startsWith("[ES-TODO] ");
    });

    expect(untranslatedCopies).toEqual([]);
  });
});
