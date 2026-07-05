/**
 * Airtable Tests - Index
 *
 * Basic integration tests for Airtable service functionality.
 * For comprehensive testing, see:
 * - airtable-basic.test.ts - Basic CRUD operations
 * - airtable-advanced.test.ts - Advanced functionality and error handling
 */

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

interface MockAirtableEnv {
  AIRTABLE_API_KEY?: string;
  AIRTABLE_BASE_ID?: string;
  AIRTABLE_TABLE_NAME?: string;
}

function createEnvMock(envValues: MockAirtableEnv) {
  return {
    env: envValues,
    getRuntimeEnvString: (key: string) =>
      envValues[key as keyof MockAirtableEnv],
  };
}

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

describe("Airtable Tests - Index", () => {
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

  describe("Basic Configuration", () => {
    it("should configure Airtable with valid environment variables", async () => {
      vi.doMock("@/lib/env", () =>
        createEnvMock({
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          AIRTABLE_TABLE_NAME: "test-table",
        }),
      );

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service).toBeDefined();
    });

    it("should use default table name when not provided", async () => {
      vi.doMock("@/lib/env", () =>
        createEnvMock({
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          // Missing AIRTABLE_TABLE_NAME
        }),
      );

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service).toBeDefined();
    });
  });

  describe("Basic createLead (contact)", () => {
    const validLeadData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      company: "Test Company",
      message: "This is a test message",
    };

    it("should create lead record successfully", async () => {
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

      const mockRecord = {
        id: "rec123456",
        fields: {
          "First Name": "John",
          "Last Name": "Doe",
          Email: "john.doe@example.com",
          Company: "Test Company",
          Message: "This is a test message",
          Status: "New",
        },
        get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
      };

      mockCreate.mockClear();
      mockCreate.mockResolvedValue([mockRecord]);

      const result = await service.createLead("contact", validLeadData);

      expect(result).toEqual({
        id: "rec123456",
        fields: mockRecord.fields,
        createdTime: "2023-01-01T00:00:00Z",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        expect.objectContaining({
          fields: expect.objectContaining({
            "First Name": "John",
            "Last Name": "Doe",
            Email: "john.doe@example.com",
            Company: "Test Company",
            Message: "This is a test message",
            Status: "New",
            Source: "Website Contact Form",
          }),
        }),
      ]);
    });

    it("should write sanitized attribution fields to Airtable", async () => {
      const service = new AirtableServiceClass();

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
      mockCreate.mockResolvedValue([
        {
          id: "rec-attribution",
          fields: {},
          get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
        },
      ]);

      await service.createLead("contact", {
        ...validLeadData,
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: '=IMPORTXML("https://example.test")',
        gclid: "gclid-123",
        landingPage: "/en/contact",
        capturedAt: "2026-07-04T00:00:00.000Z",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "UTM Source": "google",
            "UTM Medium": "cpc",
            "UTM Campaign": '\'=IMPORTXML("https://example.test")',
            GCLID: "gclid-123",
            "Landing Page": "/en/contact",
            "Captured At": "2026-07-04T00:00:00.000Z",
          }),
        },
      ]);
    });

    it("should throw error when service is not configured", async () => {
      const service = new AirtableServiceClass();

      // Mock initializeAirtable to prevent re-initialization
      const initSpy = vi.spyOn(service as any, "initializeAirtable");
      initSpy.mockImplementation(async () => {
        // Do nothing - keep service unconfigured
      });

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(
        service.createLead("contact", validLeadData),
      ).rejects.toThrow("Airtable service is not configured");

      initSpy.mockRestore();
    });
  });

  describe("Basic getContacts", () => {
    it("should retrieve contact records successfully", async () => {
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

      const mockRecords = [
        {
          id: "rec1",
          fields: { "First Name": "John", "Last Name": "Doe" },
          get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
        },
        {
          id: "rec2",
          fields: { "First Name": "Jane", "Last Name": "Smith" },
          get: vi.fn().mockReturnValue("2023-01-02T00:00:00Z"),
        },
      ];

      const mockSelectChain = {
        all: vi.fn().mockResolvedValue(mockRecords),
      };
      mockSelect.mockClear();
      mockSelect.mockReturnValue(mockSelectChain);

      const result = await service.getContacts();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "rec1",
        fields: { "First Name": "John", "Last Name": "Doe" },
        createdTime: "2023-01-01T00:00:00Z",
      });
    });

    it("should throw error when service is not configured", async () => {
      const service = new AirtableServiceClass();

      // Mock initializeAirtable to prevent re-initialization
      const initSpy = vi.spyOn(service as any, "initializeAirtable");
      initSpy.mockImplementation(async () => {
        // Do nothing - keep service unconfigured
      });

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(service.getContacts()).rejects.toThrow(
        "Airtable service is not configured",
      );

      initSpy.mockRestore();
    });
  });

  describe("Basic updateContactStatus", () => {
    it("should update contact status successfully", async () => {
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
      mockUpdate.mockResolvedValue([
        {
          id: "rec123456",
          fields: { Status: "Completed" },
          get: vi.fn().mockReturnValue("2023-01-01T00:00:00Z"),
        },
      ]);

      await service.updateContactStatus("rec123456", "Completed");

      expect(mockUpdate).toHaveBeenCalledWith([
        {
          id: "rec123456",
          fields: {
            Status: "Completed",
            "Updated At": expect.any(String),
          },
        },
      ]);
    });

    it("should throw error when service is not configured", async () => {
      const service = new AirtableServiceClass();

      // Mock initializeAirtable to prevent re-initialization
      const initSpy = vi.spyOn(service as any, "initializeAirtable");
      initSpy.mockImplementation(async () => {
        // Do nothing - keep service unconfigured
      });

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(
        service.updateContactStatus("rec123456", "Completed"),
      ).rejects.toThrow("Airtable service is not configured");

      initSpy.mockRestore();
    });
  });

  describe("Basic deleteContact", () => {
    it("should delete contact successfully", async () => {
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
      mockDestroy.mockResolvedValue([{ id: "rec123456", deleted: true }]);

      await service.deleteContact("rec123456");

      expect(mockDestroy).toHaveBeenCalledWith(["rec123456"]);
    });

    it("should throw error when service is not configured", async () => {
      const service = new AirtableServiceClass();

      // Mock initializeAirtable to prevent re-initialization
      const initSpy = vi.spyOn(service as any, "initializeAirtable");
      initSpy.mockImplementation(async () => {
        // Do nothing - keep service unconfigured
      });

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(service.deleteContact("rec123456")).rejects.toThrow(
        "Airtable service is not configured",
      );

      initSpy.mockRestore();
    });
  });

  describe("Basic isReady", () => {
    it("should return true when properly configured", () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      configureServiceForTesting(
        service,
        createMockBase(
          () =>
            ({
              create: mockCreate,
              select: mockSelect,
              update: mockUpdate,
              destroy: mockDestroy,
            }) as unknown as ReturnType<AirtableBaseLike["table"]>,
        ),
      );

      expect(service.isReady()).toBe(true);
    });

    it("should return false when not configured", async () => {
      const service = new AirtableServiceClass();

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      expect(service.isReady()).toBe(false);
    });
  });
});
