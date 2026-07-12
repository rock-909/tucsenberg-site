import { beforeEach, describe, expect, it, vi } from "vitest";

import { AIRTABLE_REQUEST_TIMEOUT_MS } from "@/lib/airtable/service";
import { LEAD_TYPES } from "../lead-schema";
import { processLead } from "../process-lead";

const mockAfter = vi.hoisted(() => vi.fn());
const mockCreateLead = vi.hoisted(() => vi.fn());
const mockSendContactFormEmail = vi.hoisted(() => vi.fn());
const mockSendConfirmationEmail = vi.hoisted(() => vi.fn());
const mockSendProductInquiryEmail = vi.hoisted(() => vi.fn());

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

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
  CONTACT_FORM_VALIDATION_CONSTANTS: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 50,
    COMPANY_MAX_LENGTH: 100,
    MESSAGE_MIN_LENGTH: 10,
    MESSAGE_MAX_LENGTH: 1000,
    SUBJECT_MIN_LENGTH: 5,
    SUBJECT_MAX_LENGTH: 100,
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
  };

  const validProductLead = {
    type: LEAD_TYPES.PRODUCT,
    productInquiryKind: "catalog-product",
    fullName: "Jane Smith",
    email: "jane@example.com",
    catalogProductId: "abs-flood-barriers",
    quantity: "500 units",
    company: "Example Company",
    requirements: "Brand adaptation needed",
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

  it("starts contact owner email and Airtable delivery before either settles", async () => {
    const emailDelivery = createDeferred<string>();
    const recordDelivery = createDeferred<{ id: string }>();
    const events: string[] = [];

    mockSendContactFormEmail.mockImplementation(() => {
      events.push("owner-email-started");
      return emailDelivery.promise;
    });
    mockCreateLead.mockImplementation(() => {
      events.push("airtable-record-started");
      return recordDelivery.promise;
    });

    const resultPromise = processLead(validContactLead);
    await Promise.resolve();

    expect(mockSendContactFormEmail).toHaveBeenCalledTimes(1);
    expect(mockCreateLead).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["owner-email-started", "airtable-record-started"]);

    emailDelivery.resolve("email-id-123");
    recordDelivery.resolve({ id: "record-123" });

    await expect(resultPromise).resolves.toEqual(
      expect.objectContaining({
        success: true,
        emailSent: true,
        ownerNotified: true,
        recordCreated: true,
      }),
    );
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

  it("passes contact attribution fields to Airtable", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-contact-attribution" });
    mockSendContactFormEmail.mockResolvedValue("email-contact-attribution");

    const result = await processLead({
      ...validContactLead,
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "flood-barriers",
      gclid: "gclid-contact-123",
      landingPage: "/en/contact",
      capturedAt: "2026-07-04T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.CONTACT,
      expect.objectContaining({
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "flood-barriers",
        gclid: "gclid-contact-123",
        landingPage: "/en/contact",
        capturedAt: "2026-07-04T00:00:00.000Z",
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

  it("returns user success when contact owner email is sent and Airtable fails", async () => {
    mockCreateLead.mockRejectedValue(new Error("Airtable failed"));
    mockSendContactFormEmail.mockResolvedValue("email-id-123");

    const result = await processLead(validContactLead);

    expect(result).toEqual({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: false,
      referenceId: expect.stringMatching(/^CON-/),
    });
    expect(result).not.toHaveProperty("partialSuccess");
    expect(result.error).toBeUndefined();
    expect(mockSendContactFormEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: validContactLead.email,
      }),
    );
  });

  it("fails contact lead when both owner email and Airtable fail", async () => {
    mockCreateLead.mockRejectedValue(new Error("Airtable failed"));
    mockSendContactFormEmail.mockRejectedValue(new Error("Email failed"));

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
    expect(mockSendContactFormEmail).toHaveBeenCalled();
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

  it("starts product owner email and Airtable delivery before either settles", async () => {
    const emailDelivery = createDeferred<string>();
    const recordDelivery = createDeferred<{ id: string }>();
    const events: string[] = [];

    mockSendProductInquiryEmail.mockImplementation(() => {
      events.push("owner-email-started");
      return emailDelivery.promise;
    });
    mockCreateLead.mockImplementation(() => {
      events.push("airtable-record-started");
      return recordDelivery.promise;
    });

    const resultPromise = processLead(validProductLead);
    await Promise.resolve();

    expect(mockSendProductInquiryEmail).toHaveBeenCalledTimes(1);
    expect(mockCreateLead).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["owner-email-started", "airtable-record-started"]);

    emailDelivery.resolve("product-email-id");
    recordDelivery.resolve({ id: "record-456" });

    await expect(resultPromise).resolves.toEqual(
      expect.objectContaining({
        success: true,
        emailSent: true,
        ownerNotified: true,
        recordCreated: true,
      }),
    );
  });

  it("passes product attribution fields to Airtable", async () => {
    mockCreateLead.mockResolvedValue({ id: "record-product-attribution" });
    mockSendProductInquiryEmail.mockResolvedValue("email-product-attribution");

    const result = await processLead({
      ...validProductLead,
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "flood-barriers",
      gclid: "gclid-rfq-123",
      landingPage: "/en/request-quote",
      capturedAt: "2026-07-04T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.PRODUCT,
      expect.objectContaining({
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "flood-barriers",
        gclid: "gclid-rfq-123",
        landingPage: "/en/request-quote",
        capturedAt: "2026-07-04T00:00:00.000Z",
      }),
    );
  });

  it("returns user success when product owner email is sent and Airtable fails", async () => {
    mockCreateLead.mockRejectedValue(new Error("Airtable failed"));
    mockSendProductInquiryEmail.mockResolvedValue("product-email-id");

    const result = await processLead(validProductLead);

    expect(result).toEqual({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: false,
      referenceId: expect.stringMatching(/^PRO-/),
    });
    expect(result).not.toHaveProperty("partialSuccess");
    expect(result.error).toBeUndefined();
    expect(mockSendProductInquiryEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: validProductLead.email,
      }),
    );
  });

  it("fails product lead when both owner email and Airtable fail", async () => {
    mockCreateLead.mockRejectedValue(new Error("Airtable failed"));
    mockSendProductInquiryEmail.mockRejectedValue(new Error("Email failed"));

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
    expect(mockSendProductInquiryEmail).toHaveBeenCalled();
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
    expect(mockCreateLead).toHaveBeenCalledWith(
      LEAD_TYPES.NEWSLETTER,
      expect.objectContaining({
        email: validNewsletterLead.email,
        referenceId: expect.stringMatching(/^NEW-/),
      }),
    );
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

  describe("Airtable request budget (never-resolving Airtable must not hang)", () => {
    // Never-resolving CRM mock: proves the response is bounded by the request
    // budget, not by the Airtable SDK's 5-minute default.
    const neverResolves = () => new Promise<never>(() => {});

    it("resolves contact success within the budget when Airtable never settles", async () => {
      vi.useFakeTimers();
      try {
        mockSendContactFormEmail.mockResolvedValue("email-id-123");
        mockCreateLead.mockImplementation(neverResolves);

        const resultPromise = processLead(validContactLead);
        await vi.advanceTimersByTimeAsync(AIRTABLE_REQUEST_TIMEOUT_MS);
        const result = await resultPromise;

        expect(result).toEqual(
          expect.objectContaining({
            success: true,
            emailSent: true,
            ownerNotified: true,
            recordCreated: false,
          }),
        );
        expect(result.referenceId?.startsWith("CON-")).toBe(true);
        expect(result.error).toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });

    it("resolves product success within the budget when Airtable never settles", async () => {
      vi.useFakeTimers();
      try {
        mockSendProductInquiryEmail.mockResolvedValue("product-email-id");
        mockCreateLead.mockImplementation(neverResolves);

        const resultPromise = processLead(validProductLead);
        await vi.advanceTimersByTimeAsync(AIRTABLE_REQUEST_TIMEOUT_MS);
        const result = await resultPromise;

        expect(result).toEqual(
          expect.objectContaining({
            success: true,
            emailSent: true,
            ownerNotified: true,
            recordCreated: false,
          }),
        );
        expect(result.referenceId?.startsWith("PRO-")).toBe(true);
        expect(result.error).toBeUndefined();
      } finally {
        vi.useRealTimers();
      }
    });

    it("fails subscribe within the budget when Airtable never settles (no fake success)", async () => {
      vi.useFakeTimers();
      try {
        mockCreateLead.mockImplementation(neverResolves);

        const resultPromise = processLead(validNewsletterLead);
        await vi.advanceTimersByTimeAsync(AIRTABLE_REQUEST_TIMEOUT_MS);
        const result = await resultPromise;

        expect(result).toEqual({
          success: false,
          emailSent: false,
          ownerNotified: false,
          recordCreated: false,
          referenceId: expect.stringMatching(/^NEW-/),
          error: "PROCESSING_FAILED",
        });
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
