import { beforeEach, describe, expect, it, vi } from "vitest";

import { CONTACT_SUBJECTS, LEAD_TYPES } from "../lead-schema";
import { processLead } from "../process-lead";

const mockCreateLead = vi.hoisted(() => vi.fn());
const mockSendContactFormEmail = vi.hoisted(() => vi.fn());
const mockSendConfirmationEmail = vi.hoisted(() => vi.fn());
const mockSendProductInquiryEmail = vi.hoisted(() => vi.fn());
const mockAfter = vi.hoisted(() => vi.fn());
const mockLoggerInfo = vi.hoisted(() => vi.fn());
const mockLoggerWarn = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());

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
    info: mockLoggerInfo,
    warn: mockLoggerWarn,
    error: mockLoggerError,
  },
  sanitizeEmail: (email: string | undefined | null) =>
    email ? "[REDACTED_EMAIL]" : "[NO_EMAIL]",
}));

vi.mock("@/config/contact-form-config", () => ({
  CONTACT_FORM_CONFIG: {
    features: {
      sendConfirmationEmail: true,
    },
  },
  CONTACT_FORM_VALIDATION_CONSTANTS: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 50,
    COMPANY_MAX_LENGTH: 100,
    MESSAGE_MIN_LENGTH: 10,
    MESSAGE_MAX_LENGTH: 2000,
    SUBJECT_MIN_LENGTH: 5,
    SUBJECT_MAX_LENGTH: 100,
  },
}));

const VALID_CONTACT_LEAD = {
  type: LEAD_TYPES.CONTACT,
  fullName: "John Doe",
  email: "john@example.com",
  subject: CONTACT_SUBJECTS.PRODUCT_INQUIRY,
  message: "This is a test message with enough characters.",
  turnstileToken: "valid-token",
  company: "Test Company",
};

describe("processLead observability contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs validation failures with requestId context", async () => {
    const result = await processLead(null, { requestId: "req-validation" });

    expect(result).toEqual({
      success: false,
      emailSent: false,
      ownerNotified: false,
      recordCreated: false,
      error: "VALIDATION_ERROR",
    });
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "Lead validation failed",
      expect.objectContaining({
        errors: expect.any(Array),
        requestId: "req-validation",
      }),
    );
  });

  it("logs accepted contact lead with requestId before direct transaction work", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-123" });
    mockSendContactFormEmail.mockResolvedValue("email-123");

    const result = await processLead(VALID_CONTACT_LEAD, {
      requestId: "req-success",
    });

    expect(result.success).toBe(true);
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "Processing lead",
      expect.objectContaining({
        type: LEAD_TYPES.CONTACT,
        email: "[REDACTED_EMAIL]",
        leadDeliveryPolicy: "email-first-storage-optional",
        referenceId: expect.stringMatching(/^CON-/),
        requestId: "req-success",
      }),
    );
  });

  it("logs contact Airtable failures as non-blocking after owner email succeeds", async () => {
    mockCreateLead.mockRejectedValue(new Error("CRM failed"));
    mockSendContactFormEmail.mockResolvedValue("email-123");

    const result = await processLead(VALID_CONTACT_LEAD, {
      requestId: "req-crm-failed",
    });

    expect(result).toEqual({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: false,
      referenceId: expect.stringMatching(/^CON-/),
    });
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Contact Airtable createLead failed (non-blocking)",
      expect.objectContaining({
        error: "CRM failed",
        email: "[REDACTED_EMAIL]",
        leadDeliveryPolicy: "email-first-storage-optional",
        referenceId: expect.stringMatching(/^CON-/),
        requestId: "req-crm-failed",
      }),
    );
    expect(mockSendContactFormEmail).toHaveBeenCalled();
  });

  it("logs contact owner email failure while keeping the user-facing submission successful", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-123" });
    mockSendContactFormEmail.mockRejectedValue(new Error("Email failed"));

    const result = await processLead(VALID_CONTACT_LEAD, {
      requestId: "req-email-failed",
    });

    expect(result).toEqual({
      success: true,
      emailSent: false,
      ownerNotified: false,
      recordCreated: true,
      referenceId: expect.stringMatching(/^CON-/),
    });
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Contact owner email failed",
      expect.objectContaining({
        error: "Email failed",
        email: "[REDACTED_EMAIL]",
        referenceId: expect.stringMatching(/^CON-/),
        requestId: "req-email-failed",
      }),
    );
    expect(result).not.toHaveProperty("partialSuccess");
  });

  it("logs confirmation scheduling failures without blocking user success", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-123" });
    mockSendContactFormEmail.mockResolvedValue("email-123");
    mockAfter.mockImplementation(() => {
      throw new Error("after unavailable");
    });

    const result = await processLead(VALID_CONTACT_LEAD, {
      requestId: "req-unexpected",
    });

    expect(result).toEqual({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
      referenceId: expect.stringMatching(/^CON-/),
    });
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Confirmation email scheduling failed (non-blocking)",
      expect.objectContaining({
        error: "after unavailable",
        email: "[REDACTED_EMAIL]",
        referenceId: expect.stringMatching(/^CON-/),
        requestId: "req-unexpected",
      }),
    );
  });

  it("returns a controlled failure when top-level processing throws", async () => {
    mockLoggerInfo.mockImplementationOnce(() => {
      throw new Error("logger unavailable");
    });

    const result = await processLead(VALID_CONTACT_LEAD, {
      requestId: "req-top-level",
    });

    expect(result).toEqual({
      success: false,
      emailSent: false,
      ownerNotified: false,
      recordCreated: false,
      referenceId: expect.stringMatching(/^CON-/),
      error: "PROCESSING_FAILED",
    });
    expect(mockCreateLead).not.toHaveBeenCalled();
    expect(mockSendContactFormEmail).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      "Lead processing unexpected error",
      expect.objectContaining({
        type: LEAD_TYPES.CONTACT,
        error: "logger unavailable",
        referenceId: expect.stringMatching(/^CON-/),
        requestId: "req-top-level",
      }),
    );
  });
});
