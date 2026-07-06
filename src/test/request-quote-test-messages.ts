import enDeferredMessages from "@messages/en/deferred.json";
import {
  createRequestQuoteFormCopy,
  type RequestQuoteFormCopy,
} from "@/app/[locale]/request-quote/request-quote-form-copy";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedString(messages: JsonObject, keyPath: string): string {
  const value = keyPath.split(".").reduce<unknown>((current, key) => {
    if (!isJsonObject(current)) return undefined;
    return current[key];
  }, messages);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing RFQ test message: ${keyPath}`);
  }

  return value;
}

function getRequestQuoteMessages(): JsonObject {
  if (!isJsonObject(enDeferredMessages.requestQuote)) {
    throw new Error("Missing requestQuote messages");
  }

  return enDeferredMessages.requestQuote;
}

export function getRequestQuoteFormMessage(keyPath: string): string {
  const messages = getRequestQuoteMessages();
  if (!isJsonObject(messages.form)) {
    throw new Error("Missing requestQuote.form messages");
  }

  return getNestedString(messages.form, keyPath);
}

export function getRequestQuotePageMessage(
  keyPath: string,
  values: Record<string, string | number> = {},
): string {
  const messages = getRequestQuoteMessages();
  if (!isJsonObject(messages.page)) {
    throw new Error("Missing requestQuote.page messages");
  }

  const message = getNestedString(messages.page, keyPath);
  return Object.entries(values).reduce((current, [key, value]) => {
    const token = `{${key}}`;
    return current.split(token).join(String(value));
  }, message);
}

export function getRequestQuoteMetadataMessage(keyPath: string): string {
  const messages = getRequestQuoteMessages();
  if (!isJsonObject(messages.metadata)) {
    throw new Error("Missing requestQuote.metadata messages");
  }

  return getNestedString(messages.metadata, keyPath);
}

export function createTestRequestQuoteFormCopy(): RequestQuoteFormCopy {
  return createRequestQuoteFormCopy(getRequestQuoteFormMessage);
}
