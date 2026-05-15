/**
 * Product Inquiry API — Integration Tests
 *
 * Tests POST /api/inquiry route ordering with service boundaries mocked:
 * - Rate limit store (external/shared storage boundary)
 * - Turnstile verification (Cloudflare API)
 * - Lead pipeline (Resend email + Airtable CRM)
 *
 * Route-local protection ordering runs as real code:
 * - Rate limiting (via withRateLimit HOF)
 * - JSON parsing + validation
 * - Turnstile token presence check
 * - No starter-default replay-key requirement
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { processLead } from "@/lib/lead-pipeline/process-lead";
import {
  verifyTurnstile,
  verifyTurnstileDetailed,
} from "@/lib/security/turnstile";
import { POST } from "../route";

vi.unmock("zod");

// ── External service mocks ──────────────────────────────────────────

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

// Rate limiting — allow by default (backed by external KV store)
vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 5,
    resetTime: Date.now() + 60000,
    retryAfter: null,
  })),
  createRateLimitHeaders: vi.fn(() => new Headers()),
}));

// Turnstile — external Cloudflare API
vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(true)),
  verifyTurnstileDetailed: vi.fn(() => Promise.resolve({ success: true })),
}));

// Lead pipeline — external services (Resend + Airtable)
vi.mock("@/lib/lead-pipeline/process-lead", () => ({
  processLead: vi.fn(() =>
    Promise.resolve({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-integration-001",
    }),
  ),
}));

// CORS utilities
vi.mock("@/lib/api/cors-utils", () => ({
  applyCorsHeaders: vi.fn(
    ({ response }: { response: any; request: NextRequest }) => response,
  ),
  createCorsPreflightResponse: vi.fn(
    () => new (require("next/server").NextResponse)(null, { status: 200 }),
  ),
}));

// ── Helpers ─────────────────────────────────────────────────────────

function validInquiryData() {
  return {
    turnstileToken: "valid-turnstile-token",
    type: "product",
    fullName: "Bob Wang",
    email: "bob@example.com",
    company: "BuildCo Ltd.",
    productSlug: "sample-product-25mm",
    productName: "Example Offer 25",
    quantity: "1000",
    requirements:
      "Interested in example offer configuration for warehouse project.",
  };
}

function createRequest(
  body: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest("http://localhost:3000/api/inquiry", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.50",
      ...headers,
    },
  });
}

// ── Tests ───────────────────────────────────────────────────────────

describe("/api/inquiry — integration (protection chain)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  describe("Happy path — full chain succeeds", () => {
    it("rate limit → JSON parse → turnstile check → processLead → success", async () => {
      const request = createRequest(validInquiryData());

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.referenceId).toBe("ref-integration-001");

      // Protection chain was invoked in order
      const { checkDistributedRateLimit } =
        await import("@/lib/security/distributed-rate-limit");
      expect(checkDistributedRateLimit).toHaveBeenCalledTimes(1);
      expect(verifyTurnstileDetailed).toHaveBeenCalledWith(
        "valid-turnstile-token",
        expect.any(String),
        { expectedAction: "product_inquiry" },
      );
      expect(processLead).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "product",
          email: "bob@example.com",
        }),
      );
      expect(response.headers.get("x-request-id")).toBeNull();
      expect(response.headers.get("x-observability-surface")).toBeNull();
    });

    it("should exclude turnstileToken from lead data passed to processLead", async () => {
      const request = createRequest(validInquiryData());

      await POST(request);

      const callArgs = vi.mocked(processLead).mock.calls[0]![0];
      expect(callArgs).not.toHaveProperty("turnstileToken");
    });
  });

  describe("Protection chain — each gate blocks when triggered", () => {
    it("rate limit gate returns 429 before any other processing", async () => {
      const { checkDistributedRateLimit } =
        await import("@/lib/security/distributed-rate-limit");
      vi.mocked(checkDistributedRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = createRequest(validInquiryData());
      const response = await POST(request);

      expect(response.status).toBe(429);
      // Turnstile and processLead should NOT be called
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("invalid JSON returns 400 before turnstile check", async () => {
      const request = createRequest("not valid json {{{");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INVALID_JSON_BODY);
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("missing turnstile token returns 400 with INQUIRY_SECURITY_REQUIRED", async () => {
      const body = validInquiryData();
      delete (body as Record<string, unknown>).turnstileToken;
      const request = createRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_SECURITY_REQUIRED);
      expect(processLead).not.toHaveBeenCalled();
    });

    it("turnstile verification failure returns 400 with INQUIRY_SECURITY_FAILED", async () => {
      vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);
      vi.mocked(verifyTurnstileDetailed).mockResolvedValueOnce({
        success: false,
      });

      const request = createRequest(validInquiryData());
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_SECURITY_FAILED);
      // processLead should NOT be called
      expect(processLead).not.toHaveBeenCalled();
    });

    it("processLead failure returns 500 with INQUIRY_PROCESSING_ERROR", async () => {
      vi.mocked(processLead).mockResolvedValueOnce({
        success: false,
        error: "PROCESSING_ERROR",
        emailSent: false,
        ownerNotified: false,
        recordCreated: false,
      });

      const request = createRequest(validInquiryData());
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_PROCESSING_ERROR);
    });
  });

  describe("Protection chain ordering — earlier gates short-circuit later ones", () => {
    it("rate limit failure prevents turnstile and processLead even with valid data", async () => {
      const { checkDistributedRateLimit } =
        await import("@/lib/security/distributed-rate-limit");
      vi.mocked(checkDistributedRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = createRequest(validInquiryData());
      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });

    it("invalid JSON prevents turnstile check even when rate limit passes", async () => {
      const request = new NextRequest("http://localhost:3000/api/inquiry", {
        method: "POST",
        body: "{{bad json}}",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.50",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(processLead).not.toHaveBeenCalled();
    });
  });

  describe("Unexpected errors", () => {
    it("processLead throwing returns 500 with INQUIRY_PROCESSING_ERROR", async () => {
      vi.mocked(processLead).mockRejectedValueOnce(
        new Error("Network timeout"),
      );

      const request = createRequest(validInquiryData());
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe(API_ERROR_CODES.INQUIRY_PROCESSING_ERROR);
    });
  });
});
