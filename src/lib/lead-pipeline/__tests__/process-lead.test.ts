import { beforeEach, describe, expect, it, vi } from "vitest";

import { LEAD_TYPES } from "../lead-schema";
import { processLead } from "../process-lead";

vi.unmock("zod");

const mockAfter = vi.hoisted(() => vi.fn());
const mockCreateLead = vi.hoisted(() => vi.fn());
const mockSendContactFormEmail = vi.hoisted(() => vi.fn());
const mockSendConfirmationEmail = vi.hoisted(() => vi.fn());
const mockSendProductInquiryEmail = vi.hoisted(() => vi.fn());

vi.mock("next/server", () => ({
  after: mockAfter,
}));

vi.mock("@/lib/airtable/instance", () => ({
  airtableService: {
    createLead: mockCreateLead,
  },
}));

vi.mock("@/lib/resend-instance", () => ({
  resendService: {
    sendContactFormEmail: mockSendContactFormEmail,
    sendConfirmationEmail: mockSendConfirmationEmail,
    sendProductInquiryEmail: mockSendProductInquiryEmail,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  sanitizeEmail: (email: string | undefined | null) =>
    email ? "[REDACTED_EMAIL]" : "[NO_EMAIL]",
  sanitizeCompany: (company: string | undefined | null) =>
    company ? "[REDACTED]" : "[NO_COMPANY]",
}));

vi.mock("@/config/contact-form-config", () => ({
  CONTACT_FORM_CONFIG: {
    features: {
      sendConfirmationEmail: true,
    },
  },
}));

describe("processLead", () => {
  const validContactLead = {
    type: LEAD_TYPES.CONTACT,
    fullName: "John Doe",
    email: "john@example.com",
    subject: "Product inquiry",
    message: "This is a test message with enough characters.",
    turnstileToken: "valid-token",
    company: "Test Company",
    marketingConsent: true,
  };

  const validProductLead = {
    type: LEAD_TYPES.PRODUCT,
    fullName: "Jane Smith",
    email: "jane@example.com",
    productSlug: "showcase-plan-basic",
    productName: "Showcase Plan Basic",
    quantity: "500 units",
    company: "Example Company",
    requirements: "Brand adaptation needed",
    marketingConsent: true,
  };

  const validNewsletterLead = {
    type: LEAD_TYPES.NEWSLETTER,
    email: "subscriber@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAfter.mockImplementation((callback: () => unknown) => callback);
  });

  it("returns VALIDATION_ERROR for invalid input", async () => {
    const result = await processLead({ type: "invalid" });

    expect(result).toEqual({
      success: false,
      emailSent: false,
      ownerNotified: false,
      recordCreated: false,
      error: "VALIDATION_ERROR",
    });
    expect(result).not.toHaveProperty("partialSuccess");
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockSendContactFormEmail).not.toHaveBeenCalled();
    expect(mockSendProductInquiryEmail).not.toHaveBeenCalled();
  });

  it("returns user success when contact record is created and owner email fails", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-123" });
    mockSendContactFormEmail.mockRejectedValue(new Error("Email failed"));

    const result = await processLead(validContactLead);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        emailSent: false,
        ownerNotified: false,
        recordCreated: true,
      }),
    );
    expect(result).not.toHaveProperty("partialSuccess");
    expect(result.referenceId?.startsWith("CON-")).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("passes buyer-entered contact subject to Airtable and owner email", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-subject" });
    mockSendContactFormEmail.mockResolvedValue("email-subject");
    const buyerSubject = "Need custom distributor website quote";

    const result = await processLead({
      ...validContactLead,
      subject: buyerSubject,
    });

    expect(result.success).toBe(true);
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.CONTACT,
      expect.objectContaining({
        subject: buyerSubject,
      }),
    );
    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: buyerSubject,
      }),
    );
  });

  it("omits blank contact subject from Airtable and owner email", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-no-subject" });
    mockSendContactFormEmail.mockResolvedValue("email-no-subject");

    const result = await processLead({
      ...validContactLead,
      subject: "   ",
    });

    expect(result.success).toBe(true);
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.CONTACT,
      expect.not.objectContaining({
        subject: expect.any(String),
      }),
    );
    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      expect.not.objectContaining({
        subject: expect.any(String),
      }),
    );
  });

  it("fails contact lead and does not send email when Airtable fails", async () => {
    mockCreateLead.mockRejectedValue(new Error("Airtable failed"));

    const result = await processLead(validContactLead);

    expect(result).toEqual({
      success: false,
      emailSent: false,
      ownerNotified: false,
      recordCreated: false,
      referenceId: expect.stringMatching(/^CON-/),
      error: "PROCESSING_FAILED",
    });
    expect(result).not.toHaveProperty("partialSuccess");
    expect(mockSendContactFormEmail).not.toHaveBeenCalled();
    expect(mockSendConfirmationEmail).not.toHaveBeenCalled();
  });

  it("schedules contact confirmation email without blocking user success", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-123" });
    mockSendContactFormEmail.mockResolvedValue("email-id-123");
    mockSendConfirmationEmail.mockRejectedValue(new Error("Confirm failed"));

    const result = await processLead(validContactLead);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        emailSent: true,
        ownerNotified: true,
        recordCreated: true,
      }),
    );
    expect(mockAfter).toHaveBeenCalledTimes(1);
    expect(mockSendConfirmationEmail).not.toHaveBeenCalled();

    const callback = mockAfter.mock.calls[0]?.[0];
    expect(callback).toEqual(expect.any(Function));
    await callback();

    expect(mockSendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      }),
    );
  });

  it("returns user success when product record is created and owner email fails", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-456" });
    mockSendProductInquiryEmail.mockRejectedValue(new Error("Email failed"));

    const result = await processLead(validProductLead);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        emailSent: false,
        ownerNotified: false,
        recordCreated: true,
      }),
    );
    expect(result).not.toHaveProperty("partialSuccess");
    expect(result.referenceId?.startsWith("PRO-")).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("fails product lead and does not send email when Airtable fails", async () => {
    mockCreateLead.mockRejectedValue(new Error("Airtable failed"));

    const result = await processLead(validProductLead);

    expect(result).toEqual({
      success: false,
      emailSent: false,
      ownerNotified: false,
      recordCreated: false,
      referenceId: expect.stringMatching(/^PRO-/),
      error: "PROCESSING_FAILED",
    });
    expect(result).not.toHaveProperty("partialSuccess");
    expect(mockSendProductInquiryEmail).not.toHaveBeenCalled();
  });

  it("writes newsletter lead without sending any email", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-789" });

    const result = await processLead(validNewsletterLead);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        emailSent: false,
        ownerNotified: false,
        recordCreated: true,
      }),
    );
    expect(result).not.toHaveProperty("partialSuccess");
    expect(result.referenceId?.startsWith("NEW-")).toBe(true);
    expect(mockSendContactFormEmail).not.toHaveBeenCalled();
    expect(mockSendConfirmationEmail).not.toHaveBeenCalled();
    expect(mockSendProductInquiryEmail).not.toHaveBeenCalled();
  });

  it("fails newsletter lead without sending email when Airtable fails", async () => {
    mockCreateLead.mockRejectedValue(new Error("Airtable failed"));

    const result = await processLead(validNewsletterLead);

    expect(result).toEqual({
      success: false,
      emailSent: false,
      ownerNotified: false,
      recordCreated: false,
      referenceId: expect.stringMatching(/^NEW-/),
      error: "PROCESSING_FAILED",
    });
    expect(result).not.toHaveProperty("partialSuccess");
    expect(mockSendContactFormEmail).not.toHaveBeenCalled();
    expect(mockSendConfirmationEmail).not.toHaveBeenCalled();
    expect(mockSendProductInquiryEmail).not.toHaveBeenCalled();
  });
});
