import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { processLead } from "@/lib/lead-pipeline/process-lead";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";
import { OPTIONS, POST } from "../route";

vi.unmock("zod");

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
    referenceId: "sub-ref-001",
    recordCreated: true,
    emailSent: false,
    ownerNotified: false,
  })),
}));

function makeSubscribeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(
    new Request("http://localhost/api/subscribe", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }),
  );
}

describe("/api/subscribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid JSON before Turnstile verification", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/subscribe", {
        method: "POST",
        body: "{bad json",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.INVALID_JSON_BODY,
    });
    expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
    expect(processLead).not.toHaveBeenCalled();
  });

  it("does not require replay keys for valid starter subscriptions", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email: "subscriber@example.com",
          turnstileToken: "valid-token",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        referenceId: "sub-ref-001",
      },
    });
    expect(processLead).toHaveBeenCalledTimes(1);
  });

  it("rejects missing email before Turnstile verification", async () => {
    const response = await POST(
      makeSubscribeRequest({
        turnstileToken: "valid-token",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_REQUIRED,
      details: ["errors.email.required"],
    });
    expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
    expect(processLead).not.toHaveBeenCalled();
  });

  it("rejects invalid email before Turnstile verification", async () => {
    const response = await POST(
      makeSubscribeRequest({
        email: "not-an-email",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_INVALID,
      details: ["errors.email.invalid"],
    });
    expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
    expect(processLead).not.toHaveBeenCalled();
  });

  it("requires Turnstile after email validation passes", async () => {
    const response = await POST(
      makeSubscribeRequest({
        email: "subscriber@example.com",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errorCode: API_ERROR_CODES.SUBSCRIBE_SECURITY_REQUIRED,
    });
    expect(processLead).not.toHaveBeenCalled();
  });

  it("passes a validated lowercase newsletter lead to processLead", async () => {
    const response = await POST(
      makeSubscribeRequest({
        email: "subscriber@example.com",
        turnstileToken: "valid-token",
      }),
    );

    expect(response.status).toBe(200);
    expect(verifyTurnstileDetailed).toHaveBeenCalledTimes(1);
    expect(processLead).toHaveBeenCalledWith({
      type: "newsletter",
      email: "subscriber@example.com",
    });
    expect(response.headers.get("x-request-id")).toBeNull();
    expect(response.headers.get("x-observability-surface")).toBeNull();
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        referenceId: "sub-ref-001",
      },
    });
  });

  it("applies CORS headers on POST response when Origin is present", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email: "subscriber@example.com",
          turnstileToken: "valid-token",
        }),
        headers: {
          "Content-Type": "application/json",
          origin: "http://localhost:3000",
          host: "localhost:3000",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST",
    );
  });

  it("returns CORS preflight methods for OPTIONS", () => {
    const response = OPTIONS(
      new NextRequest("http://localhost:3000/api/subscribe", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:3000",
          host: "localhost:3000",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST",
    );
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "OPTIONS",
    );
  });
});
