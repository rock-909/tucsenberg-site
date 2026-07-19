import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIRTABLE_REQUEST_TIMEOUT_MS } from "@/lib/airtable/service";
import {
  PRODUCT_INQUIRY_KINDS,
  PRODUCT_LEAD_TYPE,
  type ProductLeadInput,
} from "../lead-schema";
import { processValidatedInquiry } from "../process-lead";

const { mockCreateLead, mockSendProductInquiryEmail } = vi.hoisted(() => ({
  mockCreateLead: vi.fn(),
  mockSendProductInquiryEmail: vi.fn(),
}));

vi.mock("@/lib/airtable/instance", () => ({
  airtableService: { createLead: mockCreateLead },
}));
vi.mock("@/lib/resend-instance", () => ({
  resendService: { sendProductInquiryEmail: mockSendProductInquiryEmail },
}));
vi.mock("@/lib/logger", async () => import("@/lib/__tests__/mocks/logger"));

const VALID_LEAD: ProductLeadInput = {
  type: PRODUCT_LEAD_TYPE,
  productInquiryKind: PRODUCT_INQUIRY_KINDS.CATALOG_PRODUCT,
  fullName: "Jane Buyer",
  email: "jane@example.com",
  message: "Need custom height\nStainless finish",
  catalogProductId: "abs-flood-barriers",
  buyerInterest: "OEM branding",
};

describe("processValidatedInquiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateLead.mockResolvedValue({ id: "rec-123" });
    mockSendProductInquiryEmail.mockResolvedValue("email-123");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delivers one validated inquiry to product email and Airtable", async () => {
    const result = await processValidatedInquiry(VALID_LEAD);

    expect(result).toMatchObject({
      success: true,
      emailSent: true,
      ownerNotified: true,
      recordCreated: true,
    });
    expect(result.referenceId).toMatch(/^PRO-/);
    expect(mockSendProductInquiryEmail).toHaveBeenCalledWith({
      firstName: "Jane",
      lastName: "Buyer",
      email: "jane@example.com",
      productName: "ABS Interlocking Boxwall",
      requirements:
        "Interest: OEM branding\nNeed custom height\nStainless finish",
    });
    expect(mockCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Jane",
        lastName: "Buyer",
        email: "jane@example.com",
        productName: "ABS Interlocking Boxwall",
        catalogProductId: "abs-flood-barriers",
        requirements: "Need custom height\nStainless finish",
        message: expect.stringContaining("Requirements: Need custom height"),
        referenceId: expect.stringMatching(/^PRO-/),
      }),
    );
    expect(mockCreateLead.mock.calls[0]?.[0]).not.toHaveProperty("company");
    expect(mockCreateLead.mock.calls[0]?.[0]).not.toHaveProperty("quantity");
  });

  it("starts email and Airtable delivery in parallel", async () => {
    let releaseEmail!: () => void;
    let releaseAirtable!: () => void;
    mockSendProductInquiryEmail.mockReturnValue(
      new Promise<string>((resolve) => {
        releaseEmail = () => resolve("email-123");
      }),
    );
    mockCreateLead.mockReturnValue(
      new Promise<{ id: string }>((resolve) => {
        releaseAirtable = () => resolve({ id: "rec-123" });
      }),
    );

    const resultPromise = processValidatedInquiry(VALID_LEAD);
    await Promise.resolve();

    expect(mockSendProductInquiryEmail).toHaveBeenCalledOnce();
    expect(mockCreateLead).toHaveBeenCalledOnce();
    releaseEmail();
    releaseAirtable();
    await expect(resultPromise).resolves.toMatchObject({ success: true });
  });

  it("succeeds when either delivery channel succeeds", async () => {
    mockSendProductInquiryEmail.mockRejectedValueOnce(new Error("email down"));
    await expect(processValidatedInquiry(VALID_LEAD)).resolves.toMatchObject({
      success: true,
      emailSent: false,
      recordCreated: true,
    });

    mockSendProductInquiryEmail.mockResolvedValueOnce("email-456");
    mockCreateLead.mockRejectedValueOnce(new Error("airtable down"));
    await expect(processValidatedInquiry(VALID_LEAD)).resolves.toMatchObject({
      success: true,
      emailSent: true,
      recordCreated: false,
    });
  });

  it("fails only when both delivery channels fail", async () => {
    mockSendProductInquiryEmail.mockRejectedValue(new Error("email down"));
    mockCreateLead.mockRejectedValue(new Error("airtable down"));

    await expect(processValidatedInquiry(VALID_LEAD)).resolves.toMatchObject({
      success: false,
      emailSent: false,
      ownerNotified: false,
      recordCreated: false,
      referenceId: expect.stringMatching(/^PRO-/),
      error: "PROCESSING_FAILED",
    });
  });

  it("passes attribution fields to the single Airtable record", async () => {
    await processValidatedInquiry({
      ...VALID_LEAD,
      utmSource: "google",
      utmMedium: "cpc",
      gclid: "gclid-123",
    });

    expect(mockCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({
        utmSource: "google",
        utmMedium: "cpc",
        gclid: "gclid-123",
      }),
    );
  });

  it("does not hang when Airtable exceeds its request budget", async () => {
    vi.useFakeTimers();
    mockCreateLead.mockReturnValue(new Promise(() => {}));

    const resultPromise = processValidatedInquiry(VALID_LEAD);
    await vi.advanceTimersByTimeAsync(AIRTABLE_REQUEST_TIMEOUT_MS);

    await expect(resultPromise).resolves.toMatchObject({
      success: true,
      emailSent: true,
      recordCreated: false,
    });
  });
});
