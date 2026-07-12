import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";

/**
 * Real end-to-end lead-pipeline proof.
 *
 * Unlike `lead-family-contract.test.ts` (which mocks the schema, rate limiter,
 * Turnstile, and process-lead to check response shape cheaply), this suite runs
 * the REAL pipeline: real Zod schema, real `processLead`, real in-memory rate
 * limiter, and the real Turnstile verification logic.
 *
 * Only the external wires are stubbed:
 * - `global.fetch` — Turnstile siteverify (challenges.cloudflare.com) and the
 *   Resend HTTP API (api.resend.com). Set here via `vi.hoisted` BEFORE any
 *   module import so the `resendService` singleton captures this mock as its
 *   default fetch implementation at construction time.
 * - the `airtable` SDK — the CRM wire; we capture the record `create` payload so
 *   we can assert the Airtable FIELD NAMES/values (mapping regressions), not
 *   just call counts.
 *
 * The in-memory rate-limit store is the one the code already selects in test env
 * (no Upstash creds, NODE_ENV=test); it is NOT mocked.
 */

const { fetchMock } = vi.hoisted(() => {
  const fetchMock = vi.fn();
  // Install before module imports so resendService captures this reference.
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return { fetchMock };
});

const { airtableCreateMock } = vi.hoisted(() => ({
  airtableCreateMock: vi.fn(),
}));

vi.mock("airtable", () => {
  const create = airtableCreateMock;
  const table = vi.fn(() => ({ create }));
  const base = vi.fn(() => ({ table }));
  const configure = vi.fn();
  return { default: { configure, base } };
});

// Imported AFTER the wire stubs above are hoisted into place.
import * as inquiryRoute from "@/app/api/inquiry/route";
import { resetRateLimitStore } from "@/lib/security/distributed-rate-limit";

const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_EMAILS_URL = "https://api.resend.com/emails";

interface TurnstileSiteverifyResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
}

// Configurable per-test Turnstile siteverify response (default: valid).
let turnstileResponse: TurnstileSiteverifyResponse = {
  success: true,
  hostname: "localhost",
  action: "product_inquiry",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function resolveFetchUrl(input: unknown): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input === "object" && "url" in input) {
    return String((input as { url: unknown }).url);
  }
  return String(input);
}

function getResendCalls(): Array<{
  url: string;
  init: RequestInit | undefined;
}> {
  return fetchMock.mock.calls
    .map(([input, init]) => ({
      url: resolveFetchUrl(input),
      init: init as RequestInit | undefined,
    }))
    .filter((call) => call.url.includes("api.resend.com"));
}

function parseJsonBody(init: RequestInit | undefined): Record<string, unknown> {
  if (typeof init?.body !== "string") {
    throw new Error("Expected Resend request body to be a JSON string");
  }
  return JSON.parse(init.body) as Record<string, unknown>;
}

