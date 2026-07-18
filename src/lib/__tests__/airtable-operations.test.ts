/**
 * Airtable Service - Main Operations Tests
 *
 * 主要操作集成测试，包括：
 * - 核心服务导出验证
 * - 基本操作集成测试
 * - 错误处理验证
 *
 * 详细测试请参考：
 * - airtable-crud.test.ts - CRUD操作专门测试
 * - airtable-configuration.test.ts - 配置功能测试
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

describe("Airtable Service - Main Operations Tests", () => {
  let AirtableServiceClass: typeof AirtableServiceType;
  let AirtableService: typeof AirtableServiceType;

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
    AirtableService = module.AirtableService as typeof AirtableServiceType;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validLeadData = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    message: "This is a test message",
    productName: "ABS Flood Barriers",
    catalogProductId: "abs-flood-barriers",
  };

  describe("核心服务导出验证", () => {
    it("should export AirtableService class", () => {
      expect(AirtableService).toBeDefined();
      expect(typeof AirtableService).toBe("function");
    });

    it("should create AirtableService instance", () => {
      const service = new AirtableServiceClass();
      expect(service).toBeInstanceOf(AirtableService);
    });
  });

  describe("基本操作集成测试", () => {
    it("should handle basic lead creation (product inquiry)", async () => {
      const service = new AirtableServiceClass();

      // Override service configuration to make it ready
      setServiceReady(service);

      // Mock successful creation
      const mockRecordData = {
        id: "rec123456",
        fields: validLeadData,
        createdTime: "2023-01-01T00:00:00Z",
      };
      mockCreate.mockResolvedValue([createMockRecord(mockRecordData)]);

      const result = await service.createLead(validLeadData);

      expect(result).toEqual({
        id: "rec123456",
      });
      expect(mockCreate).toHaveBeenCalled();
    });

    it("should check service readiness correctly", () => {
      const service = new AirtableServiceClass();

      // Test with missing configuration
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      expect(service.isReady()).toBe(false);

      // Test with valid configuration
      setServiceReady(service);
      expect(service.isReady()).toBe(true);
    });
  });

  describe("错误处理验证", () => {
    it("should handle missing configuration gracefully", async () => {
      const service = new AirtableServiceClass();

      // Explicitly ensure service is not configured and stays that way
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      (service as unknown as AirtableServicePrivate).base = null;

      // Mock ensureReady to do nothing (prevent auto-configuration)
      vi.spyOn(service as any, "ensureReady").mockImplementation(async () => {
        // Do nothing - prevent initialization
      });

      await expect(service.createLead(validLeadData)).rejects.toThrow(
        "Airtable service is not configured",
      );
    });

    it("should handle API errors gracefully", async () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      mockCreate.mockRejectedValue(new Error("API Error"));

      await expect(service.createLead(validLeadData)).rejects.toThrow(
        "Failed to create lead record",
      );
    });
  });

  describe("Mock验证", () => {
    it("should have proper mock setup", () => {
      expect(mockCreate).toBeDefined();
      expect(mockSelect).toBeDefined();
      expect(mockUpdate).toBeDefined();
      expect(mockDestroy).toBeDefined();
      expect(mockTable).toBeDefined();
      expect(mockBase).toBeDefined();
      expect(mockConfigure).toBeDefined();
    });

    it("should reset mocks between tests", () => {
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  describe("服务状态检查", () => {
    it("should return true when properly configured", () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

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
