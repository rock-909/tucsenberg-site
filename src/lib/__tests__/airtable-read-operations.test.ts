/**
 * Airtable Service - Read Operations Tests
 *
 * 专门测试读取操作功能，包括：
 * - 获取联系人记录
 * - 查询选项处理
 * - 错误处理
 * - 空结果处理
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
  configureServiceForTesting(service as any, createMockBase(tableFactory));

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

describe("Airtable Service - Read Operations Tests", () => {
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

  describe("获取联系人记录", () => {
    it("should retrieve contact records successfully", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      setServiceReady(service);

      const mockRecords = [
        createMockRecord({
          id: "rec123456",
          fields: { "First Name": "John", "Last Name": "Doe" },
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ];

      mockSelectAll.mockResolvedValue(mockRecords);

      const result = await service.getContacts();

      // Service transforms records, removing the get method
      const expectedRecords = mockRecords.map((record) => ({
        id: record.id,
        fields: record.fields,
        createdTime: record.get("Created Time"),
      }));

      expect(result).toEqual(expectedRecords);
      expect(mockSelect).toHaveBeenCalled();
    });

    it("should handle query options", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      setServiceReady(service);

      const options = {
        maxRecords: 10,
        sort: [{ field: "Created Time", direction: "desc" as const }],
      };

      mockSelectAll.mockResolvedValue([]);

      await service.getContacts(options);

      expect(mockSelect).toHaveBeenCalledWith(options);
    });

    it("should throw error when service is not configured", async () => {
      const service = new AirtableServiceClass();

      // Ensure service is not configured
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      await expect(service.getContacts()).rejects.toThrow(
        "Failed to fetch contact records",
      );
    });

    it("should handle retrieval errors gracefully", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      mockSelectAll.mockRejectedValue(new Error("Retrieval failed"));

      await expect(service.getContacts()).rejects.toThrow(
        "Failed to fetch contact records",
      );
    });

    it("should handle empty results", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      mockSelectAll.mockResolvedValue([]);

      const result = await service.getContacts();

      expect(result).toEqual([]);
    });

    it("should handle complex query options", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const complexOptions = {
        maxRecords: 50,
        sort: [
          { field: "Created Time", direction: "desc" as const },
          { field: "First Name", direction: "asc" as const },
        ],
        filterByFormula: "AND({Status} = 'New', {Email} != '')",
        fields: ["First Name", "Last Name", "Email", "Company"],
      };

      // Service only supports maxRecords, sort, and filterByFormula
      const expectedOptions = {
        maxRecords: 50,
        sort: [
          { field: "Created Time", direction: "desc" as const },
          { field: "First Name", direction: "asc" as const },
        ],
        filterByFormula: "AND({Status} = 'New', {Email} != '')",
      };

      mockSelectAll.mockResolvedValue([]);

      await service.getContacts(complexOptions);

      expect(mockSelect).toHaveBeenCalledWith(expectedOptions);
    });

    it("should handle large result sets", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      // Create a large mock dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) =>
        createMockRecord({
          id: `rec${index.toString().padStart(6, "0")}`,
          fields: {
            "First Name": `User${index}`,
            "Last Name": `Test${index}`,
            Email: `user${index}@example.com`,
          },
          createdTime: "2023-01-01T00:00:00Z",
        }),
      );

      mockSelectAll.mockResolvedValue(largeDataset);

      const result = await service.getContacts();

      expect(result).toHaveLength(1000);
      const first = result[0];
      const last = result[result.length - 1];
      expect(first).toBeDefined();
      expect(last).toBeDefined();
      if (!first || !last) {
        throw new Error("分页数据生成失败，无法继续断言");
      }
      expect(first.fields["First Name"]).toBe("User0");
      expect(last.fields["First Name"]).toBe("User999");
    });

    it("should handle pagination options", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const paginationOptions = {
        maxRecords: 100,
        pageSize: 20,
        offset: "recABC123",
      };

      // Service only supports maxRecords
      const expectedOptions = {
        maxRecords: 100,
      };

      mockSelectAll.mockResolvedValue([]);

      await service.getContacts(paginationOptions);

      expect(mockSelect).toHaveBeenCalledWith(expectedOptions);
    });

    it("should handle network timeout during retrieval", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";

      mockSelectAll.mockRejectedValue(timeoutError);

      await expect(service.getContacts()).rejects.toThrow(
        "Failed to fetch contact records",
      );
    });

    it("should handle API rate limiting during retrieval", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const rateLimitError = new Error("Rate limit exceeded");
      rateLimitError.name = "RateLimitError";

      mockSelectAll.mockRejectedValue(rateLimitError);

      await expect(service.getContacts()).rejects.toThrow(
        "Failed to fetch contact records",
      );
    });

    it("should handle malformed response data", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      // Mock malformed data (missing required fields)
      const malformedData = [
        createMockRecord({
          // Missing id field - but createMockRecord will provide default
          fields: { "First Name": "John" },
          createdTime: "2023-01-01T00:00:00Z",
        }),
        createMockRecord({
          id: "rec123456",
          // Missing fields property - but createMockRecord will provide default
          createdTime: "2023-01-01T00:00:00Z",
        }),
      ];

      mockSelectAll.mockResolvedValue(malformedData);

      const result = await service.getContacts();

      // Service transforms records, removing the get method
      const expectedRecords = malformedData.map((record) => ({
        id: record.id,
        fields: record.fields,
        createdTime: record.get("Created Time"),
      }));

      expect(result).toEqual(expectedRecords);
    });

    it("should handle view-based queries", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      const viewOptions = {
        view: "Grid view",
        maxRecords: 25,
      };

      // Service only supports maxRecords
      const expectedOptions = {
        maxRecords: 25,
      };

      mockSelectAll.mockResolvedValue([]);

      await service.getContacts(viewOptions);

      expect(mockSelect).toHaveBeenCalledWith(expectedOptions);
    });

    it("should escape duplicate email values before building Airtable formulas", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);
      mockSelectAll.mockResolvedValue([]);

      await service.isDuplicateEmail('bad"actor@example.com');

      expect(mockSelect).toHaveBeenCalledWith({
        filterByFormula: '{Email} = "bad\\"actor@example.com"',
        maxRecords: 1,
      });
    });
  });
});
