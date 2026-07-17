/**
 * Airtable Service - Create Operations Tests
 *
 * 专门测试创建操作功能，包括：
 * - 创建联系人记录
 * - 可选字段处理
 * - 错误处理
 * - 空数据处理
 */

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
const mockSelectAll = vi.fn();
const mockSelect = vi.fn().mockReturnValue({
  all: mockSelectAll,
  firstPage: vi.fn(),
});
const mockUpdate = vi.fn();
const mockDestroy = vi.fn();

// Mock record with get method
const createMockRecord = (data: Record<string, unknown>) => ({
  id: data.id || "rec123456",
  fields: data.fields || {},
  createdTime: data.createdTime || "2023-01-01T00:00:00Z",
  get: vi.fn((field: string) => {
    if (field === "Created Time")
      return data.createdTime || "2023-01-01T00:00:00Z";
    return (data.fields as Record<string, unknown>)?.[field];
  }),
});

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

describe("Airtable Service - Create Operations Tests", () => {
  let AirtableServiceClass: typeof AirtableServiceType;

  beforeEach(async () => {
    // Clear mocks but preserve the mock functions
    mockCreate.mockReset();
    mockSelectAll.mockReset();
    mockSelect.mockReset().mockReturnValue({
      all: mockSelectAll,
      firstPage: vi.fn(),
    });
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

    // Dynamically import the module to ensure fresh instance
    const module = await import("../airtable/service");
    AirtableServiceClass = module.AirtableService as typeof AirtableServiceType;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validLeadData = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    company: "Test Company",
    message: "This is a test message",
  };

  describe("创建 Lead 记录 (contact type)", () => {
    it("should create lead record successfully", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      setServiceReady(service);

      // Mock successful creation
      const mockRecordData = {
        id: "rec123456",
        fields: {
          "First Name": "John",
          "Last Name": "Doe",
          Email: "john.doe@example.com",
          Company: "Test Company",
          Message: "This is a test message",
        },
        createdTime: "2023-01-01T00:00:00Z",
      };
      mockCreate.mockResolvedValue([createMockRecord(mockRecordData)]);

      const result = await service.createLead("contact", validLeadData);

      expect(result).toEqual({
        id: "rec123456",
        fields: mockRecordData.fields,
        createdTime: "2023-01-01T00:00:00Z",
      });
      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "John",
            "Last Name": "Doe",
            Email: "john.doe@example.com",
            Company: "Test Company",
            Message: "This is a test message",
            Status: "New",
            Source: "Website Contact Form",
            "Submitted At": expect.any(String),
          }),
        },
      ]);
    });

    it("writes a validated plus-addressed email without text-field escaping", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);
      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "rec-plus-address",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead("contact", {
        ...validLeadData,
        email: "buyer+rfq@example.com",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            Email: "buyer+rfq@example.com",
          }),
        },
      ]);
    });

    it("maps split full names and optional company into the canonical Airtable fields", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "rec123456",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead("contact", {
        firstName: "Smoke",
        lastName: "Test",
        email: "smoke@example.com",
        message: "This is a smoke test message.",
        referenceId: "CON-test-123",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "Smoke",
            "Last Name": "Test",
            Email: "smoke@example.com",
            Company: "",
            Message: "This is a smoke test message.",
            "Reference ID": "CON-test-123",
            Source: "Website Contact Form",
          }),
        },
      ]);
    });

    it("should write buyer-entered contact subject to Airtable Subject", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);
      const buyerSubject = "Need custom distributor website quote";
      const leadDataWithSubject = {
        ...validLeadData,
        subject: buyerSubject,
      };
      const mockRecordData = {
        id: "rec-subject",
        fields: leadDataWithSubject,
        createdTime: "2023-01-01T00:00:00Z",
      };
      mockCreate.mockResolvedValue([createMockRecord(mockRecordData)]);

      await service.createLead("contact", leadDataWithSubject);

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            Subject: buyerSubject,
          }),
        },
      ]);
    });

    it("should omit Airtable Subject when contact subject is missing", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);
      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "rec-no-subject",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead("contact", validLeadData);

      const createCall = mockCreate.mock.calls[0];
      expect(createCall).toBeDefined();
      if (!createCall) {
        throw new Error("Expected Airtable create to be called");
      }
      const [records] = createCall;
      const firstRecord = records[0];
      expect(firstRecord).toBeDefined();
      if (!firstRecord) {
        throw new Error("Expected Airtable create call to include one record");
      }
      const { fields } = firstRecord;
      expect(fields).not.toHaveProperty("Subject");
    });

    it("should include optional fields when provided", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      setServiceReady(service);

      const leadDataWithOptionals = {
        ...validLeadData,
        subject: "Product Inquiry",
      };

      const mockRecordDataWithOptionals = {
        id: "rec123456",
        fields: leadDataWithOptionals,
        createdTime: "2023-01-01T00:00:00Z",
      };
      mockCreate.mockResolvedValue([
        createMockRecord(mockRecordDataWithOptionals),
      ]);

      await service.createLead("contact", leadDataWithOptionals);

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "John",
            "Last Name": "Doe",
            Email: "john.doe@example.com",
            Company: "Test Company",
            Message: "This is a test message",
            Subject: "Product Inquiry",
            Status: "New",
            Source: "Website Contact Form",
            "Submitted At": expect.any(String),
          }),
        },
      ]);
    });

    it("neutralizes spreadsheet formula prefixes in contact lead text fields", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);

      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "recFormula",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead("contact", {
        firstName: '=HYPERLINK("https://example.test")',
        lastName: "+SUM(1,1)",
        email: "formula@example.com",
        company: "-Acme",
        subject: "@subject",
        message: " =cmd",
        referenceId: "CON-formula-123",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": `'=HYPERLINK("https://example.test")`,
            "Last Name": "'+SUM(1,1)",
            Company: "'-Acme",
            Subject: "'@subject",
            Message: "'=cmd",
          }),
        },
      ]);
    });

    it("neutralizes spreadsheet formula prefixes in product lead text fields", async () => {
      const service = new AirtableServiceClass();
      setServiceReady(service);

      mockCreate.mockResolvedValue([
        createMockRecord({
          id: "recProductFormula",
          fields: {},
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ]);

      await service.createLead("product", {
        firstName: "=Buyer",
        lastName: "+One",
        email: "buyer@example.com",
        company: "@Buyer Co",
        message: "=message",
        productName: "+Product",
        catalogProductId: "-product-slug",
        quantity: "@100",
        requirements: "=requirements",
        referenceId: "PROD-formula-123",
      });

      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "'=Buyer",
            "Last Name": "'+One",
            Company: "'@Buyer Co",
            Message: "'=message",
            "Product Name": "'+Product",
            "Product Slug": "'-product-slug",
            Quantity: "'@100",
            Requirements: "'=requirements",
          }),
        },
      ]);
    });

    it("should throw error when service is not configured", async () => {
      const service = new AirtableServiceClass();

      // Explicitly ensure service is not configured and stays that way
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      // Mock ensureReady to do nothing (prevent auto-configuration)
      vi.spyOn(service as any, "ensureReady").mockImplementation(async () => {
        // Do nothing - prevent initialization
      });

      await expect(
        service.createLead("contact", validLeadData),
      ).rejects.toThrow("Airtable service is not configured");
    });

    it("should handle creation errors gracefully", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      mockCreate.mockRejectedValue(new Error("Creation failed"));

      await expect(
        service.createLead("contact", validLeadData),
      ).rejects.toThrow("Failed to create lead record");
    });

    it("should handle empty lead data", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const emptyLeadData = {
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        message: "",
      };

      // Empty email should cause creation error
      await expect(
        service.createLead("contact", emptyLeadData),
      ).rejects.toThrow("Failed to create lead record");
    });

    it("should handle special characters in lead data", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const specialLeadData = {
        firstName: "José",
        lastName: "García-López",
        email: "jose.garcia@example.com",
        company: "Test & Co.",
        message: 'Message with "quotes" and special chars: @#$%',
      };

      const mockRecordDataSpecial = {
        id: "rec123456",
        fields: specialLeadData,
        createdTime: "2023-01-01T00:00:00Z",
      };
      mockCreate.mockResolvedValue([createMockRecord(mockRecordDataSpecial)]);

      const result = await service.createLead("contact", specialLeadData);

      expect(result).toEqual({
        id: "rec123456",
        fields: mockRecordDataSpecial.fields,
        createdTime: "2023-01-01T00:00:00Z",
      });
      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "José",
            "Last Name": "García-López",
            Email: "jose.garcia@example.com",
            Company: "Test & Co.",
            Message: 'Message with "quotes" and special chars: @#$%',
            Status: "New",
            Source: "Website Contact Form",
            "Submitted At": expect.any(String),
          }),
        },
      ]);
    });

    it("should handle long text content", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const longMessage = "A".repeat(1000); // Very long message
      const longLeadData = {
        ...validLeadData,
        message: longMessage,
      };

      const mockRecordDataLong = {
        id: "rec123456",
        fields: longLeadData,
        createdTime: "2023-01-01T00:00:00Z",
      };
      mockCreate.mockResolvedValue([createMockRecord(mockRecordDataLong)]);

      const result = await service.createLead("contact", longLeadData);

      expect(result).toEqual({
        id: "rec123456",
        fields: mockRecordDataLong.fields,
        createdTime: "2023-01-01T00:00:00Z",
      });
      expect(mockCreate).toHaveBeenCalledWith([
        {
          fields: expect.objectContaining({
            "First Name": "John",
            "Last Name": "Doe",
            Email: "john.doe@example.com",
            Company: "Test Company",
            Message: longMessage,
            Status: "New",
            Source: "Website Contact Form",
            "Submitted At": expect.any(String),
          }),
        },
      ]);
    });

    it("should handle network timeout errors", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockCreate.mockRejectedValue(timeoutError);

      await expect(
        service.createLead("contact", validLeadData),
      ).rejects.toThrow("Failed to create lead record");
    });

    it("should handle rate limiting errors", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";
      mockCreate.mockRejectedValue(rateLimitError);

      await expect(
        service.createLead("contact", validLeadData),
      ).rejects.toThrow("Failed to create lead record");
    });
  });
});
