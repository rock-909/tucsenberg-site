import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { processLead } from "@/lib/lead-pipeline/process-lead";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";
import { POST } from "../route";

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

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstileDetailed: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/lead-pipeline/process-lead", () => ({
  processLead: vi.fn(async () => ({
    success: true,
    emailSent: true,
    ownerNotified: true,
    recordCreated: true,
    referenceId: "contact-ref-999",
  })),
}));

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
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("/api/contact canonical integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs the real canonical contact path before returning the public reference id", async () => {
    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: {
        referenceId: "contact-ref-999",
      },
    });
    expect(verifyTurnstileDetailed).toHaveBeenCalledWith(
      "valid-token",
      "203.0.113.10",
      {
        expectedAction: "contact_form",
      },
    );
    expect(processLead).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "contact",
        fullName: "Alice Example",
        email: "alice@example.com",
        company: "Example Co.",
        subject: "Custom project",
        message: "We need help scoping a replacement website project.",
        turnstileToken: "valid-token",
        submittedAt: expect.any(String),
        marketingConsent: false,
      }),
      {},
    );
  });

  it("returns service unavailable when the canonical Turnstile check cannot reach the service", async () => {
    vi.mocked(verifyTurnstileDetailed).mockResolvedValueOnce({
      success: false,
      errorCodes: ["network-error"],
    });

    const response = await POST(createContactRequest(createValidContactBody()));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.errorCode).toBe(API_ERROR_CODES.TURNSTILE_UNAVAILABLE);
    expect(processLead).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only Turnstile token as missing without verification or lead processing", async () => {
    const response = await POST(
      createContactRequest({
        ...createValidContactBody(),
        turnstileToken: "   ",
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.TURNSTILE_REQUIRED,
    });
    expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
    expect(processLead).not.toHaveBeenCalled();
  });
});
