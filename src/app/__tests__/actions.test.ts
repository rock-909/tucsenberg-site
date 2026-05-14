import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { checkDistributedRateLimit } from "@/lib/security/distributed-rate-limit";
import { contactFormAction } from "@/lib/actions/contact";
import type { ContactFormWithToken } from "@/lib/contact/submit-canonical-contact";

// Mock dependencies before imports
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockHeadersGet = vi.fn<(key: string) => string | null>((key) => {
  if (key === "x-forwarded-for") return "192.168.1.100";
  if (key === "x-real-ip") return "192.168.1.101";
  return null;
});

const mockCanonicalContactData = {
  fullName: "John Doe",
  email: "john@example.com",
  company: "",
  phone: "+1234567890",
  subject: "General Inquiry",
  message: "Hello, this is a test message with enough length.",
  acceptPrivacy: true,
  marketingConsent: false,
  website: "",
  turnstileToken: "valid-token",
  submittedAt: "2024-06-15T12:00:00.000Z",
} satisfies ContactFormWithToken;

vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({
      get: mockHeadersGet,
    }),
  ),
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(() =>
    Promise.resolve({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000,
      retryAfter: null,
    }),
  ),
}));

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
        data: mockCanonicalContactData,
        submissionResult: {
          success: true,
          emailSent: true,
          ownerNotified: true,
          recordCreated: true,
          referenceId: "ref-123",
        },
      }),
    ),
  };
});

