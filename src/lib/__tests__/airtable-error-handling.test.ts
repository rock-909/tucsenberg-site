import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AirtableBaseLike,
  AirtableServicePrivate,
} from "@/test/test-types";
import {
  configureServiceForTesting,
  createMockBase,
} from "@/test/airtable-helpers";
import type { AirtableService as AirtableServiceType } from "../airtable/service";
import type { ContactStatus } from "../airtable/types";

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

  describe("Error Handling - createLead (contact)", () => {
    const validLeadData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      company: "Test Company",
      message: "This is a test message",
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

      await expect(
        service.createLead("contact", validLeadData),
      ).rejects.toThrow("Failed to create lead record");
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

      await expect(
        service.createLead("contact", invalidLeadData),
      ).rejects.toThrow("Failed to create lead record");
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

      await expect(
        service.createLead("contact", validLeadData),
      ).rejects.toThrow("Failed to create lead record");
    });
  });

  describe("Error Handling - getContacts", () => {
    it("should handle API errors during retrieval", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ select: mockSelect }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      const mockSelectChain = {
        all: vi.fn().mockRejectedValue(new Error("API Error")),
      };
      mockSelect.mockClear();
      mockSelect.mockReturnValue(mockSelectChain);

      await expect(service.getContacts()).rejects.toThrow(
        "Failed to fetch contact records",
      );
    });

    it("should handle empty results gracefully", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ select: mockSelect }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      const mockSelectChain = {
        all: vi.fn().mockResolvedValue([]),
      };
      mockSelect.mockClear();
      mockSelect.mockReturnValue(mockSelectChain);

      const result = await service.getContacts();

      expect(result).toEqual([]);
    });

    it("should handle malformed records", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ select: mockSelect }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      const malformedRecords = [
        {
          id: "rec1",
          fields: null, // Malformed fields
          get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
        },
        {
          id: "rec2",
          // Missing fields property
          get: vi.fn().mockReturnValue("2023-01-02T00:00:00Z"),
        },
      ];

      const mockSelectChain = {
        all: vi.fn().mockResolvedValue(malformedRecords),
      };
      mockSelect.mockClear();
      mockSelect.mockReturnValue(mockSelectChain);

      const result = await service.getContacts();

      expect(result).toHaveLength(2);
      const [first, second] = result;
      expect(first).toBeDefined();
      expect(second).toBeDefined();
      if (!first || !second) {
        throw new Error("模拟Airtable返回值数量与断言不匹配");
      }
      expect(first.fields).toBeNull();
      expect(second.fields).toBeUndefined();
    });
  });

  describe("Error Handling - updateContactStatus", () => {
    it("should handle update errors", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ update: mockUpdate }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      mockUpdate.mockClear();
      mockUpdate.mockRejectedValue(new Error("Update failed"));

      await expect(
        service.updateContactStatus("rec123456", "Completed"),
      ).rejects.toThrow("Failed to update contact status");
    });

    it("should handle invalid record IDs", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ update: mockUpdate }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      mockUpdate.mockClear();
      mockUpdate.mockRejectedValue(new Error("Record not found"));

      await expect(
        service.updateContactStatus("invalid-id", "Completed"),
      ).rejects.toThrow("Failed to update contact status");
    });

    it("should handle invalid status values", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ update: mockUpdate }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      mockUpdate.mockClear();
      mockUpdate.mockRejectedValue(new Error("Invalid status value"));

      await expect(
        service.updateContactStatus(
          "rec123456",
          "InvalidStatus" as unknown as ContactStatus,
        ),
      ).rejects.toThrow("Failed to update contact status");
    });

    it("should throw error when service is not configured", async () => {
      const service = new AirtableServiceClass();

      // Mock initializeAirtable to prevent re-initialization
      const initSpy = vi.spyOn(service as any, "initializeAirtable");
      initSpy.mockImplementation(async () => {
        // Do nothing - keep service unconfigured
      });

      // Directly set service as not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(
        service.updateContactStatus("rec123456", "Completed"),
      ).rejects.toThrow("Airtable service is not configured");

      initSpy.mockRestore();
    });
  });

  describe("Error Handling - deleteContact", () => {
    it("should handle deletion errors", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ destroy: mockDestroy }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      mockDestroy.mockClear();
      mockDestroy.mockRejectedValue(new Error("Delete failed"));

      await expect(service.deleteContact("rec123456")).rejects.toThrow(
        "Failed to delete contact",
      );
    });

    it("should handle invalid record IDs for deletion", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({ destroy: mockDestroy }) as unknown as ReturnType<
              AirtableBaseLike["table"]
            >,
        ),
      );

      mockDestroy.mockClear();
      mockDestroy.mockRejectedValue(new Error("Record not found"));

      await expect(service.deleteContact("invalid-id")).rejects.toThrow(
        "Failed to delete contact",
      );
    });

    it("should throw error when service is not configured for deletion", async () => {
      const service = new AirtableServiceClass();

      // Mock initializeAirtable to prevent re-initialization
      const initSpy = vi.spyOn(service as any, "initializeAirtable");
      initSpy.mockImplementation(async () => {
        // Do nothing - keep service unconfigured
      });

      // Directly set service as not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(service.deleteContact("rec123456")).rejects.toThrow(
        "Airtable service is not configured",
      );

      initSpy.mockRestore();
    });
  });
});
