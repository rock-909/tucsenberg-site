import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import * as inquiryRoute from "@/app/api/inquiry/route";
import * as subscribeRoute from "@/app/api/subscribe/route";

/**
 * Auxiliary response contract checks only.
 *
 * This suite intentionally mocks the core protection and submission pipeline so
 * it can verify response shape. It is not full lead-chain protection proof.
 * Route/action protection suites and deployed canaries own that proof boundary.
 */
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
  verifyTurnstile: vi.fn(async () => true),
  verifyTurnstileDetailed: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/lead-pipeline/process-lead", () => ({
  processLead: vi.fn(async () => ({
    success: true,
    emailSent: true,
    ownerNotified: true,
    recordCreated: true,
    referenceId: "lead-ref-001",
  })),
}));

vi.mock("@/lib/lead-pipeline/lead-schema", () => ({
  LEAD_TYPES: {
    PRODUCT: "product",
    CONTACT: "contact",
    NEWSLETTER: "newsletter",
  },
  productLeadSchema: {
    safeParse: vi.fn((input: Record<string, unknown>) => ({
      success: true,
      data: {
        ...input,
        type: "product",
      },
    })),
  },
  newsletterLeadSchema: {
    safeParse: vi.fn((input: Record<string, unknown>) => ({
      success: true,
      data: {
        ...input,
        type: "newsletter",
      },
    })),
  },
}));

function makeRequest(
  pathname: string,
  body: unknown,
  extraHeaders: HeadersInit = {},
) {
  return new NextRequest(
    new Request(`http://localhost${pathname}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...(extraHeaders as Record<string, string>),
      },
    }),
  );
}

function expectNoLeadObservabilityHeaders(response: Response) {
  expect(response.headers.get("x-request-id")).toBeNull();
  expect(response.headers.get("x-observability-surface")).toBeNull();
}

describe("lead API family response contract (auxiliary)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inquiry success uses the family success contract", async () => {
    const response = await inquiryRoute.POST(
      makeRequest("/api/inquiry", {
        turnstileToken: "valid-token",
        email: "buyer@example.com",
        fullName: "Buyer",
        company: "Buyer Co",
        productSlug: "north-america",
        productName: "North America",
      }),
    );

    expect(response.status).toBe(200);
    expectNoLeadObservabilityHeaders(response);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        referenceId: "lead-ref-001",
      },
    });
  });

  it("subscribe success uses the family success contract", async () => {
    const response = await subscribeRoute.POST(
      makeRequest("/api/subscribe", {
        email: "newsletter@example.com",
        turnstileToken: "valid-token",
      }),
    );

    expect(response.status).toBe(200);
    expectNoLeadObservabilityHeaders(response);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        referenceId: "lead-ref-001",
      },
    });
  });

  it("inquiry missing turnstile uses the family error contract", async () => {
    const response = await inquiryRoute.POST(
      makeRequest("/api/inquiry", {
        email: "buyer@example.com",
        fullName: "Buyer",
        company: "Buyer Co",
        productSlug: "north-america",
        productName: "North America",
      }),
    );

    expect(response.status).toBe(400);
    expectNoLeadObservabilityHeaders(response);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.INQUIRY_SECURITY_REQUIRED,
    });
  });

  it("subscribe missing email uses the family error contract", async () => {
    const response = await subscribeRoute.POST(
      makeRequest("/api/subscribe", {
        turnstileToken: "valid-token",
      }),
    );

    expect(response.status).toBe(400);
    expectNoLeadObservabilityHeaders(response);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.SUBSCRIBE_VALIDATION_EMAIL_REQUIRED,
      details: ["errors.email.required"],
    });
  });

  it("inquiry invalid JSON uses the family error contract", async () => {
    const response = await inquiryRoute.POST(
      new NextRequest(
        new Request("http://localhost/api/inquiry", {
          method: "POST",
          body: "not-json",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ),
    );

    expect(response.status).toBe(400);
    expectNoLeadObservabilityHeaders(response);
    const body = await response.json();
    expect(body).toEqual({
      success: false,
      errorCode: API_ERROR_CODES.INVALID_JSON_BODY,
    });
  });
});
