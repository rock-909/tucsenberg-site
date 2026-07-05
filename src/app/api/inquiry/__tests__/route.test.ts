import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { processLead } from "@/lib/lead-pipeline/process-lead";
import {
  verifyTurnstile,
  verifyTurnstileDetailed,
} from "@/lib/security/turnstile";
import { OPTIONS, POST } from "../route";

// Mock dependencies before imports
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  sanitizeIP: (ip: string | undefined | null) =>
    ip ? "[REDACTED_IP]" : "[NO_IP]",
  sanitizeEmail: (email: string | undefined | null) =>
    email ? "[REDACTED_EMAIL]" : "[NO_EMAIL]",
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 5,
    resetTime: Date.now() + 60000,
    retryAfter: null,
  })),
  createRateLimitHeaders: vi.fn(() => new Headers()),
}));

vi.mock("@/lib/lead-pipeline/process-lead", () => ({
  processLead: vi.fn(() =>
    Promise.resolve({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-123",
    }),
  ),
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(true)),
  verifyTurnstileDetailed: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock CORS utilities
vi.mock("@/lib/api/cors-utils", () => ({
  applyCorsHeaders: vi.fn(
    ({ response, request }: { response: any; request: NextRequest }) => {
      const origin = request.headers.get("origin");
      if (origin) {
        response.headers.set("Access-Control-Allow-Origin", origin);
      }
      return response;
    },
  ),
  createCorsPreflightResponse: vi.fn((request: NextRequest) => {
    const origin = request.headers.get("origin");
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
    return new (require("next/server").NextResponse)(null, {
      status: 200,
      headers,
    });
  }),
}));

describe("/api/inquiry route", () => {
  function createInquiryRequest(
    body: BodyInit | null,
    headers: Record<string, string> = {},
  ): NextRequest {
    return new NextRequest("http://localhost:3000/api/inquiry", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("POST", () => {
    const validInquiryData = {
      turnstileToken: "valid-token",
      type: "product",
      fullName: "John Doe",
      email: "john@example.com",
      company: "Acme Inc",
      productSlug: "example-product",
      productName: "Example Product",
      quantity: "100",
      requirements: "I am interested in your products.",
    };

    it("should process valid inquiry successfully", async () => {
      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.referenceId).toBe("ref-123");
      expect(processLead).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "product",
          email: "john@example.com",
          productSlug: "example-product",
          productName: "Example Product",
        }),
      );
      expect(response.headers.get("x-request-id")).toBeNull();
      expect(response.headers.get("x-observability-surface")).toBeNull();
    });

    it("passes attribution fields to processLead", async () => {
      const request = createInquiryRequest(
        JSON.stringify({
          ...validInquiryData,
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "flood-barriers",
          gclid: "gclid-rfq-123",
          landingPage: "/en/request-quote",
          capturedAt: "2026-07-04T00:00:00.000Z",
        }),
      );

      await POST(request);

      expect(processLead).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "product",
          utmSource: "google",
          utmMedium: "cpc",
          utmCampaign: "flood-barriers",
          gclid: "gclid-rfq-123",
          landingPage: "/en/request-quote",
          capturedAt: "2026-07-04T00:00:00.000Z",
        }),
      );
    });

    it("binds Turnstile verification to the product_inquiry action", async () => {
      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      await POST(request);

      expect(verifyTurnstileDetailed).toHaveBeenCalledWith(
        "valid-token",
        expect.any(String),
        { expectedAction: "product_inquiry" },
      );
    });

    it("should apply CORS headers on POST response when Origin is present", async () => {
      const origin = "http://localhost:3000";
      const request = createInquiryRequest(JSON.stringify(validInquiryData), {
        origin,
      });

      const response = await POST(request);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    });

    it("should return 429 when rate limited", async () => {
      const rateLimit = await import("@/lib/security/distributed-rate-limit");
      vi.mocked(rateLimit.checkDistributedRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
    });

    it("should return 400 for invalid JSON", async () => {
      const request = createInquiryRequest("invalid json");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should process valid inquiry without a replay key", async () => {
      const request = new NextRequest("http://localhost:3000/api/inquiry", {
        method: "POST",
        body: JSON.stringify(validInquiryData),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(processLead).toHaveBeenCalledTimes(1);
    });

    it("should return 413 when payload exceeds the shared JSON body limit", async () => {
      const request = createInquiryRequest(JSON.stringify(validInquiryData), {
        "Content-Length": "70000",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(413);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.PAYLOAD_TOO_LARGE);
    });

    it("should process repeated valid inquiry requests independently", async () => {
      const firstRequest = createInquiryRequest(
        JSON.stringify(validInquiryData),
      );
      const secondRequest = createInquiryRequest(
        JSON.stringify(validInquiryData),
      );

      const firstResponse = await POST(firstRequest);
      const secondResponse = await POST(secondRequest);
      const firstData = await firstResponse.json();
      const secondData = await secondResponse.json();

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      expect(firstData.success).toBe(true);
      expect(secondData.success).toBe(true);
      expect(processLead).toHaveBeenCalledTimes(2);
    });

    it("should return 400 when turnstile token is missing", async () => {
      const dataWithoutToken = { ...validInquiryData };
      delete (dataWithoutToken as { turnstileToken?: string }).turnstileToken;

      const request = createInquiryRequest(JSON.stringify(dataWithoutToken));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_SECURITY_REQUIRED);
    });

    it("treats a whitespace-only turnstile token as missing without verification or lead processing", async () => {
      const request = createInquiryRequest(
        JSON.stringify({ ...validInquiryData, turnstileToken: "   " }),
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_SECURITY_REQUIRED,
      });
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should reject invalid email before turnstile and lead processing", async () => {
      const request = createInquiryRequest(
        JSON.stringify({ ...validInquiryData, email: "not-an-email" }),
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        details: ["errors.email.invalid"],
      });
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should report missing required identity fields before turnstile and lead processing", async () => {
      function omitInquiryField(field: "fullName" | "email") {
        const body: Record<string, unknown> = { ...validInquiryData };
        delete body[field];
        return body;
      }

      const missingFieldCases = [
        {
          field: "fullName" as const,
          expectedDetails: ["errors.fullName.required"],
        },
        {
          field: "email" as const,
          expectedDetails: ["errors.email.required"],
        },
      ];

      const results = [];

      for (const { field, expectedDetails } of missingFieldCases) {
        const request = createInquiryRequest(
          JSON.stringify(omitInquiryField(field)),
        );

        const response = await POST(request);
        const data = await response.json();

        results.push({
          status: response.status,
          data,
          expectedDetails,
        });
      }

      expect(results).toEqual(
        missingFieldCases.map(({ expectedDetails }) => ({
          status: 400,
          data: {
            success: false,
            errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
            details: expectedDetails,
          },
          expectedDetails,
        })),
      );
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should treat blank required inquiry fields as required before turnstile and lead processing", async () => {
      const blankRequiredFieldCases = [
        {
          field: "fullName",
          expectedDetails: ["errors.fullName.required"],
        },
        {
          field: "email",
          expectedDetails: ["errors.email.required"],
        },
        {
          field: "productSlug",
          expectedDetails: ["errors.productSlug.required"],
        },
        {
          field: "productName",
          expectedDetails: ["errors.productName.required"],
        },
        {
          field: "quantity",
          expectedDetails: ["errors.quantity.required"],
        },
      ] as const;

      const results = [];

      for (const { field, expectedDetails } of blankRequiredFieldCases) {
        const request = createInquiryRequest(
          JSON.stringify({ ...validInquiryData, [field]: "   " }),
        );

        const response = await POST(request);
        const data = await response.json();

        results.push({
          status: response.status,
          data,
          expectedDetails,
        });
      }

      expect(results).toEqual(
        blankRequiredFieldCases.map(({ expectedDetails }) => ({
          status: 400,
          data: {
            success: false,
            errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
            details: expectedDetails,
          },
          expectedDetails,
        })),
      );
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should reject a missing product identity before lead processing", async () => {
      const request = createInquiryRequest(
        JSON.stringify({
          ...validInquiryData,
          productSlug: "",
          productName: "",
        }),
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        details: ["errors.productSlug.required", "errors.productName.required"],
      });
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should reject missing quantity before turnstile and lead processing", async () => {
      const dataWithoutQuantity: Record<string, unknown> = {
        ...validInquiryData,
      };
      delete dataWithoutQuantity.quantity;

      const request = createInquiryRequest(JSON.stringify(dataWithoutQuantity));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        details: ["errors.quantity.required"],
      });
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should reject a non-positive numeric quantity", async () => {
      const request = createInquiryRequest(
        JSON.stringify({ ...validInquiryData, quantity: "0" }),
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        errorCode: API_ERROR_CODES.INQUIRY_VALIDATION_FAILED,
        details: ["errors.quantity.invalid"],
      });
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should return 400 when turnstile verification fails", async () => {
      vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);
      vi.mocked(verifyTurnstileDetailed).mockResolvedValueOnce({
        success: false,
      });

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_SECURITY_FAILED);
    });

    it("should return 503 when turnstile verification is unavailable", async () => {
      vi.mocked(verifyTurnstileDetailed).mockResolvedValueOnce({
        success: false,
        errorCodes: ["timeout"],
      });

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.SERVICE_UNAVAILABLE);
      expect(processLead).not.toHaveBeenCalled();
    });

    it("should handle processLead failure", async () => {
      vi.mocked(processLead).mockResolvedValueOnce({
        success: false,
        error: "PROCESSING_ERROR",
        emailSent: false,
        ownerNotified: false,
        recordCreated: false,
      });

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_PROCESSING_ERROR);
    });

    it("should return success when the record is created but email fails", async () => {
      vi.mocked(processLead).mockResolvedValueOnce({
        success: true,
        emailSent: false,
        ownerNotified: false,
        recordCreated: true,
        referenceId: "ref-record-123",
      });

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          referenceId: "ref-record-123",
        },
      });
      expect(data.errorCode).toBeUndefined();
      expect(data.data).not.toHaveProperty("partialSuccess");
    });

    it("should return processing error when the record is not created", async () => {
      vi.mocked(processLead).mockResolvedValueOnce({
        success: false,
        emailSent: false,
        ownerNotified: false,
        recordCreated: false,
        error: "PROCESSING_FAILED",
      });

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_PROCESSING_ERROR);
      expect(data.data).toBeUndefined();
    });

    it("should handle validation error from processLead", async () => {
      vi.mocked(processLead).mockResolvedValueOnce({
        success: false,
        error: "VALIDATION_ERROR",
        emailSent: false,
        ownerNotified: false,
        recordCreated: false,
      });

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_VALIDATION_FAILED);
    });

    it("should handle unexpected errors", async () => {
      vi.mocked(processLead).mockRejectedValueOnce(
        new Error("Unexpected error"),
      );

      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_PROCESSING_ERROR);
    });

    it("should pass lead type product to processLead", async () => {
      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      await POST(request);

      expect(processLead).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "product",
        }),
      );
    });

    it("should not allow request body to override lead type", async () => {
      const request = createInquiryRequest(
        JSON.stringify({
          ...validInquiryData,
          type: "contact",
        }),
      );

      await POST(request);

      expect(processLead).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "product",
        }),
      );
    });

    it("should exclude turnstileToken from lead data", async () => {
      const request = createInquiryRequest(JSON.stringify(validInquiryData));

      await POST(request);

      const callArgs = vi.mocked(processLead).mock.calls[0]![0];
      expect(callArgs).not.toHaveProperty("turnstileToken");
    });
  });

  describe("OPTIONS", () => {
    it("should return 200 with CORS headers for allowed origin", async () => {
      const request = new NextRequest("http://localhost:3000/api/inquiry", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          Host: "localhost:3000",
        },
      });

      const response = OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000",
      );
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
        "POST",
      );
    });

    it("should return empty body", async () => {
      const request = new NextRequest("http://localhost:3000/api/inquiry", {
        method: "OPTIONS",
        headers: { Host: "localhost:3000" },
      });

      const response = OPTIONS(request);
      const body = await response.text();

      expect(body).toBe("");
    });
  });
});
