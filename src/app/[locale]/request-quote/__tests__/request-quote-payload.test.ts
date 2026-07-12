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

  it("produces an explicit general RFQ with no product identity", () => {
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
      productInquiryKind: "general-rfq",
      requirements: "Submitted via the request-quote form.",
      turnstileToken: "turnstile-token",
    });
    // A general RFQ never claims a per-product identity.
    expect(payload).not.toHaveProperty("catalogProductId");
    // No product-line hint was supplied, so buyerInterest is omitted.
    expect(payload).not.toHaveProperty("buyerInterest");
  });

  it("carries a product-line hint as buyerInterest, not as identity", () => {
    const formData = createFormData([
      ["fullName", "Alice Buyer"],
      ["email", "alice@example.com"],
      ["interest", "aluminum flood gates"],
    ]);

    const payload = createRequestQuotePayload(
      formData,
      "turnstile-token",
      createRequestQuotePayloadCopy(t),
    );

    expect(payload.buyerInterest).toBe("aluminum flood gates");
    expect(payload.productInquiryKind).toBe("general-rfq");
    expect(payload).not.toHaveProperty("catalogProductId");
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

  it("creates a general RFQ payload accepted by the real inquiry schema", () => {
    const formData = createFormData([
      ["fullName", "Alice Buyer"],
      ["email", "alice@example.com"],
      ["message", "FRP planks, 12m run length, Australia / Brisbane."],
      ["interest", "frp planks"],
      ["utmSource", "google"],
    ]);

    const payload = createRequestQuotePayload(
      formData,
      "turnstile-token",
      createRequestQuotePayloadCopy(t),
    );

    expect(Object.keys(payload).sort()).toEqual([
      "buyerInterest",
      "email",
      "fullName",
      "productInquiryKind",
      "requirements",
      "turnstileToken",
      "utmSource",
    ]);

    const parsed = productLeadSchema.safeParse({
      type: LEAD_TYPES.PRODUCT,
      productInquiryKind: payload.productInquiryKind,
      fullName: payload.fullName,
      buyerInterest: payload.buyerInterest,
      requirements: payload.requirements,
      email: payload.email,
      utmSource: payload.utmSource,
    });

    expect(parsed.success).toBe(true);
  });
});
