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
  "requirements.source": "RFQ source: /request-quote",
  "requirements.notSpecified": "Not specified",
  "requirements.yes": "Yes",
  "requirements.no": "No",
  "requirements.productNamePrefix": "RFQ",
  "requirements.protection": "What are you protecting",
  "requirements.dimensions": "Opening width x height / run length",
  "requirements.mounting": "Mounting surface / ground type",
  "requirements.material": "Material preference",
  "requirements.quantity": "Quantity",
  "requirements.delivery": "Market & delivery port",
  "requirements.timeline": "Timeline",
  "requirements.assetLinks": "Photos / drawings links",
  "requirements.whatsApp": "WhatsApp",
  "requirements.tradeEnquiry": "Wholesale / OEM / private label",
  "options.protection.door": "Door",
  "options.protection.garage": "Garage",
  "options.protection.driveway": "Driveway",
  "options.protection.loadingDock": "Loading dock",
  "options.protection.perimeter": "Perimeter",
  "options.protection.stockResaleOrder": "Stock / resale order",
  "options.protection.other": "Other",
  "options.mounting.concrete": "Concrete",
  "options.mounting.masonry": "Masonry",
  "options.mounting.steel": "Steel",
  "options.mounting.timber": "Timber",
  "options.mounting.groundSoil": "Ground / soil",
  "options.mounting.other": "Other",
  "options.material.adviseMe": "Advise me",
  "options.material.absFloodBarriers": "ABS flood barriers",
  "options.material.aluminumFloodGates": "Aluminum flood gates",
  "options.material.absorbentFloodBags": "Absorbent flood bags",
  "options.material.floodTubeDams": "Flood tube dams",
  "options.material.frpFloodBarriers": "FRP flood barriers",
  "options.quantity.sampleCarton": "Sample carton",
  "options.quantity.cartons": "Cartons",
  "options.quantity.pallet": "Pallet",
  "options.quantity.lcl": "LCL",
  "options.quantity.container": "Container",
  "options.quantity.projectSchedule": "Project schedule",
  "options.timeline.urgent": "Urgent",
  "options.timeline.thisSeason": "This season",
  "options.timeline.planning": "Planning",
} as const;

function t(key: string): string {
  return MESSAGES[key as keyof typeof MESSAGES] ?? key;
}

describe("request quote payload", () => {
  it("builds translated requirements from selected RFQ values", () => {
    const formData = createFormData([
      ["protection", "door"],
      ["dimensions", "2.4m x 1.2m"],
      ["mounting", "concrete"],
      ["material", "aluminum-flood-gates"],
      ["quantity", "container"],
      ["delivery", "USA / Los Angeles"],
      ["timeline", "urgent"],
      ["assetLinks", "https://example.com/drawings.pdf"],
      ["whatsApp", "+1 555 0100"],
      ["tradeEnquiry", "on"],
    ]);

    expect(
      createRequestQuoteRequirements(
        formData,
        createRequestQuotePayloadCopy(t),
      ),
    ).toBe(
      [
        "RFQ source: /request-quote",
        "What are you protecting: Door",
        "Opening width x height / run length: 2.4m x 1.2m",
        "Mounting surface / ground type: Concrete",
        "Material preference: Aluminum flood gates",
        "Quantity: Container",
        "Market & delivery port: USA / Los Angeles",
        "Timeline: Urgent",
        "Photos / drawings links: https://example.com/drawings.pdf",
        "WhatsApp: +1 555 0100",
        "Wholesale / OEM / private label: Yes",
      ].join("\n"),
    );
  });

  it("omits blank optional text lines and uses defaults for unselected options", () => {
    const formData = createFormData([
      ["material", ""],
      ["quantity", ""],
      ["company", "   "],
      ["fullName", "Alice Buyer"],
      ["email", "alice@example.com"],
    ]);

    const payload = createRequestQuotePayload(
      formData,
      "turnstile-token",
      createRequestQuotePayloadCopy(t),
    );

    expect(payload).toMatchObject({
      fullName: "Alice Buyer",
      email: "alice@example.com",
      productSlug: "advise-me",
      productName: "RFQ: Advise me",
      quantity: "Not specified",
      marketingConsent: false,
      turnstileToken: "turnstile-token",
    });
    expect(payload).not.toHaveProperty("company");
    expect(payload.requirements).not.toContain("Opening width");
    expect(payload.requirements).not.toContain("Market & delivery port");
    expect(payload.requirements).toContain("Material preference: Advise me");
    expect(payload.requirements).toContain(
      "Wholesale / OEM / private label: No",
    );
  });

  it("preserves marketing attribution fields", () => {
    const formData = createFormData([
      ["fullName", "Alice Buyer"],
      ["email", "alice@example.com"],
      ["material", "flood-tube-dams"],
      ["quantity", "pallet"],
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
      productSlug: "flood-tube-dams",
      productName: "RFQ: Flood tube dams",
      quantity: "Pallet",
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
      ["company", "Flood Buyer Co."],
      ["material", "frp-flood-barriers"],
      ["quantity", "project-schedule"],
      ["dimensions", "12m run length"],
      ["delivery", "Australia / Brisbane"],
      ["utmSource", "google"],
    ]);

    const payload = createRequestQuotePayload(
      formData,
      "turnstile-token",
      createRequestQuotePayloadCopy(t),
    );

    expect(Object.keys(payload).sort()).toEqual([
      "company",
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
      company: payload.company,
      marketingConsent: payload.marketingConsent,
      utmSource: payload.utmSource,
    });

    expect(parsed.success).toBe(true);
  });
});
