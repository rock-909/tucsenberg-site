/**
 * RFQ Quote API — Integration Tests
 *
 * Tests the full POST /api/quote chain with only external services mocked:
 * - Turnstile verification (Cloudflare API)
 * - Lead pipeline (Resend email + Airtable CRM)
 *
 * Internal protection chain runs as real code:
 * - Rate limiting (via withRateLimit HOF)
 * - JSON parsing + rfqLeadSchema validation
 * - Turnstile token presence check
 */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import { processLead } from "@/lib/lead-pipeline/process-lead";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";
import {
  MAX_LEAD_PART_NUMBERS_LENGTH,
  MAX_LEAD_REQUIREMENTS_LENGTH,
  MAX_LEAD_SOURCE_CONTEXT_LENGTH,
} from "@/constants";
import { POST } from "../route";

vi.unmock("zod");

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
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

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn(() => Promise.resolve(true)),
  verifyTurnstileDetailed: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock("@/lib/lead-pipeline/process-lead", () => ({
  processLead: vi.fn(() =>
    Promise.resolve({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-quote-001",
    }),
  ),
}));

vi.mock("@/lib/api/cors-utils", () => ({
  applyCorsHeaders: vi.fn(
    ({ response }: { response: unknown; request: NextRequest }) => response,
  ),
  createCorsPreflightResponse: vi.fn(
    () =>
      new (require("next/server").NextResponse)(null, {
        status: 200,
      }),
  ),
}));

function validRfqData() {
  return {
    turnstileToken: "valid-turnstile-token",
    type: "rfq",
    fullName: "Dana Ortiz",
    email: "dana@watertreat.example",
    company: "WaterTreat O&M",
    country: "United States",
    partNumbers: "00223, AFD270-E",
    quantity: "240 discs",
    material: "epdm",
    shutdownDate: "Scheduled outage in 6 weeks",
    notes: "Need confirmed compatibility before the maintenance window.",
  };
}

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/quote", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.50",
    },
  });
}

