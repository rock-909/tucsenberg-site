/**
 * Airtable测试辅助函数
 * 提供统一的Mock配置和测试工具
 */

import { vi } from "vitest";
import type {
  AirtableBaseLike,
  AirtableServicePrivate,
  AirtableTableLike,
} from "@/test/test-types";

/**
 * 创建Mock的Airtable Base
 */
export function createMockBase(
  tableFactory: AirtableBaseLike["table"],
): AirtableBaseLike {
  return {
    table: tableFactory,
  };
}

/**
 * 创建Mock的Airtable Table
 */
export function createMockTable(): AirtableTableLike {
  return {
    create: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  };
}

/**
 * 配置Airtable服务用于测试
 */
export function configureServiceForTesting(
  service: AirtableServicePrivate,
  mockBase: AirtableBaseLike,
): void {
  // 设置服务为已配置状态
  service.isConfigured = true;
  // 设置Mock的base实例
  service.base = mockBase;
  // Note: table is accessed via base.table() method, not stored directly
}

/**
 * 创建标准的测试记录数据
 */
export function createTestRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "rec123456789",
    fields: {
      Name: "Test User",
      Email: "test@example.com",
      Message: "Test message",
      Status: "pending",
      "Created At": new Date().toISOString(),
      ...overrides,
    },
    createdTime: new Date().toISOString(),
  };
}

/**
 * 创建测试用的联系人数据
 */
export function createTestContactData(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test User",
    email: "test@example.com",
    message: "Test message",
    subject: "Test Subject",
    phone: "+1234567890",
    company: "Test Company",
    ...overrides,
  };
}

/**
 * 模拟Airtable API错误
 */
export function createAirtableError(message: string, statusCode = 400) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
}

/**
 * 创建Mock的select查询结果
 */
export function createMockSelectResult(
  records: Array<ReturnType<typeof createTestRecord>>,
) {
  return {
    firstPage: vi.fn().mockResolvedValue(records),
    all: vi.fn().mockResolvedValue(records),
    eachPage: vi.fn(),
  };
}

/**
 * 重置所有Mock函数
 */
export function resetAllMocks() {
  vi.clearAllMocks();
}

/**
 * 创建完整的Airtable服务Mock配置
 */
export function createAirtableServiceMock() {
  const mockTable = createMockTable();
  const mockBase = createMockBase(() => mockTable);

  return {
    mockTable,
    mockBase,
    mockCreate: mockTable.create,
    mockSelect: mockTable.select,
    mockUpdate: mockTable.update,
    mockDestroy: mockTable.destroy,
  };
}

/**
 * 验证Mock调用的辅助函数
 */
export function expectMockCalledWith(
  mockFn: ReturnType<typeof vi.fn>,
  expectedArgs: unknown[],
) {
  expect(mockFn).toHaveBeenCalledWith(...expectedArgs);
}

/**
 * 验证Mock调用次数的辅助函数
 */
export function expectMockCalledTimes(
  mockFn: ReturnType<typeof vi.fn>,
  times: number,
) {
  expect(mockFn).toHaveBeenCalledTimes(times);
}
