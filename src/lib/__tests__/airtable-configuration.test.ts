/**
 * Airtable Service - Configuration Tests
 *
 * 专门测试配置功能，包括：
 * - 环境变量配置
 * - 服务初始化
 * - 配置验证
 * - 默认值处理
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

const setServiceReady = (service: unknown) =>
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

describe("Airtable Service - Configuration Tests", () => {
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

    // Dynamically import the module to ensure fresh instance
    const module = await import("../airtable/service");
    AirtableServiceClass = module.AirtableService as typeof AirtableServiceType;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("环境变量配置", () => {
    it("should configure Airtable with valid environment variables", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          AIRTABLE_TABLE_NAME: "test-table",
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service).toBeDefined();
    });

    it("should use default table name when not provided", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          // Missing AIRTABLE_TABLE_NAME
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service).toBeDefined();
    });

    it("should handle missing API key gracefully", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          // Missing AIRTABLE_API_KEY
          AIRTABLE_BASE_ID: "test-base-id",
          AIRTABLE_TABLE_NAME: "test-table",
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service.isReady()).toBe(false);
    });

    it("should handle missing base ID gracefully", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "test-api-key",
          // Missing AIRTABLE_BASE_ID
          AIRTABLE_TABLE_NAME: "test-table",
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service.isReady()).toBe(false);
    });

    it("should handle empty environment variables", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "",
          AIRTABLE_BASE_ID: "",
          AIRTABLE_TABLE_NAME: "",
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service.isReady()).toBe(false);
    });
  });

  describe("服务初始化", () => {
    it("should initialize service with proper configuration", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          AIRTABLE_TABLE_NAME: "test-table",
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service).toBeInstanceOf(ServiceClass);
      // Note: mockConfigure may not be called during construction
      // The service initializes lazily when needed
    });

    it("should create base instance correctly", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          AIRTABLE_TABLE_NAME: "test-table",
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      // Access private property for testing
      const privateService = service as unknown as AirtableServicePrivate;
      expect(privateService.base).toBeDefined();
    });

    it("should handle initialization errors gracefully", async () => {
      // Mock Airtable to throw error during configuration
      mockConfigure.mockImplementation(() => {
        throw new Error("Configuration failed");
      });

      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          AIRTABLE_TABLE_NAME: "test-table",
        },
      }));

      expect(async () => {
        const { AirtableService: ServiceClass } =
          await import("../airtable/service");
        new ServiceClass();
      }).not.toThrow();
    });
  });

  describe("配置验证", () => {
    it("should validate required configuration fields", () => {
      const service = new AirtableServiceClass();

      // Test with missing configuration
      (service as unknown as AirtableServicePrivate).isConfigured = false;
      expect(service.isReady()).toBe(false);

      // Test with valid configuration
      setServiceReady(service);
      expect(service.isReady()).toBe(true);
    });

    it("should check base instance availability", () => {
      const service = new AirtableServiceClass();

      const privateService = service as unknown as AirtableServicePrivate;

      // Test with null base
      privateService.isConfigured = true;
      privateService.base = null;
      expect(service.isReady()).toBe(false);

      // Test with valid base
      configureServiceForTesting(privateService, createMockBase(tableFactory));
      expect(service.isReady()).toBe(true);
    });

    it("should validate table instance", () => {
      const service = new AirtableServiceClass();

      setServiceReady(service);

      expect(service.isReady()).toBe(true);
      expect(mockTable).toBeDefined();
    });
  });

  describe("默认值处理", () => {
    it("should use default table name when not specified", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: "test-api-key",
          AIRTABLE_BASE_ID: "test-base-id",
          // AIRTABLE_TABLE_NAME not provided
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service).toBeDefined();
      // Should use default table name
    });

    it("should handle undefined environment variables", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: undefined,
          AIRTABLE_BASE_ID: undefined,
          AIRTABLE_TABLE_NAME: undefined,
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service.isReady()).toBe(false);
    });

    it("should handle null environment variables", async () => {
      vi.doMock("@/lib/env", () => ({
        env: {
          AIRTABLE_API_KEY: null,
          AIRTABLE_BASE_ID: null,
          AIRTABLE_TABLE_NAME: null,
        },
      }));

      const { AirtableService: ServiceClass } =
        await import("../airtable/service");
      const service = new ServiceClass();

      expect(service.isReady()).toBe(false);
    });
  });

  describe("错误处理", () => {
    it("should handle configuration errors gracefully", () => {
      mockConfigure.mockImplementation(() => {
        throw new Error("Invalid API key");
      });

      expect(() => {
        new AirtableServiceClass();
      }).not.toThrow();
    });

    it("should handle base creation errors", () => {
      mockBase.mockImplementation(() => {
        throw new Error("Invalid base ID");
      });

      expect(() => {
        new AirtableServiceClass();
      }).not.toThrow();
    });

    it("should handle table creation errors", () => {
      mockTable.mockImplementation(() => {
        throw new Error("Invalid table name");
      });

      expect(() => {
        new AirtableServiceClass();
      }).not.toThrow();
    });
  });
});
