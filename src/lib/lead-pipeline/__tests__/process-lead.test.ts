import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIRTABLE_REQUEST_TIMEOUT_MS } from "@/lib/airtable/service";
import { logger } from "@/lib/logger";
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
      referenceId: result.referenceId,
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

  it("gives owner email and Airtable the same reference the buyer receives", async () => {
    const result = await processValidatedInquiry(VALID_LEAD);
    const { referenceId } = result;

    expect(referenceId).toMatch(/^PRO-/);
    expect(mockSendProductInquiryEmail).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId }),
    );
    expect(mockCreateLead).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId }),
    );
  });

  it("keeps that reference in both provider failure logs", async () => {
    mockSendProductInquiryEmail.mockRejectedValue(new Error("email down"));
    mockCreateLead.mockRejectedValue(new Error("airtable down"));

    const { referenceId } = await processValidatedInquiry(VALID_LEAD);

    expect(referenceId).toMatch(/^PRO-/);
    expect(logger.error).toHaveBeenCalledWith(
      "Product owner email failed",
      expect.objectContaining({ referenceId }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      "Product Airtable createLead failed (non-blocking)",
      expect.objectContaining({ referenceId }),
    );
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

  it("marks the record when the owner email failed", async () => {
    mockSendProductInquiryEmail.mockRejectedValueOnce(new Error("resend down"));
    mockCreateLead.mockResolvedValueOnce({ id: "rec1" });

    const result = await processValidatedInquiry(VALID_LEAD);

    expect(result.success).toBe(true);
    const fields = mockCreateLead.mock.calls[0]?.[0];
    expect(fields.message).toContain("⚠️ NOTE:");
    expect(fields.message).toContain("FAILED to send");
    // 买家原文必须完整保留，提示只是前缀
    expect(fields.message).toContain(VALID_LEAD.message);
  });

  it("leaves the message untouched when the owner email succeeded", async () => {
    mockSendProductInquiryEmail.mockResolvedValueOnce(undefined);
    mockCreateLead.mockResolvedValueOnce({ id: "rec1" });

    await processValidatedInquiry(VALID_LEAD);

    const fields = mockCreateLead.mock.calls[0]?.[0];
    expect(fields.message).not.toContain("⚠️");
  });

  it("waits for the owner email to settle before touching airtable", async () => {
    let releaseEmail: () => void = () => undefined;
    mockSendProductInquiryEmail.mockImplementationOnce(
      () => new Promise<void>((resolve) => (releaseEmail = () => resolve())),
    );
    mockCreateLead.mockResolvedValueOnce({ id: "rec1" });

    const pending = processValidatedInquiry(VALID_LEAD);
    await Promise.resolve();

    // 邮件还没落定，Airtable 一次都不能被碰。并行版本此刻已经调过了。
    expect(mockCreateLead).not.toHaveBeenCalled();

    releaseEmail();
    await pending;
    expect(mockCreateLead).toHaveBeenCalledTimes(1);
  });

  it("still records the lead when the owner email times out", async () => {
    vi.useFakeTimers();
    // Resend 客户端 5 秒硬超时（resend-http-client.ts:28）。串行之后这是
    // 最坏路径的前半段，必须证明它超时后记录照样落地、且带上失败提示。
    // 注：`sendProductInquiryEmail` 在这里整体被 mock 掉了，resend-http-client.ts
    // 里真正的 AbortController 超时逻辑不会被执行到；要在假定时器下验证「超时后
    // 仍然落地」，mock 必须自己用 setTimeout 到点才 reject，否则一个永远不
    // settle 的 Promise 无计时器可推进，advanceTimersByTimeAsync 无从下手，
    // 会导致测试真实挂起到 vitest 的 testTimeout（实测过，见任务报告）。
    mockSendProductInquiryEmail.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject(new Error("Resend API request timed out"));
          }, 5_000);
        }),
    );
    mockCreateLead.mockResolvedValueOnce({ id: "rec1" });

    const pending = processValidatedInquiry(VALID_LEAD);
    await vi.advanceTimersByTimeAsync(5_000);
    const result = await pending;

    expect(result.success).toBe(true);
    expect(mockCreateLead.mock.calls[0]?.[0]?.message).toContain(
      "FAILED to send",
    );
    vi.useRealTimers();
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
