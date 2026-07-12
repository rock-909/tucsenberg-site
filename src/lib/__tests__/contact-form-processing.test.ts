import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import {
  type ContactFormWithToken,
  submitCanonicalContactSubmission,
  validateContactSubmissionPayload,
} from "@/lib/contact/submit-canonical-contact";
import { contactLeadSchema, LEAD_TYPES } from "@/lib/lead-pipeline/lead-schema";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";

const mockProcessLead = vi.hoisted(() => vi.fn());

vi.mock("@/lib/lead-pipeline/process-lead", () => ({
  processLead: mockProcessLead,
}));

vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstileDetailed: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
  sanitizeEmail: (email: string | undefined | null) =>
    email ? "[REDACTED_EMAIL]" : "[NO_EMAIL]",
}));

function createContactFormData(
  subject: string | undefined,
): ContactFormWithToken {
  return {
    fullName: "Alice Example",
    email: "alice@example.com",
    company: "Example Co.",
    subject,
    message: "We need help scoping a replacement website project.",
    turnstileToken: "valid-token",
    submittedAt: new Date().toISOString(),
  };
}

describe("canonical contact submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-30T12:00:00.000Z"));
  });

  it("passes buyer-entered subject text to the lead pipeline", async () => {
    mockProcessLead.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-custom",
    });

    await submitCanonicalContactSubmission(
      createContactFormData("Custom project setup"),
      { clientIP: "203.0.113.10" },
    );

    expect(mockProcessLead).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Custom project setup",
      }),
      {},
    );
  });

  it("passes attribution fields to the lead pipeline", async () => {
    mockProcessLead.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-attribution",
    });

    await submitCanonicalContactSubmission(
      {
        ...createContactFormData("Product inquiry"),
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "flood-barriers",
        gclid: "gclid-contact-123",
        landingPage: "/en/contact",
        capturedAt: "2026-07-04T00:00:00.000Z",
      },
      { clientIP: "203.0.113.10" },
    );

    expect(mockProcessLead).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "flood-barriers",
        gclid: "gclid-contact-123",
        landingPage: "/en/contact",
        capturedAt: "2026-07-04T00:00:00.000Z",
      }),
      {},
    );
  });

  it("omits blank subject text before sending contact data to the lead pipeline", async () => {
    mockProcessLead.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-no-subject",
    });

    await submitCanonicalContactSubmission(createContactFormData("   "), {
      clientIP: "203.0.113.10",
    });

    expect(mockProcessLead).toHaveBeenCalledWith(
      expect.not.objectContaining({
        subject: expect.any(String),
      }),
      {},
    );
  });

  it("maps missing required contact fields to required detail keys", () => {
    const payload: Partial<ContactFormWithToken> =
      createContactFormData("Product inquiry");
    delete payload.message;

    const result = validateContactSubmissionPayload(payload);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
        details: ["errors.message.required"],
      }),
    );
  });

  it.each(["+cmd@example.com", "-cmd@example.com"])(
    "rejects formula-capable email %s before Turnstile and lead processing",
    async (email) => {
      const result = await submitCanonicalContactSubmission(
        { ...createContactFormData("Product inquiry"), email },
        { clientIP: "203.0.113.10" },
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
          details: ["errors.email.invalid"],
        }),
      );
      expect(verifyTurnstileDetailed).not.toHaveBeenCalled();
      expect(mockProcessLead).not.toHaveBeenCalled();
    },
  );

  it("keeps plus-addressing valid at the canonical contact boundary", () => {
    const result = validateContactSubmissionPayload({
      ...createContactFormData("Product inquiry"),
      email: "buyer+rfq@example.com",
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ email: "buyer+rfq@example.com" }),
      }),
    );
  });

  it("accepts submissions when the client clock is slightly ahead of the server", () => {
    const payload = createContactFormData("Product inquiry");
    payload.submittedAt = new Date(Date.now() + 90_000).toISOString();

    const result = validateContactSubmissionPayload(payload);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  it("rejects submissions just older than the freshness window", () => {
    const payload = createContactFormData("Product inquiry");
    payload.submittedAt = new Date(Date.now() - 10 * 60_000 - 1).toISOString();

    const result = validateContactSubmissionPayload(payload);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
        details: null,
        data: null,
      }),
    );
    expect(mockProcessLead).not.toHaveBeenCalled();
  });

  it("rejects submissions just beyond the future clock-skew allowance", () => {
    const payload = createContactFormData("Product inquiry");
    payload.submittedAt = new Date(Date.now() + 2 * 60_000 + 1).toISOString();

    const result = validateContactSubmissionPayload(payload);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_SUBMISSION_EXPIRED,
        details: null,
        data: null,
      }),
    );
    expect(mockProcessLead).not.toHaveBeenCalled();
  });

  it("does not keep legacy production abbreviations as starter custom-project triggers", async () => {
    const legacyManufacturingTerm = ["O", "DM"].join("");

    mockProcessLead.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-other",
    });

    await submitCanonicalContactSubmission(
      createContactFormData(`${legacyManufacturingTerm} packaging`),
      { clientIP: "203.0.113.10" },
    );

    expect(mockProcessLead).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `${legacyManufacturingTerm} packaging`,
      }),
      {},
    );
  });

  it("splits fullName only at the downstream lead boundary", async () => {
    mockProcessLead.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-name",
    });

    await submitCanonicalContactSubmission(
      createContactFormData("Product inquiry"),
      { clientIP: "203.0.113.10" },
    );

    expect(mockProcessLead).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Alice Example",
      }),
      {},
    );
  });

  it("passes validated contact form data that the lead schema accepts at the handoff boundary", async () => {
    const formData = createContactFormData("Custom project setup");
    formData.company = "";
    mockProcessLead.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: "ref-schema-boundary",
    });

    await submitCanonicalContactSubmission(formData, {
      clientIP: "203.0.113.10",
    });

    const leadInput = mockProcessLead.mock.calls[0]?.[0];

    expect(contactLeadSchema.safeParse(leadInput)).toEqual(
      expect.objectContaining({ success: true }),
    );
    expect(leadInput).toEqual(
      expect.objectContaining({
        type: LEAD_TYPES.CONTACT,
        fullName: "Alice Example",
        email: "alice@example.com",
        subject: "Custom project setup",
        company: undefined,
        message: "We need help scoping a replacement website project.",
        turnstileToken: "valid-token",
        submittedAt: expect.any(String),
      }),
    );
  });

  it("returns a structured failure when lead processing fails", async () => {
    mockProcessLead.mockResolvedValueOnce({
      success: false,
      error: "Airtable unavailable",
    });

    const result = await submitCanonicalContactSubmission(
      createContactFormData("Product inquiry"),
      { clientIP: "203.0.113.10" },
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        errorCode: API_ERROR_CODES.CONTACT_PROCESSING_ERROR,
        error: "Failed to process contact submission",
        details: null,
        data: null,
      }),
    );
  });
});
