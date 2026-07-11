import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AirtableBaseLike,
  AirtableServicePrivate,
} from "@/test/test-types";
import type { AirtableService as AirtableServiceType } from "../airtable/service";
import {
  configureServiceForTesting,
  createMockBase,
} from "./mocks/airtable-test-helpers";

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

const setServiceReady = (service: unknown) =>
  configureServiceForTesting(
    service as AirtableServicePrivate,
    createMockBase(tableFactory),
  );

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

describe("Airtable Advanced Tests", () => {
  let AirtableServiceClass: typeof AirtableServiceType;

  beforeEach(async () => {
    // Clear mocks but preserve the mock functions
    mockCreate.mockReset();
    mockSelect.mockReset();
    mockUpdate.mockReset();
    mockDestroy.mockReset();
    mockTable.mockClear().mockReturnValue({
      create: mockCreate,
      select: mockSelect,
      update: mockUpdate,
      destroy: mockDestroy,
    });
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

  describe("Edge Cases", () => {
    it("should handle very large lead data", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      setServiceReady(service);

      const largeLeadData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        company: "Test Company",
        message: "A".repeat(10000), // Very large message
      };

      const mockRecord = {
        id: "rec123456",
        fields: {},
        get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
      };

      mockCreate.mockClear();
      mockCreate.mockResolvedValue([mockRecord]);

      const result = await service.createLead("contact", largeLeadData);

      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalled();
    });

    it("should handle special characters in lead data", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      setServiceReady(service);

      const specialCharLeadData = {
        firstName: "José",
        lastName: "García-López",
        email: "jose.garcia@example.com", // Use ASCII-compatible email
        company: "Tëst Çömpäny",
        message: "Special chars: àáâãäåæçèéêë",
      };

      const mockRecord = {
        id: "rec123456",
        fields: {},
        get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
      };

      mockCreate.mockClear();
      mockCreate.mockResolvedValue([mockRecord]);

      const result = await service.createLead("contact", specialCharLeadData);

      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          fields: expect.objectContaining({
            "First Name": "José",
            "Last Name": "García-López",
            Email: "jose.garcia@example.com",
          }),
        }),
      ]);
    });

    it("should handle concurrent operations", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      (service as unknown as AirtableServicePrivate).isConfigured = true;
      (service as unknown as AirtableServicePrivate).base = {
        table: vi.fn().mockReturnValue({
          create: mockCreate,
        }),
      };

      const mockRecord = {
        id: "rec123456",
        fields: {},
        get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
      };

      mockCreate.mockClear();
      mockCreate.mockResolvedValue([mockRecord]);

      const leadData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        company: "Test Company",
        message: "Test message",
      };

      // Run concurrent lead creations
      const promises = [
        service.createLead("contact", leadData),
        service.createLead("contact", { ...leadData, firstName: "Jane" }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });
});
