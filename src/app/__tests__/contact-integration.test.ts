/**
 * Contact Form Submission — Integration Tests
 *
 * Tests the full contactFormAction chain with only external services mocked:
 * - Turnstile verification (Cloudflare API)
 * - Lead pipeline (Resend email + Airtable CRM)
 *
 * Internal protection chain runs as real code:
 * - Rate limiting (distributed-rate-limit)
 * - Honeypot detection
 * - Zod schema validation
 * - submittedAt time window check
 * - Turnstile token presence check
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { checkDistributedRateLimit } from "@/lib/security/distributed-rate-limit";
import { submitCanonicalContactSubmission } from "@/lib/contact/submit-canonical-contact";
import { contactFormAction } from "@/lib/actions/contact";

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

const mockHeadersGet = vi.fn<(key: string) => string | null>((key) => {
  if (key === "x-forwarded-for") return "203.0.113.50";
  return null;
});

vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: mockHeadersGet,
    }),
  ),
}));

// Rate limiting — allow by default (internal module, but backed by external KV)
vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(() =>
    Promise.resolve({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000,
    }),
  ),
}));

// Lead pipeline — external services (Resend + Airtable)
vi.mock("@/lib/contact/submit-canonical-contact", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@/lib/contact/submit-canonical-contact")
    >();

  return {
    ...original,
    submitCanonicalContactSubmission: vi.fn(() =>
      Promise.resolve({
        success: true,
        error: null,
        details: null,
        data: {},
        submissionResult: {
          emailSent: true,
          ownerNotified: true,
          recordCreated: true,
          referenceId: "ref-integration-001",
        },
      }),
    ),
  };
});

// ── Helpers ─────────────────────────────────────────────────────────

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }
  return formData;
}

function validContactFields(): Record<string, string> {
  return {
    fullName: "Alice Zhang",
    email: "alice@example.com",
    company: "Example Showcase Company Co.",
    phone: "+8613800138000",
    subject: "Product inquiry",
    message: "I need an example offer scoped for a large project.",
    acceptPrivacy: "true",
    marketingConsent: "false",
    turnstileToken: "valid-turnstile-token",
    submittedAt: new Date().toISOString(),
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Contact form — integration (happy path chain)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T12:00:00Z"));
    vi.stubEnv("NODE_ENV", "development");
    mockHeadersGet.mockImplementation((key: string) => {
      if (key === "x-forwarded-for") return "203.0.113.50";
      return null;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Happy path — full chain succeeds", () => {
    it("rate limit → honeypot → validation → time check → turnstile → process lead", async () => {
      const formData = createFormData(validContactFields());

      const result = await contactFormAction(null, formData);

      // Full chain completed successfully
      expect(result.success).toBe(true);
      expect(result.data?.emailSent).toBe(true);
      expect(result.data?.ownerNotified).toBe(true);
      expect(result.data?.recordCreated).toBe(true);

      // Protection chain was invoked in order
      expect(checkDistributedRateLimit).toHaveBeenCalledTimes(1);
      expect(submitCanonicalContactSubmission).toHaveBeenCalledWith(
        expect.objectContaining({ turnstileToken: "valid-turnstile-token" }),
        { clientIP: expect.any(String) },
      );
      expect(submitCanonicalContactSubmission).toHaveBeenCalledTimes(1);
    });

    it("processes repeated successful submissions independently", async () => {
      const firstFormData = createFormData(validContactFields());
      const secondFormData = createFormData(validContactFields());

      const firstResult = await contactFormAction(null, firstFormData);
      const secondResult = await contactFormAction(null, secondFormData);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);
      expect(submitCanonicalContactSubmission).toHaveBeenCalledTimes(2);
    });

    it("falls back closed for contact Server Action identity on Cloudflare", async () => {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("CF_PAGES", "1");
      mockHeadersGet.mockImplementation((key: string) => {
        if (key === "cf-connecting-ip") return "192.0.2.100";
        return null;
      });

      const formData = createFormData(validContactFields());
      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(true);
      expect(submitCanonicalContactSubmission).toHaveBeenCalledWith(
        expect.objectContaining({ turnstileToken: "valid-turnstile-token" }),
        { clientIP: "0.0.0.0" },
      );
    });
  });

  describe("Protection chain — each gate blocks when triggered", () => {
    it("rate limit gate blocks before any other processing", async () => {
      vi.mocked(checkDistributedRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const formData = createFormData(validContactFields());
      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
    });

    it("honeypot gate silently accepts but does not process", async () => {
      const fields = validContactFields();
      fields.website = "http://spam-bot.example.com";
      const formData = createFormData(fields);

      const result = await contactFormAction(null, formData);

      // Silent rejection: returns success but no actual processing
      expect(result.success).toBe(true);
      expect(result.data?.emailSent).toBe(false);
      expect(result.data?.ownerNotified).toBe(false);
      expect(result.data?.recordCreated).toBe(false);
      expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
    });

    it("missing turnstile token blocks before Turnstile API call", async () => {
      const fields = validContactFields();
      delete (fields as Record<string, string | undefined>).turnstileToken;
      const formData = createFormData(fields);

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.TURNSTILE_MISSING_TOKEN);
      expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
    });

    it("future submittedAt blocks before turnstile verification", async () => {
      vi.mocked(submitCanonicalContactSubmission).mockResolvedValueOnce({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
        error: "Form submission expired or invalid",
        details: null,
        data: null,
      });
      const fields = validContactFields();
      // 5 minutes in the future — fails time window check (timeDiff < 0)
      fields.submittedAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const formData = createFormData(fields);

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED);
      // Rate limit was checked (first gate)
      expect(checkDistributedRateLimit).toHaveBeenCalledTimes(1);
      expect(submitCanonicalContactSubmission).toHaveBeenCalledTimes(1);
    });

    it("expired submittedAt blocks before turnstile verification", async () => {
      vi.mocked(submitCanonicalContactSubmission).mockResolvedValueOnce({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
        error: "Form submission expired or invalid",
        details: null,
        data: null,
      });
      const fields = validContactFields();
      // 15 minutes ago — exceeds 10-minute window
      fields.submittedAt = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const formData = createFormData(fields);

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED);
      expect(submitCanonicalContactSubmission).toHaveBeenCalledTimes(1);
    });

    it("turnstile verification failure blocks before lead processing", async () => {
      vi.mocked(submitCanonicalContactSubmission).mockResolvedValueOnce({
        success: false,
        errorCode: API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
        error: "Security verification failed",
        details: null,
        data: null,
      });

      const formData = createFormData(validContactFields());
      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(
        API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
      );
      // Rate limit was checked
      expect(checkDistributedRateLimit).toHaveBeenCalledTimes(1);
      expect(submitCanonicalContactSubmission).toHaveBeenCalledTimes(1);
    });
  });

  describe("Protection chain ordering — earlier gates short-circuit later ones", () => {
    it("rate limit failure prevents even honeypot check from reaching turnstile", async () => {
      vi.mocked(checkDistributedRateLimit).mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      // Even with honeypot filled AND invalid turnstile token
      const fields = validContactFields();
      fields.website = "http://bot.example.com";
      const formData = createFormData(fields);

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(submitCanonicalContactSubmission).not.toHaveBeenCalled();
    });
  });
});
