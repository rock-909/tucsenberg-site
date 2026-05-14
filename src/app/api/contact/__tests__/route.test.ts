import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { submitCanonicalContactSubmission } from "@/lib/contact/submit-canonical-contact";
import { OPTIONS, POST } from "../route";

vi.unmock("zod");

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  sanitizeIP: (ip: string | undefined | null) =>
    ip ? "[REDACTED_IP]" : "[NO_IP]",
}));

vi.mock("@/lib/security/client-ip", () => ({
  getClientIP: vi.fn(() => "203.0.113.10"),
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 5,
    resetTime: Date.now() + 60000,
    retryAfter: null,
  })),
  createRateLimitHeaders: vi.fn(() => new Headers()),
  RATE_LIMIT_PRESETS: {
    contact: {
      maxRequests: 5,
      windowMs: 60000,
      failureMode: "closed",
    },
  },
}));

vi.mock("@/lib/security/rate-limit-key-strategies", () => ({
  getIPKey: vi.fn(() => "ip:test-contact"),
}));

vi.mock("@/lib/contact/submit-canonical-contact", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/lib/contact/submit-canonical-contact")
    >();

  return {
    ...original,
    submitCanonicalContactSubmission: vi.fn(async () => ({
      success: true,
      error: null,
      details: null,
      data: {},
      submissionResult: {
        success: true,
        emailSent: true,
        ownerNotified: true,
        recordCreated: true,
        referenceId: "contact-ref-001",
      },
    })),
  };
});

function createValidContactBody() {
  return {
    fullName: "Alice Example",
    email: "alice@example.com",
    company: "Example Co.",
    subject: "Custom project",
    message: "We need help scoping a replacement website project.",
    acceptPrivacy: true,
    marketingConsent: false,
    website: "",
    turnstileToken: "valid-token",
    submittedAt: new Date().toISOString(),
  };
}

function createContactRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("/api/contact route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 429 before canonical contact submission when rate limited", async () => {
    const rateLimit = await import("@/lib/security/distributed-rate-limit");
    vi.mocked(rateLimit.checkDistributedRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    });

    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.errorCode).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
    expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
  });

  it("rejects invalid payload before canonical contact submission", async () => {
    const response = await POST(
      createContactRequest({
        ...createValidContactBody(),
        email: "not-an-email",
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      details: ["errors.email.invalid"],
    });
    expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
  });

  it("returns Turnstile failure from the canonical contact path", async () => {
    vi.mocked(submitCanonicalContactSubmission).mockResolvedValueOnce({
      success: false,
      errorCode: API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
      error: "Security verification failed",
      details: null,
      data: null,
    });

    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED);
    expect(submitCanonicalContactSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "alice@example.com",
        turnstileToken: "valid-token",
      }),
      {
        clientIP: "203.0.113.10",
      },
    );
  });

  it("returns canonical contact validation details when canonical submission fails with details", async () => {
    vi.mocked(submitCanonicalContactSubmission).mockResolvedValueOnce({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      error: "Validation failed",
      details: ["errors.message.tooShort"],
      data: null,
    });

    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      details: ["errors.message.tooShort"],
    });
  });

  it("returns required contact details when canonical submission reports missing fields", async () => {
    vi.mocked(submitCanonicalContactSubmission).mockResolvedValueOnce({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      error: "Validation failed",
      details: ["errors.message.required", "errors.acceptPrivacy.required"],
      data: null,
    });

    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
      details: ["errors.message.required", "errors.acceptPrivacy.required"],
    });
  });

  it("returns body-size error before canonical contact submission", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(createValidContactBody()),
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "70000",
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.success).toBe(false);
    expect(data.errorCode).toBe(API_ERROR_CODES.PAYLOAD_TOO_LARGE);
    expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
  });

  it("returns reference ID for successful contact submission", async () => {
    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: {
        referenceId: "contact-ref-001",
      },
    });
    expect(submitCanonicalContactSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Alice Example",
        email: "alice@example.com",
      }),
      {
        clientIP: "203.0.113.10",
      },
    );
    expect(response.headers.get("x-request-id")).toBeNull();
    expect(response.headers.get("x-observability-surface")).toBeNull();
  });

  it("applies CORS headers on POST response when Origin is present", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/contact", {
        method: "POST",
        body: JSON.stringify(createValidContactBody()),
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
      new NextRequest("http://localhost:3000/api/contact", {
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
