/**
 * Multiline lead field preservation
 *
 * A buyer's multi-line message/requirements must keep their line breaks all the
 * way from the schema boundary into the Airtable field value and the provider
 * email payload (via real ResendService, HTTP transport mocked only).
 * Single-line fields must still collapse internal whitespace.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sanitizeAirtableTextField } from "@/lib/airtable/service-internal/field-sanitization";
import type { DynamicImportModule } from "@/test/test-types";
import type { ResendService as ResendServiceInstance } from "@/lib/resend-core";
import {
  contactLeadSchema,
  LEAD_TYPES,
  productLeadSchema,
} from "@/lib/lead-pipeline/lead-schema";

type ResendServiceConstructor = new () => ResendServiceInstance;

const mockResendSend = vi.fn();

class ResendHttpEmailClientMock {
  public readonly send = mockResendSend;

  constructor(_apiKey: string) {}
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
    getRuntimeEnvString: (key: string) => env[key as keyof typeof env] ?? "",
    getRuntimeEnvBoolean: () => false,
    getRuntimeNodeEnv: () => "test",
    isRuntimeProduction: () => false,
    isRuntimePlaywright: () => false,
  };
});

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("@/lib/__tests__/mocks/logger");
  return mockLogger;
});

async function loadResendService(): Promise<ResendServiceConstructor> {
  mockResendSend.mockReset();
  const module = await import("@/lib/resend-core");
  const typedModule = module as DynamicImportModule;
  const ResendService = typedModule.ResendService ?? typedModule.default;
  if (typeof ResendService !== "function") {
    throw new Error("ResendService class 未找到，无法执行测试");
  }
  return ResendService as unknown as ResendServiceConstructor;
}

describe("multiline lead fields", () => {
  let ResendServiceClass: ResendServiceConstructor;

  beforeEach(async () => {
    ResendServiceClass = await loadResendService();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("keeps newlines in a contact message through schema, Airtable, and Resend payload", async () => {
    const parsed = contactLeadSchema.parse({
      type: LEAD_TYPES.CONTACT,
      fullName: "Jane Buyer",
      email: "jane@example.com",
      subject: "Product inquiry",
      message: "Line one\nLine two\nLine three",
      turnstileToken: "token",
    });

    expect(parsed.message).toBe("Line one\nLine two\nLine three");
    expect(sanitizeAirtableTextField(parsed.message)).toBe(
      "Line one\nLine two\nLine three",
    );

    mockResendSend.mockResolvedValue({
      data: { id: "contact-multiline-id" },
      error: null,
    });

    const service = new ResendServiceClass();
    await service.sendContactFormEmail({
      firstName: "Jane",
      lastName: "Buyer",
      email: parsed.email,
      message: parsed.message,
      submittedAt: "2026-05-30T08:30:00.000Z",
    });

    const payload = mockResendSend.mock.calls[0]?.[0] as {
      html: string;
      text: string;
    };

    expect(payload.text).toContain("Line one\nLine two\nLine three");
    expect(payload.html).toContain(">Line one</p>");
    expect(payload.html).toContain(">Line two</p>");
    expect(payload.html).toContain(">Line three</p>");
    expect(payload.html).not.toContain("Line one Line two Line three");
  });

  it("keeps newlines in product requirements through schema, Airtable, and Resend payload", async () => {
    const parsed = productLeadSchema.parse({
      type: LEAD_TYPES.PRODUCT,
      productInquiryKind: "catalog-product",
      fullName: "Pat Lee",
      email: "pat@example.com",
      catalogProductId: "abs-flood-barriers",
      quantity: "500 units",
      requirements: "Need custom height\nStainless finish",
    });

    expect(parsed.requirements).toBe("Need custom height\nStainless finish");
    expect(sanitizeAirtableTextField(parsed.requirements!)).toBe(
      "Need custom height\nStainless finish",
    );

    mockResendSend.mockResolvedValue({
      data: { id: "product-multiline-id" },
      error: null,
    });

    const service = new ResendServiceClass();
    await service.sendProductInquiryEmail({
      firstName: "Pat",
      lastName: "Lee",
      email: parsed.email,
      productName: "ABS Flood Barriers",
      quantity: parsed.quantity,
      requirements: parsed.requirements,
    });

    const payload = mockResendSend.mock.calls[0]?.[0] as {
      html: string;
      text: string;
    };

    expect(payload.text).toContain("Need custom height\nStainless finish");
    expect(payload.html).toContain(">Need custom height</p>");
    expect(payload.html).toContain(">Stainless finish</p>");
    expect(payload.html).not.toContain("Need custom height Stainless finish");
  });

  it("still collapses runs of spaces/tabs within a multiline field", () => {
    const parsed = contactLeadSchema.parse({
      type: LEAD_TYPES.CONTACT,
      fullName: "Jane Buyer",
      email: "jane@example.com",
      subject: "Product inquiry",
      message: "Line   one\t\thas   gaps\n\n\n\nLine two",
      turnstileToken: "token",
    });

    expect(parsed.message).toBe("Line one has gaps\n\nLine two");
  });

  it("still collapses newlines in single-line fields like fullName", () => {
    const parsed = contactLeadSchema.parse({
      type: LEAD_TYPES.CONTACT,
      fullName: "Jane\nBuyer",
      email: "jane@example.com",
      subject: "Product inquiry",
      message: "This is a long enough message.",
      turnstileToken: "token",
    });

    expect(parsed.fullName).toBe("Jane Buyer");
  });
});
