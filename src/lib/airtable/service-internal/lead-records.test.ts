import { beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

import { createLeadRecord } from "@/lib/airtable/service-internal/lead-records";

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("@/lib/__tests__/mocks/logger");
  return mockLogger;
});

const validProductLeadData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  message: "Test message",
  productName: "ABS Flood Barriers",
  catalogProductId: "abs-flood-barriers",
};

function createMockBase(create: ReturnType<typeof vi.fn>) {
  return {
    table: vi.fn().mockReturnValue({ create }),
  };
}

describe("createLeadRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([undefined, null, "", "   "])(
    "rejects an Airtable create result with invalid id %j",
    async (id) => {
      const mockCreate = vi.fn().mockResolvedValue({ id });
      const base = createMockBase(mockCreate);

      await expect(
        createLeadRecord({
          base: base as never,
          tableName: "Leads",
          data: validProductLeadData,
        }),
      ).rejects.toThrow("Failed to create lead record");
    },
  );

  it("normalizes a valid Airtable record id", async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: " rec-123 " });
    const base = createMockBase(mockCreate);

    await expect(
      createLeadRecord({
        base: base as never,
        tableName: "Leads",
        data: validProductLeadData,
      }),
    ).resolves.toEqual({ id: "rec-123" });
  });

  it("logs errorType and statusCode for Airtable SDK-style plain errors", async () => {
    const airtableError = {
      error: "INVALID_VALUE_FOR_COLUMN",
      message: 'Field "Product Name" cannot accept the provided value',
      statusCode: 422,
    };

    const mockCreate = vi.fn().mockRejectedValue(airtableError);
    const base = createMockBase(mockCreate);

    await expect(
      createLeadRecord({
        base: base as never,
        tableName: "Leads",
        data: validProductLeadData,
      }),
    ).rejects.toThrow("Failed to create lead record");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create lead record",
      expect.objectContaining({
        errorType: "INVALID_VALUE_FOR_COLUMN",
        statusCode: 422,
      }),
    );

    const logContext = vi.mocked(logger.error).mock.calls[0]?.[1] as Record<
      string,
      unknown
    >;
    expect(logContext).not.toHaveProperty("message");
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
        data: validProductLeadData,
      }),
    ).rejects.toThrow("Failed to create lead record");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create lead record",
      expect.objectContaining({
        error: "Network timeout",
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
        data: validProductLeadData,
      }),
    ).rejects.toThrow("Failed to create lead record");

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to create lead record",
      expect.objectContaining({
        error: "Unknown error",
      }),
    );
  });
});