function getCapturedAirtableFields(): Record<string, unknown> {
  const call = airtableCreateMock.mock.calls[0];
  if (!call) {
    throw new Error("Airtable create was not called");
  }
  const records = call[0] as Array<{ fields: Record<string, unknown> }>;
  const fields = records[0]?.fields;
  if (!fields) {
    throw new Error("Airtable create payload had no fields");
  }
  return fields;
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

const VALID_INQUIRY_BODY = {
  turnstileToken: "valid-turnstile-token",
  productInquiryKind: "catalog-product",
  fullName: "Jane Buyer",
  email: "buyer@example.com",
  company: "Buyer Co",
  catalogProductId: "abs-flood-barriers",
  quantity: 100,
  requirements: "Custom packaging",
};

// Display name is resolved server-side from the catalog registry, not the client.
const CATALOG_PRODUCT_LABEL = "ABS Interlocking Boxwall";

describe("lead pipeline (real end-to-end proof)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fresh in-memory rate-limit store + queue for each test (real limiter).
    resetRateLimitStore();

    turnstileResponse = {
      success: true,
      hostname: "localhost",
      action: "product_inquiry",
    };

    airtableCreateMock.mockImplementation(
      async (records: Array<{ fields: Record<string, unknown> }>) => [
        {
          id: "rec_real_001",
          fields: records[0]?.fields ?? {},
          get: () => new Date().toISOString(),
        },
      ],
    );

    fetchMock.mockImplementation(async (input: unknown) => {
      const url = resolveFetchUrl(input);
      if (url === TURNSTILE_SITEVERIFY_URL) {
        return jsonResponse(turnstileResponse);
      }
      if (url === RESEND_EMAILS_URL) {
        return jsonResponse({ id: "email_real_001" });
      }
      if (url.includes("/messages/")) {
        return jsonResponse({});
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });
  });

  it("valid inquiry: persists the Airtable record and sends the Resend email", async () => {
    const response = await inquiryRoute.POST(
      makeInquiryRequest(VALID_INQUIRY_BODY),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data.referenceId).toBe("string");
    expect(body.data.referenceId).toMatch(/^PRO-/);

    // Airtable wire: assert FIELD NAMES + values (mapping regression guard).
    expect(airtableCreateMock).toHaveBeenCalledTimes(1);
    const fields = getCapturedAirtableFields();
    expect(fields).toMatchObject({
      Email: "buyer@example.com",
      Source: "Product Inquiry",
      Status: "New",
      "First Name": "Jane",
      "Last Name": "Buyer",
      Company: "Buyer Co",
      "Product Name": CATALOG_PRODUCT_LABEL,
      "Product Slug": "abs-flood-barriers",
      Quantity: "100",
      "Marketing Consent": false,
    });
    expect(typeof fields["Reference ID"]).toBe("string");
    expect(fields["Reference ID"]).toBe(body.data.referenceId);
    expect(typeof fields["Message"]).toBe("string");
    expect(fields["Message"]).toContain(CATALOG_PRODUCT_LABEL);

    // Resend wire: assert the outbound email payload for the submitted lead.
    const resendCalls = getResendCalls();
    expect(resendCalls).toHaveLength(1);
    const resendBody = parseJsonBody(resendCalls[0]?.init);
    expect(resendBody.to).toEqual(["reply@example.com"]);
    expect(resendBody.reply_to).toBe("buyer@example.com");
    expect(typeof resendBody.subject).toBe("string");
    expect((resendBody.subject as string).length).toBeGreaterThan(0);
    expect(typeof resendBody.html).toBe("string");
    expect(typeof resendBody.text).toBe("string");
  });

  it("invalid payload: rejects with a validation code and touches no external sink", async () => {
    const response = await inquiryRoute.POST(
      makeInquiryRequest({ ...VALID_INQUIRY_BODY, email: "not-an-email" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe(API_ERROR_CODES.INQUIRY_VALIDATION_FAILED);

    expect(airtableCreateMock).not.toHaveBeenCalled();
    expect(getResendCalls()).toHaveLength(0);
  });

  it("failed Turnstile: rejects the inquiry and touches no external sink", async () => {
    turnstileResponse = {
      success: false,
      "error-codes": ["invalid-input-response"],
    };

    const response = await inquiryRoute.POST(
      makeInquiryRequest(VALID_INQUIRY_BODY),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe(API_ERROR_CODES.TURNSTILE_REJECTED);

    expect(airtableCreateMock).not.toHaveBeenCalled();
    expect(getResendCalls()).toHaveLength(0);
  });

  it("airtable failure: still succeeds and delivers the owner email", async () => {
    airtableCreateMock.mockRejectedValue(new Error("airtable down"));

    const response = await inquiryRoute.POST(
      makeInquiryRequest(VALID_INQUIRY_BODY),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.referenceId).toMatch(/^PRO-/);
    expect(getResendCalls()).toHaveLength(1);
  });

  it("both channels fail: rejects with an inquiry processing error", async () => {
    airtableCreateMock.mockRejectedValue(new Error("airtable down"));
    fetchMock.mockImplementation(async (input: unknown) => {
      const url = resolveFetchUrl(input);
      if (url === TURNSTILE_SITEVERIFY_URL) {
        return jsonResponse(turnstileResponse);
      }
      if (url === RESEND_EMAILS_URL) {
        return jsonResponse({ error: "resend down" }, 500);
      }
      if (url.includes("/messages/")) {
        return jsonResponse({});
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });

    const response = await inquiryRoute.POST(
      makeInquiryRequest(VALID_INQUIRY_BODY),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe(API_ERROR_CODES.INQUIRY_PROCESSING_ERROR);
    expect(getResendCalls()).toHaveLength(1);
  });
});