describe("/api/quote — RFQ submission (protection chain)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("accepts a valid submission and returns a reference id", async () => {
    const response = await POST(createRequest(validRfqData()));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.referenceId).toBe("ref-quote-001");
    expect(verifyTurnstileDetailed).toHaveBeenCalledWith(
      "valid-turnstile-token",
      expect.any(String),
      { expectedAction: "rfq_quote" },
    );
    expect(processLead).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "product",
        email: "dana@watertreat.example",
        productSlug: "rfq-quote-request",
      }),
    );
  });

  it("excludes the turnstile token from the lead payload", async () => {
    await POST(createRequest(validRfqData()));
    const callArgs = vi.mocked(processLead).mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    expect(callArgs).not.toHaveProperty("turnstileToken");
  });

  it("rejects a submission missing the Turnstile token", async () => {
    const body = validRfqData();
    delete (body as { turnstileToken?: string }).turnstileToken;

    const response = await POST(createRequest(body));

    expect(response.status).toBe(400);
    expect(processLead).not.toHaveBeenCalled();
  });

  it("rejects a normal Turnstile verification failure with 400 and never calls processLead", async () => {
    // A returned-but-invalid token (e.g. user failed the challenge or the
    // token is stale) is a client error. The route maps non-service Turnstile
    // failure codes to HTTP 400 and must NOT enter the lead pipeline.
    vi.mocked(verifyTurnstileDetailed).mockResolvedValueOnce({
      success: false,
      errorCodes: ["invalid-input-response"],
    });

    const response = await POST(createRequest(validRfqData()));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errorCode).toBe("INQUIRY_SECURITY_FAILED");
    expect(verifyTurnstileDetailed).toHaveBeenCalledTimes(1);
    expect(processLead).not.toHaveBeenCalled();
  });

  it("maps a Turnstile service outage to 503 and never calls processLead", async () => {
    // Cloudflare Turnstile being unreachable (network error / timeout /
    // unconfigured) is an infrastructure failure, not a buyer mistake. The
    // route maps these to HTTP 503 and must NOT enter the lead pipeline so a
    // legitimate RFQ is not silently dropped against a broken anti-abuse hop.
    vi.mocked(verifyTurnstileDetailed).mockResolvedValueOnce({
      success: false,
      errorCodes: ["network-error"],
    });

    const response = await POST(createRequest(validRfqData()));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.errorCode).toBe("SERVICE_UNAVAILABLE");
    expect(verifyTurnstileDetailed).toHaveBeenCalledTimes(1);
    expect(processLead).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const response = await POST(
      createRequest({ ...validRfqData(), email: "not-an-email" }),
    );

    expect(response.status).toBe(400);
    expect(processLead).not.toHaveBeenCalled();
  });

  it("rejects missing required fields (fullName, partNumbers)", async () => {
    const body = validRfqData();
    delete (body as { fullName?: string }).fullName;
    delete (body as { partNumbers?: string }).partNumbers;

    const response = await POST(createRequest(body));

    expect(response.status).toBe(400);
    expect(processLead).not.toHaveBeenCalled();
  });

  it("caps composed requirements so a max-length RFQ is not dropped on re-validation", async () => {
    // partNumbers (≤500) + notes (≤2000) are each individually valid under
    // rfqLeadSchema, but the composed `requirements` block would exceed the
    // product lead cap and be silently rejected by processLead's
    // re-validation. The route must cap the composed value instead.
    const body = {
      ...validRfqData(),
      partNumbers: "A".repeat(MAX_LEAD_PART_NUMBERS_LENGTH),
      notes: "B".repeat(MAX_LEAD_REQUIREMENTS_LENGTH),
    };

    const response = await POST(createRequest(body));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(processLead).toHaveBeenCalledTimes(1);

    const leadArg = vi.mocked(processLead).mock.calls[0]![0] as {
      requirements: string;
    };
    expect(leadArg.requirements.length).toBeLessThanOrEqual(
      MAX_LEAD_REQUIREMENTS_LENGTH,
    );
  });

  it("folds source brand/model/product context into composed requirements", async () => {
    const body = {
      ...validRfqData(),
      sourceBrand: "Sanitaire",
      sourceModel: "Silver Series II 9 inch Disc",
      sourceProduct: "Tucsenberg 9-inch EPDM Disc Membrane",
    };

    const response = await POST(createRequest(body));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    const leadArg = vi.mocked(processLead).mock.calls[0]![0] as {
      requirements: string;
    };
    expect(leadArg.requirements).toContain("Source brand: Sanitaire");
    expect(leadArg.requirements).toContain(
      "Source model: Silver Series II 9 inch Disc",
    );
    expect(leadArg.requirements).toContain(
      "Source product: Tucsenberg 9-inch EPDM Disc Membrane",
    );
  });

  it("omits source context lines when the buyer arrived without them", async () => {
    const response = await POST(createRequest(validRfqData()));

    expect(response.status).toBe(200);
    const leadArg = vi.mocked(processLead).mock.calls[0]![0] as {
      requirements: string;
    };
    expect(leadArg.requirements).not.toContain("Source brand:");
    expect(leadArg.requirements).not.toContain("Source model:");
    expect(leadArg.requirements).not.toContain("Source product:");
  });

  it("keeps the requirements cap with source context lines added", async () => {
    const body = {
      ...validRfqData(),
      partNumbers: "A".repeat(MAX_LEAD_PART_NUMBERS_LENGTH),
      notes: "B".repeat(MAX_LEAD_REQUIREMENTS_LENGTH),
      sourceBrand: "C".repeat(MAX_LEAD_SOURCE_CONTEXT_LENGTH),
      sourceModel: "D".repeat(MAX_LEAD_SOURCE_CONTEXT_LENGTH),
      sourceProduct: "E".repeat(MAX_LEAD_SOURCE_CONTEXT_LENGTH),
    };

    const response = await POST(createRequest(body));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(processLead).toHaveBeenCalledTimes(1);

    const leadArg = vi.mocked(processLead).mock.calls[0]![0] as {
      requirements: string;
    };
    expect(leadArg.requirements.length).toBeLessThanOrEqual(
      MAX_LEAD_REQUIREMENTS_LENGTH,
    );
  });

  it("excludes the turnstile token even with source context present", async () => {
    await POST(
      createRequest({
        ...validRfqData(),
        sourceBrand: "Sanitaire",
        sourceModel: "Silver Series II",
        sourceProduct: "Tucsenberg Disc",
      }),
    );
    const callArgs = vi.mocked(processLead).mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    expect(callArgs).not.toHaveProperty("turnstileToken");
    expect(callArgs).not.toHaveProperty("sourceBrand");
  });

  it("still returns success but warns when the owner notification did not send", async () => {
    // security.md contract: Airtable record created = success; owner-email
    // failure is internal-only. The buyer must still get success, but the
    // degraded notification must be observable so RFQs are not lost silently.
    vi.mocked(processLead).mockResolvedValueOnce({
      success: true,
      emailSent: false,
      ownerNotified: false,
      recordCreated: true,
      referenceId: "ref-quote-degraded",
    });

    const response = await POST(createRequest(validRfqData()));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.referenceId).toBe("ref-quote-degraded");
    expect(logger.warn).toHaveBeenCalledWith(
      "RFQ recorded but owner notification did not send",
      expect.objectContaining({
        referenceId: "ref-quote-degraded",
        emailSent: false,
        ownerNotified: false,
      }),
    );
  });

  it("never sends raw buyer part numbers as productName (keeps them only in requirements)", async () => {
    // resend-core logs `product: data.productName` on owner-email failure.
    // Buyer part numbers / OEM models are sensitive commercial info and must
    // never ride productName into centralized error logs. They stay only in
    // `requirements` (Airtable + email body), so the owner still gets them.
    const sensitiveParts = "00223, AFD270-E, WO-SECRET-9981";
    await POST(
      createRequest({ ...validRfqData(), partNumbers: sensitiveParts }),
    );

    const leadArg = vi.mocked(processLead).mock.calls[0]![0] as {
      productName: string;
      requirements: string;
    };

    expect(leadArg.productName).toBe("RFQ quote request");
    expect(leadArg.productName).not.toContain("00223");
    expect(leadArg.productName).not.toContain("AFD270-E");
    expect(leadArg.productName).not.toContain("WO-SECRET-9981");
    // Owner still receives the full part numbers via requirements.
    expect(leadArg.requirements).toContain(
      `Part number(s) / OEM model: ${sensitiveParts}`,
    );
  });

  it("returns 429 when the rate-limit gate trips first", async () => {
    const { checkDistributedRateLimit } =
      await import("@/lib/security/distributed-rate-limit");
    vi.mocked(checkDistributedRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    });

    const response = await POST(createRequest(validRfqData()));

    expect(response.status).toBe(429);
    expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
    expect(processLead).not.toHaveBeenCalled();
  });
});
