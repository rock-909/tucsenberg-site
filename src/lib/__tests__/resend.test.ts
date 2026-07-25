import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DynamicImportModule } from "@/test/test-types";
import type { ResendService as ResendServiceInstance } from "../resend-core";

type ResendServiceConstructor = new () => ResendServiceInstance;

const mockResendSend = vi.fn();
const mockResendCtorCalls = vi.fn();

class ResendHttpEmailClientMock {
  public readonly send = mockResendSend;

  constructor(apiKey: string) {
    mockResendCtorCalls(apiKey);
  }
}

vi.mock("@/lib/email/resend-http-client", () => ({
  ResendHttpEmailClient: ResendHttpEmailClientMock,
}));

vi.mock("@/lib/env", () => {
  const env = {
    RESEND_API_KEY: "test-resend-key",
    EMAIL_FROM: "test@example.com",
    EMAIL_REPLY_TO: "reply@example.com",
    NODE_ENV: "test",
  };

  return {
    env,
    runtimeEnv: env,
    getRuntimeEnvString: (key: string) => {
      const runtimeEnv = {
        RESEND_API_KEY: "test-resend-key",
        EMAIL_FROM: "test@example.com",
        EMAIL_REPLY_TO: "reply@example.com",
        NODE_ENV: "test",
      } as const;
      return runtimeEnv[key as keyof typeof runtimeEnv] ?? "";
    },
    getRuntimeEnvBoolean: () => false,
    getRuntimeNodeEnv: () => "test",
    isRuntimeProduction: () => false,
    isRuntimePlaywright: () => false,
  };
});

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("./mocks/logger");
  return mockLogger;
});

const setupResendTest = async (): Promise<ResendServiceConstructor> => {
  mockResendSend.mockReset();
  mockResendCtorCalls.mockClear();

  const module = await import("../resend-core");
  const typedModule = module as DynamicImportModule;
  const ResendService = typedModule.ResendService ?? typedModule.default;
  if (typeof ResendService !== "function") {
    throw new Error("ResendService class 未找到，无法执行测试");
  }
  return ResendService as unknown as ResendServiceConstructor;
};

describe("resend - Service Initialization", () => {
  let ResendServiceClass: ResendServiceConstructor;

  beforeEach(async () => {
    ResendServiceClass = await setupResendTest();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("initializes successfully with valid API key", async () => {
    const service = new ResendServiceClass();
    expect(service.isReady()).toBe(true);
    expect(mockResendCtorCalls).toHaveBeenCalledWith("test-resend-key");
    expect(typeof service.sendProductInquiryEmail).toBe("function");
  });
});

describe("resend - sendProductInquiryEmail", () => {
  let ResendServiceClass: ResendServiceConstructor;

  const validProductInquiryData = {
    referenceId: "PRO-abc123-deadbeef",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    productName: "Enterprise Widget",
    requirements: "Need bulk pricing",
  };

  beforeEach(async () => {
    ResendServiceClass = await setupResendTest();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("sends product inquiry email successfully", async () => {
    const service = new ResendServiceClass();

    mockResendSend.mockResolvedValue({
      data: { id: "product-inquiry-id" },
      error: null,
    });

    const result = await service.sendProductInquiryEmail(
      validProductInquiryData,
    );

    const payload = mockResendSend.mock.calls[0]?.[0];

    expect(result).toBe("product-inquiry-id");
    expect(payload).toEqual(
      expect.objectContaining({
        from: "test@example.com",
        to: ["reply@example.com"],
        replyTo: "jane.smith@example.com",
        subject: expect.stringContaining("Enterprise Widget"),
        html: expect.stringContaining("Enterprise Widget"),
        text: expect.stringContaining("Enterprise Widget"),
        tags: expect.arrayContaining([
          { name: "type", value: "product-inquiry" },
        ]),
      }),
    );
    expect(payload).not.toHaveProperty("react");

    // One reference the buyer can quote must reach subject, body, and provider metadata.
    expect(payload.subject).toContain("PRO-abc123-deadbeef");
    expect(payload.text).toContain("PRO-abc123-deadbeef");
    expect(payload.html).toContain("PRO-abc123-deadbeef");
    expect(payload.tags).toContainEqual({
      name: "reference-id",
      value: "PRO-abc123-deadbeef",
    });
  });

  it("sanitizes product inquiry data before rendering without expanding buyer placeholders", async () => {
    const service = new ResendServiceClass();
    const emailData = {
      ...validProductInquiryData,
      email: "JANE@EXAMPLE.COM",
      productName: "<Pump {lastName}>",
      requirements: "Need {lastName}\n\nwith data:text/plain and onclick=alert",
    };

    mockResendSend.mockResolvedValue({
      data: { id: "product-inquiry-id" },
      error: null,
    });

    await service.sendProductInquiryEmail(emailData);

    const payload = mockResendSend.mock.calls[0]?.[0];

    expect(payload).not.toHaveProperty("react");
    expect(payload.html).toContain("&lt;Pump {lastName}&gt;");
    expect(payload.text).toContain("<Pump {lastName}>");
    expect(payload.text).toContain(
      "Need {lastName}\n\nwith data:text/plain and onclick=alert",
    );
    expect(payload.html).not.toContain("<Pump");
  });

  it("handles API errors for product inquiry", async () => {
    const service = new ResendServiceClass();
    mockResendSend.mockResolvedValue({
      data: null,
      error: { message: "Product Inquiry API Error" },
    });

    await expect(
      service.sendProductInquiryEmail(validProductInquiryData),
    ).rejects.toThrow("Failed to send product inquiry email");
  });

  it("handles network errors for product inquiry", async () => {
    const service = new ResendServiceClass();
    mockResendSend.mockRejectedValue(new Error("Network error"));

    await expect(
      service.sendProductInquiryEmail(validProductInquiryData),
    ).rejects.toThrow("Failed to send product inquiry email");
  });

  it("logs the reference on both delivery outcomes so a quoted reference is traceable", async () => {
    const { logger } = await import("@/lib/logger");
    const service = new ResendServiceClass();

    mockResendSend.mockResolvedValue({
      data: { id: "product-inquiry-id" },
      error: null,
    });
    await service.sendProductInquiryEmail(validProductInquiryData);

    expect(logger.info).toHaveBeenCalledWith(
      "Product inquiry email sent successfully",
      expect.objectContaining({ referenceId: "PRO-abc123-deadbeef" }),
    );

    mockResendSend.mockRejectedValue(new Error("Network error"));
    await expect(
      service.sendProductInquiryEmail(validProductInquiryData),
    ).rejects.toThrow("Failed to send product inquiry email");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to send product inquiry email",
      expect.objectContaining({ referenceId: "PRO-abc123-deadbeef" }),
    );
  });
});
