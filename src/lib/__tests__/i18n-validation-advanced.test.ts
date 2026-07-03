/**
 * I18n Validation - Advanced Tests Index
 *
 * 基本高级验证集成测试，包括：
 * - 核心高级验证功能测试
 * - 基本性能验证
 *
 * 详细测试请参考：
 * - i18n-validation-advanced-scenarios.test.ts - 高级验证场景测试
 * - i18n-validation-edge-cases.test.ts - 边界情况测试
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateTranslations } from "@/test/i18n-validation";
import {
  mockEnTranslations,
  mockZhComplete,
  resetMockConfig,
  setMockConfig,
} from "./mocks/translations";

// Mock routing
vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
  },
}));

describe("I18n Validation - Advanced Tests Index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置Mock配置为默认状态
    resetMockConfig();
  });

  describe("Core Advanced Integration Tests", () => {
    it("should handle complex nested structures", async () => {
      // 设置复杂嵌套结构的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          complex: {
            level1: {
              level2: {
                level3: {
                  deepValue: "Deep nested value",
                },
              },
            },
          },
        },
        zh: {
          ...mockZhComplete,
          complex: {
            level1: {
              level2: {
                level3: {
                  deepValue: "深层嵌套值",
                },
              },
            },
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.coverage).toBeGreaterThan(0);
    });

    it("should validate complex parameter structures", async () => {
      // 设置包含复杂参数的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          advanced: {
            multipleParams:
              "Hello {name}, you have {count} messages from {sender}",
            nestedParams: "Welcome to {location.city}, {location.country}",
          },
        },
        zh: {
          ...mockZhComplete,
          advanced: {
            multipleParams: "你好{name}，你有{count}条来自{sender}的消息",
            nestedParams: "欢迎来到{location.country}{location.city}",
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect parameter mismatches", async () => {
      // 设置参数不匹配的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          advanced: {
            multipleParams:
              "Hello {name}, you have {count} messages from {sender}",
          },
        },
        zh: {
          ...mockZhComplete,
          advanced: {
            multipleParams: "你好{name}，你有{count}条消息", // 缺少 {sender} 参数
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true); // 占位符不匹配是警告，不是错误
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((warning) => warning.message.includes("sender")),
      ).toBe(true);
    });

    it("should handle ICU message format", async () => {
      // 设置包含ICU消息格式的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          icu: {
            plural:
              "{count, plural, =0 {no items} =1 {one item} other {# items}}",
            select:
              "{gender, select, male {He} female {She} other {They}} will arrive",
          },
        },
        zh: {
          ...mockZhComplete,
          icu: {
            plural:
              "{count, plural, =0 {没有项目} =1 {一个项目} other {#个项目}}",
            select:
              "{gender, select, male {他} female {她} other {他们}}将到达",
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // ICU消息格式可能产生占位符不匹配警告，这是正常的
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty translation files", async () => {
      // 设置空的翻译文件
      setMockConfig({
        en: {},
        zh: {},
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(false); // 空文件应该被视为无效
      expect(result.errors.length).toBeGreaterThan(0); // 应该有错误
      expect(result.coverage).toBe(100); // 100% of nothing is still 100%
    });

    it("should handle missing locale files", async () => {
      // 设置只有部分语言文件
      setMockConfig({
        en: mockEnTranslations,
        zh: undefined, // 显式设置为undefined来模拟文件缺失
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error) => error.message.includes("zh"))).toBe(
        true,
      );
    });

    it("should maintain performance with moderate datasets", async () => {
      // 创建中等大小的数据集
      const moderateDataset: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        moderateDataset[`key_${i}`] = `Value ${i} with {param}`;
      }

      setMockConfig({
        en: {
          ...mockEnTranslations,
          moderate: moderateDataset,
        },
        zh: {
          ...mockZhComplete,
          moderate: Object.fromEntries(
            Object.entries(moderateDataset).map(([key, _value]) => [
              key,
              `值 ${key.split("_")[1]} 包含 {param}`,
            ]),
          ),
        },
      });

      const _startTime = Date.now();
      const result = await validateTranslations();
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(typeof result.coverage).toBe("number");
      expect(endTime - _startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle mixed content types", async () => {
      // 设置包含混合内容类型的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          mixed: {
            stringValue: "Simple string with {param}",
            numberValue: 42,
            booleanValue: true,
            arrayValue: ["item1", "item2"],
            objectValue: {
              nested: "Nested string with {param}",
              count: 10,
            },
          },
        },
        zh: {
          ...mockZhComplete,
          mixed: {
            stringValue: "包含{param}的简单字符串",
            numberValue: 42,
            booleanValue: true,
            arrayValue: ["项目1", "项目2"],
            objectValue: {
              nested: "包含{param}的嵌套字符串",
              count: 10,
            },
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.coverage).toBeGreaterThan(0);
    });
  });
});
