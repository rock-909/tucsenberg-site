import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as route from "@/app/api/subscribe/route";
import { API_ERROR_CODES } from "@/constants/api-error-codes";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 3,
    resetTime: Date.now() + 60000,
    retryAfter: null,
  })),
  createRateLimitHeaders: vi.fn(() => new Headers()),
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: vi.fn(async () => true),
  verifyTurnstileDetailed: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/lead-pipeline/process-lead", () => ({
  processLead: vi.fn(async () => ({
    success: true,
    outcome: "success",
    referenceId: "ref-123",
    recordCreated: true,
    emailSent: false,
    ownerNotified: false,
  })),
}));

const makeReq = (body: unknown, headers: HeadersInit = {}) =>
  new NextRequest(
    new Request("http://localhost/api/subscribe", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(headers as Record<string, string>),
      },
    }),
  );

describe("api/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles malformed payload gracefully (returns JSON response)", async () => {
    const malformedReq = new NextRequest(
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        body: "this is not json",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const res = await route.POST(malformedReq);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe(API_ERROR_CODES.INVALID_JSON_BODY);
  });

  it("returns 413 when payload exceeds the shared JSON body limit", async () => {
    const req = new NextRequest(
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email: "ok@example.com",
          turnstileToken: "valid-token",
        }),
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "70000",
        },
      }),
    );

    const res = await route.POST(req);
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe(API_ERROR_CODES.PAYLOAD_TOO_LARGE);
  });

  it("accepts valid email without a replay key", async () => {
    const req = new NextRequest(
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email: "ok@example.com",
          turnstileToken: "valid-token",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await route.POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("processes repeated valid subscribe requests independently", async () => {
    const leadPipeline = await import("@/lib/lead-pipeline/process-lead");
    const res1 = await route.POST(
      makeReq({ email: "ok@example.com", turnstileToken: "valid-token" }),
    );
    expect(res1.status).toBe(200);
    const res2 = await route.POST(
      makeReq({ email: "ok@example.com", turnstileToken: "valid-token" }),
    );
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.success).toBe(true);
    expect(vi.mocked(leadPipeline.processLead)).toHaveBeenCalledTimes(2);
  });

  it("binds Turnstile verification to the newsletter_subscribe action", async () => {
    const utils = await import("@/lib/security/turnstile");

    await route.POST(
      makeReq({ email: "ok@example.com", turnstileToken: "valid-token" }),
    );

    expect(utils.verifyTurnstileDetailed).toHaveBeenCalledWith(
      "valid-token",
      expect.any(String),
      { expectedAction: "newsletter_subscribe" },
    );
  });

  it("returns 400 when turnstileToken is missing", async () => {
    const res = await route.POST(makeReq({ email: "test@example.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe(API_ERROR_CODES.SUBSCRIBE_SECURITY_REQUIRED);
  });

  it("returns 400 when turnstile verification fails", async () => {
    const utils = await import("@/lib/security/turnstile");
    (
      utils.verifyTurnstileDetailed as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      success: false,
      errorCodes: ["invalid-input-response"],
    });

    const res = await route.POST(
      makeReq({ email: "test@example.com", turnstileToken: "invalid-token" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe(API_ERROR_CODES.SUBSCRIBE_SECURITY_FAILED);
  });

  it("returns 503 when turnstile verification is unavailable", async () => {
    const utils = await import("@/lib/security/turnstile");
    (
      utils.verifyTurnstileDetailed as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      success: false,
      errorCodes: ["network-error"],
    });

    const res = await route.POST(
      makeReq({ email: "test@example.com", turnstileToken: "invalid-token" }),
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe(API_ERROR_CODES.SERVICE_UNAVAILABLE);
  });

  it("returns success when the newsletter record is created", async () => {
    const leadPipeline = await import("@/lib/lead-pipeline/process-lead");
    vi.mocked(leadPipeline.processLead).mockResolvedValueOnce({
      success: true,
      referenceId: "ref-record-123",
      recordCreated: true,
      emailSent: false,
      ownerNotified: false,
    });

    const res = await route.POST(
      makeReq({ email: "test@example.com", turnstileToken: "valid-token" }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      success: true,
      data: {
        referenceId: "ref-record-123",
      },
    });
    expect(json.errorCode).toBeUndefined();
    expect(json.data).not.toHaveProperty("partialSuccess");
  });

  it("returns 429 when rate limited", async () => {
    const rateLimit = await import("@/lib/security/distributed-rate-limit");
    (
      rateLimit.checkDistributedRateLimit as ReturnType<typeof vi.fn>
    ).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    });

    const res = await route.POST(
      makeReq({ email: "test@example.com", turnstileToken: "valid-token" }),
    );
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it("returns 400 when email is missing", async () => {
    const res = await route.POST(makeReq({ turnstileToken: "valid-token" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe(
      API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_REQUIRED,
    );
  });
});
