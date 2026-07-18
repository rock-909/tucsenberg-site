/**
 * Canonical low-friction inquiry contract (Cluster 3A / C2).
 *
 * Proves buyer-field behavior through the real schema, /api/inquiry route,
 * processLead, and Airtable field mapping. Owner email is asserted through the
 * real processLead → resendService boundary with the transport mocked there.
 */

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { logger } from "@/lib/__tests__/mocks/logger";
import {
  LEAD_TYPES,
  PRODUCT_INQUIRY_KINDS,
  productLeadSchema,
} from "@/lib/lead-pipeline/lead-schema";
import { processLead } from "@/lib/lead-pipeline/process-lead";

const mockCreateLead = vi.hoisted(() => vi.fn());
const mockSendProductInquiryEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/airtable/instance", () => ({
  airtableService: {
    createLead: mockCreateLead,
  },
}));

vi.mock("@/lib/resend-instance", () => ({
  resendService: {
    sendProductInquiryEmail: mockSendProductInquiryEmail,
  },
}));

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("@/lib/__tests__/mocks/logger");
  return mockLogger;
});

vi.mock("@/lib/security/distributed-rate-limit", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/security/distributed-rate-limit")
    >();
  return {
    ...actual,
    checkDistributedRateLimit: vi.fn(async () => ({
      allowed: true,
      remaining: 5,
      resetTime: Date.now() + 60000,
      retryAfter: null,
    })),
    createRateLimitHeaders: vi.fn(() => new Headers()),
  };
});

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstileDetailed: vi.fn(async () => ({ success: true })),
}));

async function loadInquiryRoute() {
  return import("@/app/api/inquiry/route");
}

