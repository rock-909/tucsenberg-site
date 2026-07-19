import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AirtableBaseLike } from "@/test/test-types";
import {
  configureServiceForTesting,
  createMockBase,
} from "@/test/airtable-helpers";
import type { AirtableService as AirtableServiceType } from "../airtable/service";

// Mock Airtable
const mockCreate = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDestroy = vi.fn();
const mockTable = vi.fn().mockReturnValue({
  create: mockCreate,
  select: mockSelect,
  update: mockUpdate,
  destroy: mockDestroy,
});

const tableFactory: AirtableBaseLike["table"] = (_name) => {
  // Parameter renamed with underscore to indicate it's intentionally unused
  return mockTable() as ReturnType<AirtableBaseLike["table"]>;
};

const mockBase = vi.fn(() => createMockBase(tableFactory));
const mockConfigure = vi.fn();

const _setServiceReady = (service: unknown) =>
  configureServiceForTesting(service, createMockBase(tableFactory));

vi.mock("airtable", () => ({
  default: {
    configure: mockConfigure,
    base: mockBase,
  },
}));

// Use TypeScript Mock modules to bypass Vite's special handling
vi.mock("@/lib/env", async () => {
  const mockEnv = await import("./mocks/airtable-env");
  return mockEnv;
});

vi.mock("@/lib/logger", async () => {
  const mockLogger = await import("./mocks/logger");
  return mockLogger;
});

vi.mock("./validations", async () => {
  const mockValidations = await import("./mocks/airtable-validations");
  return mockValidations;
});

describe("Airtable Error Handling Tests", () => {
  let AirtableServiceClass: typeof AirtableServiceType;

  beforeEach(async () => {
    // Clear mocks but preserve the mock functions
    mockCreate.mockReset();
    mockSelect.mockReset();
    mockUpdate.mockReset();
    mockDestroy.mockReset();
    mockTable.mockClear();
    mockBase.mockClear();
    mockConfigure.mockClear();

    // Reset modules to ensure fresh imports
    vi.resetModules();

    // Import the service fresh for each test
    const AirtableModule = await import("../airtable/service");
    AirtableServiceClass =
      AirtableModule.AirtableService as typeof AirtableServiceType;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Error Handling - createLead (product inquiry)", () => {
    const validLeadData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      message: "This is a test message",
      productName: "ABS Flood Barriers",
    };

    it("should handle API errors during creation", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ create: mockCreate }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      mockCreate.mockClear();
      mockCreate.mockRejectedValue(new Error("API Error"));

      await expect(service.createLead(validLeadData)).rejects.toThrow(
        "Failed to create lead record",
      );
    });

    it("should handle validation errors", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ create: mockCreate }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      const invalidLeadData = {
        ...validLeadData,
        email: "invalid-email", // Invalid email format
      };

      mockCreate.mockClear();
      mockCreate.mockRejectedValue(new Error("Invalid email format"));

      await expect(service.createLead(invalidLeadData)).rejects.toThrow(
        "Failed to create lead record",
      );
    });

    it("should handle network timeouts", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ create: mockCreate }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      mockCreate.mockClear();
      mockCreate.mockRejectedValue(new Error("Network timeout"));

      await expect(service.createLead(validLeadData)).rejects.toThrow(
        "Failed to create lead record",
      );
    });
  });
});
