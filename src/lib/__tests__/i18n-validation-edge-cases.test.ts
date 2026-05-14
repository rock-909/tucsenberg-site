/**
 * I18n Validation - Edge Cases Tests
 *
 * 测试边界情况：
 * - 空翻译文件处理
 * - 异常数据结构处理
 * - 错误恢复测试
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

describe("I18n Validation - Edge Cases Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置Mock配置为默认状态
    resetMockConfig();
  });

  describe("Edge cases", () => {
    it("should handle empty translation files", async () => {
      // 设置所有语言都为空对象
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
        // zh 文件缺失 - 显式设置为undefined
        zh: undefined,
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error) => error.message.includes("zh"))).toBe(
        true,
      );
    });

    it("should handle malformed translation data", async () => {
      // 设置格式错误的翻译数据
      setMockConfig({
        en: mockEnTranslations,
        zh: "invalid string instead of object" as unknown as Record<
          string,
          unknown
        >,
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(
          (error) =>
            error.message.includes("malformed") ||
            error.message.includes("invalid"),
        ),
      ).toBe(true);
    });

    it("should handle circular references", async () => {
      // 创建包含循环引用的对象
      const circularEn: Record<string, unknown> = {
        ...mockEnTranslations,
        circular: {},
      };
      circularEn.circular = circularEn; // 创建循环引用

      const circularZh: Record<string, unknown> = {
        common: {
          hello: "你好",
          goodbye: "再见",
          welcome: "欢迎来到{name}",
        },
        circular: {},
      };
      circularZh.circular = circularZh; // 创建循环引用

      setMockConfig({
        en: circularEn,
        zh: circularZh,
      });

      const result = await validateTranslations();

      // 应该能够处理循环引用而不崩溃
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });

    it("should handle extremely deep nesting", async () => {
      // 创建极深的嵌套结构
      const createDeepNesting = (depth: number): Record<string, unknown> => {
        if (depth === 0) return { value: "deep value with {param}" };
        return { [`level_${depth}`]: createDeepNesting(depth - 1) };
      };

      setMockConfig({
        en: {
          ...mockEnTranslations,
          deep: createDeepNesting(50), // 50层深度
        },
        zh: {
          common: {
            hello: "你好",
            goodbye: "再见",
            welcome: "欢迎来到{name}",
          },
          deep: createDeepNesting(50), // 50层深度
        },
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });

    it("should handle special characters and unicode", async () => {
      // 设置包含特殊字符和Unicode的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          special: {
            emoji: "Hello 👋 {name}! Welcome to our app 🚀",
            unicode: "Special chars: àáâãäåæçèéêë {param} ñòóôõö",
            symbols: "Math: ∑∏∆∇∂∫ {value} ≤≥≠≈",
            quotes: "Quotes: \"double\" 'single' `backtick` {text}",
            newlines: "Line 1\nLine 2\nLine 3 with {param}",
            tabs: "Tab\tseparated\tvalues with {data}",
          },
        },
        zh: {
          ...mockZhComplete, // 使用完整的中文翻译数据
          special: {
            emoji: "你好 👋 {name}！欢迎使用我们的应用 🚀",
            unicode: "特殊字符：中文测试 {param} 日本語テスト",
            symbols: "数学：∑∏∆∇∂∫ {value} ≤≥≠≈",
            quotes: "引号：\"双引号\" '单引号' `反引号` {text}",
            newlines: "第一行\n第二行\n第三行包含 {param}",
            tabs: "制表符\t分隔\t值包含 {data}",
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle null and undefined values", async () => {
      // 设置包含null和undefined值的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          nullish: {
            nullValue: null,
            undefinedValue: undefined,
            emptyString: "",
            zeroValue: 0,
            falseValue: false,
            validString: "Valid string with {param}",
          },
        },
        zh: {
          common: {
            hello: "你好",
            goodbye: "再见",
            welcome: "欢迎来到{name}",
          },
          nullish: {
            nullValue: null,
            undefinedValue: undefined,
            emptyString: "",
            zeroValue: 0,
            falseValue: false,
            validString: "包含{param}的有效字符串",
          },
        },
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });

    it("should handle very long translation strings", async () => {
      // 创建非常长的翻译字符串
      const longString = `${"A".repeat(10000)} with {param} at the end`;
      const longStringZh = `${"中".repeat(10000)} 包含 {param} 在结尾`;

      setMockConfig({
        en: {
          ...mockEnTranslations,
          long: {
            veryLongString: longString,
          },
        },
        zh: {
          common: {
            hello: "你好",
            goodbye: "再见",
            welcome: "欢迎来到{name}",
          },
          long: {
            veryLongString: longStringZh,
          },
        },
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });

    it("should handle mixed data types gracefully", async () => {
      // 设置包含混合数据类型的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          mixed: {
            string: "String value with {param}",
            number: 42,
            boolean: true,
            array: ["item1", "item2", "item3"],
            object: {
              nested: "Nested string",
              count: 5,
            },
            function: () => "function result", // 函数类型
            symbol: Symbol("test"), // Symbol类型
            bigint: BigInt(123), // BigInt类型
          },
        },
        zh: {
          common: {
            hello: "你好",
            goodbye: "再见",
            welcome: "欢迎来到{name}",
          },
          mixed: {
            string: "包含{param}的字符串值",
            number: 42,
            boolean: true,
            array: ["项目1", "项目2", "项目3"],
            object: {
              nested: "嵌套字符串",
              count: 5,
            },
            function: () => "函数结果", // 函数类型
            symbol: Symbol("测试"), // Symbol类型
            bigint: BigInt(123), // BigInt类型
          },
        },
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });

    it("should handle concurrent validation calls", async () => {
      // 设置正常的翻译数据
      setMockConfig({
        en: mockEnTranslations,
        zh: {
          common: {
            hello: "你好",
            goodbye: "再见",
            welcome: "欢迎来到{name}",
          },
        },
      });

      // 并发调用验证函数
      const promises = Array.from({ length: 10 }, () => validateTranslations());
      const results = await Promise.all(promises);

      // 所有结果应该一致
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(typeof result.isValid).toBe("boolean");
        expect(result.isValid).toBe(results[0]?.isValid);
      });
    });

    it("should handle memory pressure scenarios", async () => {
      // 创建大量数据以测试内存压力
      const largeData: Record<string, unknown> = {};
      for (let i = 0; i < 5000; i++) {
        largeData[`key_${i}`] = {
          value: `Large value ${i} with {param}`,
          nested: {
            deep: `Deep value ${i}`,
            array: Array.from({ length: 100 }, (_, j) => `item_${j}`),
          },
        };
      }

      setMockConfig({
        en: {
          ...mockEnTranslations,
          large: largeData,
        },
        zh: {
          common: {
            hello: "你好",
            goodbye: "再见",
            welcome: "欢迎来到{name}",
          },
          large: Object.fromEntries(
            Object.entries(largeData).map(([key, _value]) => [
              key,
              {
                value: `大值 ${key.split("_")[1]} 包含 {param}`,
                nested: {
                  deep: `深值 ${key.split("_")[1]}`,
                  array: Array.from({ length: 100 }, (_, j) => `项目_${j}`),
                },
              },
            ]),
          ),
        },
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });
  });
});