function makeInquiryRequest(body: unknown): NextRequest {
  return new NextRequest(
    new Request("http://localhost/api/inquiry", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  );
}

const GENERAL_RFQ_BASE = {
  turnstileToken: "valid-token",
  productInquiryKind: PRODUCT_INQUIRY_KINDS.GENERAL_RFQ,
  fullName: "Ada Buyer",
  email: "ada@example.com",
} as const;

describe("canonical inquiry contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLead.mockResolvedValue({ id: "rec-canonical-001" });
    mockSendProductInquiryEmail.mockResolvedValue("email-canonical-001");
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("accepts only fullName and email with phone/message omitted or blank", async () => {
    for (const extra of [
      {},
      { phone: undefined, message: undefined },
      { phone: "", message: "   " },
    ]) {
      const parsed = productLeadSchema.safeParse({
        type: LEAD_TYPES.PRODUCT,
        ...GENERAL_RFQ_BASE,
        ...extra,
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.phone).toBeUndefined();
        expect(parsed.data.message).toBeUndefined();
      }
    }

    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        phone: "  ",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns field-level details when fullName or email is missing", async () => {
    const { POST } = await loadInquiryRoute();

    for (const payload of [
      { ...GENERAL_RFQ_BASE, fullName: "" },
      { ...GENERAL_RFQ_BASE, email: "not-an-email" },
    ]) {
      const response = await POST(makeInquiryRequest(payload));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.errorCode).toBe(API_ERROR_CODES.INQUIRY_VALIDATION_FAILED);
      expect(body.details?.length).toBeGreaterThan(0);
    }
  });

  it("drops extra phone before processLead, email, and Airtable", async () => {
    const parsed = productLeadSchema.safeParse({
      type: LEAD_TYPES.PRODUCT,
      ...GENERAL_RFQ_BASE,
      phone: "+8613800138000",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("phone");
    }

    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        phone: "+8613800138000",
        message: "Need pricing",
      }),
    );

    expect(response.status).toBe(200);

    const emailPayload = mockSendProductInquiryEmail.mock.calls[0]?.[0];
    expect(emailPayload).toBeDefined();
    expect(emailPayload).not.toHaveProperty("phone");

    const airtablePayload = mockCreateLead.mock.calls[0]?.[1];
    expect(airtablePayload).toBeDefined();
    expect(airtablePayload).not.toHaveProperty("phone");
  });

  it("does not log buyer phone from extra payload field", async () => {
    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        phone: "+8613800138000",
        message: "Need pricing",
      }),
    );

    expect(response.status).toBe(200);

    const loggedPayloads = [
      ...logger.info.mock.calls,
      ...logger.warn.mock.calls,
      ...logger.error.mock.calls,
    ].flatMap((call) => call.slice(1));

    for (const payload of loggedPayloads) {
      expect(JSON.stringify(payload)).not.toContain("+8613800138000");
    }
  });

  it("preserves multiline message through schema, Airtable requirements, and owner email", async () => {
    const message = "Line one\nLine two";
    const parsed = productLeadSchema.parse({
      type: LEAD_TYPES.PRODUCT,
      ...GENERAL_RFQ_BASE,
      message,
    });

    await processLead(parsed);

    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.PRODUCT,
      expect.objectContaining({ requirements: message }),
    );
    expect(mockSendProductInquiryEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        requirements: message,
      }),
    );
  });

  it("accepts a general inquiry without product context", async () => {
    const { POST } = await loadInquiryRoute();
    const response = await POST(makeInquiryRequest(GENERAL_RFQ_BASE));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("rejects an invalid catalog product id before lead processing", async () => {
    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
        catalogProductId: "not-a-real-product",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe(API_ERROR_CODES.INQUIRY_VALIDATION_FAILED);
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockSendProductInquiryEmail).not.toHaveBeenCalled();
  });

  it("passes attribution fields through the inquiry route into processLead", async () => {
    const { POST } = await loadInquiryRoute();
    await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        utmSource: "google",
        utmMedium: "cpc",
        gclid: "gclid-123",
        landingPage: "/request-quote",
      }),
    );

    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.PRODUCT,
      expect.objectContaining({
        utmSource: "google",
        utmMedium: "cpc",
        gclid: "gclid-123",
        landingPage: "/request-quote",
      }),
    );
  });

  it("returns success when only email succeeds and fails when both channels fail", async () => {
    mockCreateLead.mockRejectedValue(new Error("airtable down"));

    const emailOnly = await processLead(
      productLeadSchema.parse({
        type: LEAD_TYPES.PRODUCT,
        ...GENERAL_RFQ_BASE,
      }),
    );
    expect(emailOnly.success).toBe(true);
    expect(emailOnly.recordCreated).toBe(false);
    expect(emailOnly.emailSent).toBe(true);

    mockCreateLead.mockRejectedValue(new Error("airtable down"));
    mockSendProductInquiryEmail.mockRejectedValue(new Error("email down"));

    const bothFail = await processLead(
      productLeadSchema.parse({
        type: LEAD_TYPES.PRODUCT,
        ...GENERAL_RFQ_BASE,
      }),
    );
    expect(bothFail.success).toBe(false);
    expect(bothFail.error).toBe("PROCESSING_FAILED");
  });

  it("maps legacy requirements into canonical message without phone", async () => {
    const { POST } = await loadInquiryRoute();
    const response = await POST(
      makeInquiryRequest({
        ...GENERAL_RFQ_BASE,
        requirements: "Legacy RFQ note",
      }),
    );

    expect(response.status).toBe(200);

    const airtablePayload = mockCreateLead.mock.calls[0]?.[1];
    expect(airtablePayload).toBeDefined();
    expect(airtablePayload).toHaveProperty("requirements", "Legacy RFQ note");
    expect(airtablePayload).not.toHaveProperty("phone");
  });

  it("accepts canonical message when legacy requirements is oversized or conflicting", async () => {
    const { POST } = await loadInquiryRoute();

    for (const requirements of ["X".repeat(2500), "Conflicting legacy note"]) {
      const response = await POST(
        makeInquiryRequest({
          ...GENERAL_RFQ_BASE,
          message: "Canonical buyer text",
          requirements,
        }),
      );

      expect(response.status).toBe(200);
    }

    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.PRODUCT,
      expect.objectContaining({
        requirements: "Canonical buyer text",
      }),
    );
  });
});