describe("actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    vi.stubEnv("NODE_ENV", "development");
    // Reset mockHeadersGet to default behavior
    mockHeadersGet.mockImplementation((key: string) => {
      if (key === "x-forwarded-for") return "192.168.1.100";
      if (key === "x-real-ip") return "192.168.1.101";
      return null;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createFormData(data: Record<string, string>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }
    return formData;
  }

  describe("contactFormAction", () => {
    const createValidFormData = (
      overrides: Partial<Record<string, string>> = {},
    ): Record<string, string> => ({
      fullName: "John Doe",
      email: "john@example.com",
      company: "",
      phone: "+1234567890",
      subject: "General Inquiry",
      message: "Hello, this is a test message with enough length.",
      acceptPrivacy: "true",
      marketingConsent: "false",
      turnstileToken: "valid-token",
      submittedAt: new Date().toISOString(),
      ...overrides,
    });

    it("should process valid submissions without a replay key", async () => {
      const formData = createFormData(createValidFormData());

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        emailSent: true,
        ownerNotified: true,
        recordCreated: true,
        referenceId: "ref-123",
      });
      expect(checkDistributedRateLimit).toHaveBeenCalledTimes(1);
    });

    it("should return error when turnstile token is missing", async () => {
      const dataWithoutToken = { ...createValidFormData() };
      delete (dataWithoutToken as { turnstileToken?: string }).turnstileToken;
      const formData = createFormData(dataWithoutToken);

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.TURNSTILE_MISSING_TOKEN);
    });

    it("should return error when turnstile verification fails", async () => {
      const canonical = await import("@/lib/contact/submit-canonical-contact");
      vi.mocked(
        canonical.submitCanonicalContactSubmission,
      ).mockResolvedValueOnce({
        success: false,
        errorCode: API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
        error: "Security verification failed",
        details: null,
        data: null,
      });
      const formData = createFormData(createValidFormData());

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(
        API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
      );
    });

    it("should return error when submittedAt is expired", async () => {
      const canonical = await import("@/lib/contact/submit-canonical-contact");
      vi.mocked(
        canonical.submitCanonicalContactSubmission,
      ).mockResolvedValueOnce({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
        error: "Form submission expired or invalid",
        details: null,
        data: null,
      });
      const expiredData = {
        ...createValidFormData(),
        submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      };
      const formData = createFormData(expiredData);

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED);
    });

    // Note: form-field validation is covered by `src/lib/__tests__/validations.test.ts`.
    // This suite keeps Zod mocked for speed and focuses on action control flow.

    it("should attempt verification with valid form data", async () => {
      const formData = createFormData(createValidFormData());

      const result = await contactFormAction(null, formData);

      // Result depends on whether validation passes before turnstile check
      // The test verifies the action runs without throwing
      expect(result).toBeDefined();
    });

    it("processes repeated valid submissions independently", async () => {
      const freshData = {
        ...createValidFormData(),
        submittedAt: new Date().toISOString(),
      };
      const formData = createFormData(freshData);
      const duplicateFormData = createFormData(freshData);

      const firstResult = await contactFormAction(null, formData);
      const secondResult = await contactFormAction(null, duplicateFormData);

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(true);
      const processing = await import("@/lib/contact/submit-canonical-contact");
      expect(processing.submitCanonicalContactSubmission).toHaveBeenCalledTimes(
        2,
      );
    });

    it("rate limits repeated submissions independently", async () => {
      vi.mocked(checkDistributedRateLimit)
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 10,
          resetTime: Date.now() + 60_000,
          retryAfter: null,
        })
        .mockResolvedValueOnce({
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + 60_000,
          retryAfter: 60,
        });

      const replayData = {
        ...createValidFormData(),
        submittedAt: new Date().toISOString(),
      };

      const firstResult = await contactFormAction(
        null,
        createFormData(replayData),
      );
      const secondResult = await contactFormAction(
        null,
        createFormData(replayData),
      );

      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(false);
      expect(secondResult.errorCode).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(checkDistributedRateLimit).toHaveBeenCalledTimes(2);
    });

    it("should return error when submittedAt is not provided", async () => {
      const canonical = await import("@/lib/contact/submit-canonical-contact");
      vi.mocked(
        canonical.submitCanonicalContactSubmission,
      ).mockResolvedValueOnce({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
        error: "Form submission expired or invalid",
        details: null,
        data: null,
      });
      const dataWithoutSubmittedAt = { ...createValidFormData() };
      delete (dataWithoutSubmittedAt as { submittedAt?: string }).submittedAt;
      const formData = createFormData(dataWithoutSubmittedAt);

      const result = await contactFormAction(null, formData);

      // Missing submittedAt should be rejected, not silently fallback to now
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED);
    });

    it("should return error when submittedAt is not-a-date", async () => {
      const canonical = await import("@/lib/contact/submit-canonical-contact");
      vi.mocked(
        canonical.submitCanonicalContactSubmission,
      ).mockResolvedValueOnce({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
        error: "Form submission expired or invalid",
        details: null,
        data: null,
      });
      const invalidDateData = {
        ...createValidFormData(),
        submittedAt: "not-a-date",
      };
      const formData = createFormData(invalidDateData);

      const result = await contactFormAction(null, formData);

      // Invalid date string should be rejected (NaN bypass vulnerability)
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe(API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED);
    });

    it("should return result object with expected structure", async () => {
      const formData = createFormData(createValidFormData());

      const result = await contactFormAction(null, formData);

      expect(result).toHaveProperty("success");
      expect(typeof result.success).toBe("boolean");
    });

    it("should surface record-created email failures as user-visible success", async () => {
      const processing = await import("@/lib/contact/submit-canonical-contact");
      vi.mocked(
        processing.submitCanonicalContactSubmission,
      ).mockResolvedValueOnce({
        success: true,
        error: null,
        details: null,
        data: mockCanonicalContactData,
        submissionResult: {
          success: true,
          emailSent: false,
          ownerNotified: false,
          recordCreated: true,
          referenceId: "ref-record-123",
        },
      });
      const formData = createFormData(createValidFormData());

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual({
        emailSent: false,
        ownerNotified: false,
        recordCreated: true,
        referenceId: "ref-record-123",
      });
    });

    it("should handle empty form data", async () => {
      const formData = new FormData();

      const result = await contactFormAction(null, formData);

      expect(result.success).toBe(false);
    });
  });

  describe("Server Action Security", () => {
    function getValidFormData(): Record<string, string> {
      return {
        fullName: "John Doe",
        email: "john@example.com",
        company: "",
        phone: "+1234567890",
        subject: "General Inquiry",
        message: "Hello, this is a test message with enough length.",
        acceptPrivacy: "true",
        marketingConsent: "false",
        turnstileToken: "valid-token",
        submittedAt: new Date().toISOString(),
      };
    }

    function createFormData(data: Record<string, string>): FormData {
      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, value);
      }
      return formData;
    }

    describe("Rate Limiting", () => {
      it("should reject request when rate limit exceeded", async () => {
        vi.mocked(checkDistributedRateLimit).mockResolvedValueOnce({
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + 60000,
          retryAfter: 60,
        });

        const formData = createFormData(getValidFormData());
        const result = await contactFormAction(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Too many requests");
      });

      it("should call rate limiter with extracted client IP", async () => {
        const formData = createFormData(getValidFormData());
        await contactFormAction(null, formData);

        expect(checkDistributedRateLimit).toHaveBeenCalledWith(
          expect.stringMatching(/^ip:[0-9a-f]{16}$/),
          "contact",
        );

        const [identifier] = vi.mocked(checkDistributedRateLimit).mock
          .calls[0] ?? [""];
        expect(String(identifier)).not.toContain("192.168.1.100");
      });
    });

    describe("Honeypot Field Validation", () => {
      it("should silently reject when honeypot field is filled", async () => {
        const formDataWithHoneypot = {
          ...getValidFormData(),
          website: "http://spam-bot.com",
        };
        const formData = createFormData(formDataWithHoneypot);

        const result = await contactFormAction(null, formData);

        // Honeypot triggers silent rejection: returns success but doesn't process
        expect(result.success).toBe(true);
        expect(result.data?.emailSent).toBe(false);
        expect(result.data?.recordCreated).toBe(false);
        const canonical =
          await import("@/lib/contact/submit-canonical-contact");
        expect(
          canonical.submitCanonicalContactSubmission,
        ).not.toHaveBeenCalled();
      });

      it("should process normally when honeypot field is empty", async () => {
        const formDataWithEmptyHoneypot = {
          ...getValidFormData(),
          website: "",
        };
        const formData = createFormData(formDataWithEmptyHoneypot);

        await contactFormAction(null, formData);

        const canonical =
          await import("@/lib/contact/submit-canonical-contact");
        expect(canonical.submitCanonicalContactSubmission).toHaveBeenCalled();
      });

      it("should process normally when honeypot field is absent", async () => {
        const formData = createFormData(getValidFormData());

        await contactFormAction(null, formData);

        const canonical =
          await import("@/lib/contact/submit-canonical-contact");
        expect(canonical.submitCanonicalContactSubmission).toHaveBeenCalled();
      });
    });

    describe("Client IP Extraction", () => {
      it("should extract first IP from x-forwarded-for chain", async () => {
        mockHeadersGet.mockImplementation((key: string) => {
          if (key === "x-forwarded-for") return "203.0.113.50, 198.51.100.1";
          return null;
        });

        const formData = createFormData(getValidFormData());
        await contactFormAction(null, formData);

        expect(checkDistributedRateLimit).toHaveBeenCalledWith(
          expect.stringMatching(/^ip:[0-9a-f]{16}$/),
          "contact",
        );

        const [identifier] = vi.mocked(checkDistributedRateLimit).mock
          .calls[0] ?? [""];
        expect(String(identifier)).not.toContain("203.0.113.50");
      });

      it("should pass client IP to Turnstile verification", async () => {
        mockHeadersGet.mockImplementation((key: string) => {
          if (key === "x-forwarded-for") return "172.16.0.100";
          return null;
        });

        const formData = createFormData(getValidFormData());
        await contactFormAction(null, formData);

        const canonical =
          await import("@/lib/contact/submit-canonical-contact");
        expect(canonical.submitCanonicalContactSubmission).toHaveBeenCalledWith(
          expect.objectContaining({ turnstileToken: "valid-token" }),
          { clientIP: "172.16.0.100" },
        );
      });

      it("should fail closed for raw Cloudflare headers in Server Action compatibility path", async () => {
        vi.stubEnv("NODE_ENV", "test");
        vi.stubEnv("CF_PAGES", "1");
        mockHeadersGet.mockImplementation((key: string) => {
          if (key === "cf-connecting-ip") return "192.0.2.100";
          return null;
        });

        const formData = createFormData(getValidFormData());
        await contactFormAction(null, formData);

        const canonical =
          await import("@/lib/contact/submit-canonical-contact");
        expect(canonical.submitCanonicalContactSubmission).toHaveBeenCalledWith(
          expect.objectContaining({ turnstileToken: "valid-token" }),
          { clientIP: "0.0.0.0" },
        );
      });
    });
  });
});
