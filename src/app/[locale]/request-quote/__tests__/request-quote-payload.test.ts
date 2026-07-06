import { describe, expect, it } from "vitest";
import { LEAD_TYPES, productLeadSchema } from "@/lib/lead-pipeline/lead-schema";
import {
  createRequestQuotePayload,
  createRequestQuotePayloadCopy,
  createRequestQuoteRequirements,
} from "../request-quote-payload";

function createFormData(entries: Array<[string, string]>): FormData {
  const formData = new FormData();

  for (const [key, value] of entries) {
    formData.set(key, value);
  }

  return formData;
}

const MESSAGES = {
  "payload.source": "Submitted via the request-quote form.",
  "payload.productName": "General RFQ — product line to be advised",
  "payload.quantityFallback": "Not specified — see message",
} as const;

function t(key: string): string {
  return MESSAGES[key as keyof typeof MESSAGES] ?? key;
}

describe("request quote payload", () => {
  it("prefixes the buyer message with the RFQ source line", () => {
    const formData = createFormData([
      ["message", "Aluminum gates for 3 garage doors, 2.4m × 1.2m, to USA."],
    ]);

    expect(
      createRequestQuoteRequirements(
        formData,
        createRequestQuotePayloadCopy(t),
      ),
    ).toBe(
      [
        "Submitted via the request-quote form.",
        "Aluminum gates for 3 garage doors, 2.4m × 1.2m, to USA.",
      ].join("\n"),
    );
  });

  it("falls back to the source line when the optional message is blank", () => {
    const formData = createFormData([
      ["fullName", "Alice Buyer"],
      ["email", "alice@example.com"],
      ["message", "   "],
    ]);

    const payload = createRequestQuotePayload(
      formData,
      "turnstile-token",
      createRequestQuotePayloadCopy(t),
    );

    expect(payload).toMatchObject({
      fullName: "Alice Buyer",
      email: "alice@example.com",
      productSlug: "request-quote",
      productName: "General RFQ — product line to be advised",
      quantity: "Not specified — see message",
      requirements: "Submitted via the request-quote form.",
      marketingConsent: false,
      turnstileToken: "turnstile-token",
    });
  });

  it("preserves marketing attribution fields", () => {
    const formData = createFormData([
      ["fullName", "Alice Buyer"],
      ["email", "alice@example.com"],
      ["utmSource", "google"],
      ["utmCampaign", "flood-barriers"],
      ["gclid", "gclid-rfq-123"],
      ["landingPage", "/en/request-quote"],
      ["capturedAt", "2026-07-04T00:00:00.000Z"],
    ]);

    expect(
      createRequestQuotePayload(
        formData,
        "turnstile-token",
        createRequestQuotePayloadCopy(t),
      ),
    ).toMatchObject({
      utmSource: "google",
      utmCampaign: "flood-barriers",
      gclid: "gclid-rfq-123",
      landingPage: "/en/request-quote",
      capturedAt: "2026-07-04T00:00:00.000Z",
    });
  });

  it("creates a product lead payload accepted by the real inquiry schema", () => {
    const formData = createFormData([
      ["fullName", "Alice Buyer"],
      ["email", "alice@example.com"],
      ["message", "FRP planks, 12m run length, Australia / Brisbane."],
      ["utmSource", "google"],
    ]);

    const payload = createRequestQuotePayload(
      formData,
      "turnstile-token",
      createRequestQuotePayloadCopy(t),
    );

    expect(Object.keys(payload).sort()).toEqual([
      "email",
      "fullName",
      "marketingConsent",
      "productName",
      "productSlug",
      "quantity",
      "requirements",
      "turnstileToken",
      "utmSource",
    ]);

    const parsed = productLeadSchema.safeParse({
      type: LEAD_TYPES.PRODUCT,
      fullName: payload.fullName,
      productSlug: payload.productSlug,
      productName: payload.productName,
      quantity: payload.quantity,
      requirements: payload.requirements,
      email: payload.email,
      marketingConsent: payload.marketingConsent,
      utmSource: payload.utmSource,
    });

    expect(parsed.success).toBe(true);
  });
});
