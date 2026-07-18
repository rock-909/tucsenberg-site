import { beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";
import { LEAD_TYPES } from "@/lib/lead-pipeline/lead-schema";

import { createLeadRecord } from "@/lib/airtable/service-internal/lead-records";

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("@/lib/__tests__/mocks/logger");
  return mockLogger;
});

const validLeadData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  company: "Test Company",
  message: "Test message",
  phone: "+1234567890",
};

function createMockBase(create: ReturnType<typeof vi.fn>) {
  return {
    table: vi.fn().mockReturnValue({ create }),
  };
}

describe("createLeadRecord error logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs errorType and statusCode for Airtable SDK-style plain errors", async () => {
    const airtableError = {
      error: "INVALID_VALUE_FOR_COLUMN",
      message:
        'Field "WhatsApp / Phone" cannot accept the provided value: +1234567890',
      statusCode: 422,
    };

    const mockCreate = vi.fn().mockRejectedValue(airtableError);
    const base = createMockBase(mockCreate);

    await expect(
      createLeadRecord({
        base: base as never,
        tableName: "Leads",
        type: LEAD_TYPES.CONTACT,
        data: validLeadData,
      }),
    ).rejects.toThrow("Failed to create lead record");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create lead record",
      expect.objectContaining({
        errorType: "INVALID_VALUE_FOR_COLUMN",
        statusCode: 422,
        type: LEAD_TYPES.CONTACT,
      }),
    );

    const logContext = vi.mocked(logger.error).mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(logContext).not.toHaveProperty("message");
    expect(JSON.stringify(logContext)).not.toContain("+1234567890");
    expect(JSON.stringify(logContext)).not.toContain("john.doe@example.com");
    expect(logContext.error).not.toBe("Unknown error");
  });

  it("logs Error message for standard Error instances", async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error("Network timeout"));
    const base = createMockBase(mockCreate);

    await expect(
      createLeadRecord({
        base: base as never,
        tableName: "Leads",
        type: LEAD_TYPES.CONTACT,
        data: validLeadData,
      }),
    ).rejects.toThrow("Failed to create lead record");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create lead record",
      expect.objectContaining({
        error: "Network timeout",
        type: LEAD_TYPES.CONTACT,
      }),
    );
  });

  it("logs Unknown error for unrecognized thrown values", async () => {
    const mockCreate = vi.fn().mockRejectedValue("unexpected string failure");
    const base = createMockBase(mockCreate);

    await expect(
      createLeadRecord({
        base: base as never,
        tableName: "Leads",
        type: LEAD_TYPES.CONTACT,
        data: validLeadData,
      }),
    ).rejects.toThrow("Failed to create lead record");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create lead record",
      expect.objectContaining({
        error: "Unknown error",
        type: LEAD_TYPES.CONTACT,
      }),
    );
  });
});
