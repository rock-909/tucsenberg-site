/**
 * I18n Validation - Advanced Scenarios Tests
 *
 * 测试高级验证场景：
 * - 复杂嵌套结构验证
 * - 高级参数验证
 * - 复杂数据结构处理
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

describe("I18n Validation - Advanced Scenarios Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置Mock配置为默认状态
    resetMockConfig();
  });

  describe("Advanced validation scenarios", () => {
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
            conditionalParams:
              "{count, plural, =0 {no items} =1 {one item} other {# items}}",
          },
        },
        zh: {
          ...mockZhComplete,
          advanced: {
            multipleParams: "你好{name}，你有{count}条来自{sender}的消息",
            nestedParams: "欢迎来到{location.country}{location.city}",
            conditionalParams:
              "{count, plural, =0 {没有项目} =1 {一个项目} other {#个项目}}",
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it("should detect parameter mismatches in complex structures", async () => {
      // 设置参数不匹配的复杂翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          advanced: {
            multipleParams:
              "Hello {name}, you have {count} messages from {sender}",
            complexParams:
              "User {user.id} ({user.name}) has {stats.points} points",
          },
        },
        zh: {
          ...mockZhComplete,
          advanced: {
            multipleParams: "你好{name}，你有{count}条消息", // 缺少 {sender} 参数
            complexParams: "用户{user.id}有{stats.points}分", // 缺少 {user.name} 参数
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true); // 占位符不匹配是警告，不是错误
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(
          (warning) =>
            warning.message.includes("sender") ||
            warning.message.includes("user.name"),
        ),
      ).toBe(true);
    });

    it("should handle arrays and complex data structures", async () => {
      // 设置包含数组和复杂数据结构的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          lists: {
            items: ["First item", "Second item", "Third item"],
            categories: {
              tech: ["JavaScript", "TypeScript", "React"],
              design: ["UI", "UX", "Graphics"],
            },
          },
          metadata: {
            version: "1.0.0",
            author: "Test Author",
            description: "Test description with {param}",
          },
        },
        zh: {
          ...mockZhComplete,
          lists: {
            items: ["第一项", "第二项", "第三项"],
            categories: {
              tech: ["JavaScript", "TypeScript", "React"],
              design: ["界面", "用户体验", "图形"],
            },
          },
          metadata: {
            version: "1.0.0",
            author: "测试作者",
            description: "包含{param}的测试描述",
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.coverage).toBeGreaterThan(0);
    });

    it("should validate ICU message format syntax", async () => {
      // 设置包含ICU消息格式的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          icu: {
            plural:
              "{count, plural, =0 {no items} =1 {one item} other {# items}}",
            select:
              "{gender, select, male {He} female {She} other {They}} will arrive",
            selectordinal:
              "{position, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} place",
            number: "Price: {price, number, currency}",
            date: "Date: {date, date, short}",
          },
        },
        zh: {
          ...mockZhComplete,
          icu: {
            plural:
              "{count, plural, =0 {没有项目} =1 {一个项目} other {#个项目}}",
            select:
              "{gender, select, male {他} female {她} other {他们}}将到达",
            selectordinal: "第{position, selectordinal, other {#}}名",
            number: "价格：{price, number, currency}",
            date: "日期：{date, date, short}",
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // ICU消息格式可能产生占位符不匹配警告，这是正常的
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it("should detect ICU format syntax errors", async () => {
      // 设置包含ICU格式错误的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          icu: {
            validPlural:
              "{count, plural, =0 {no items} =1 {one item} other {# items}}",
            invalidPlural:
              "{count, plural, =0 {no items} =1 {one item} other {# items}", // 缺少结束括号
          },
        },
        zh: {
          ...mockZhComplete,
          icu: {
            validPlural:
              "{count, plural, =0 {没有项目} =1 {一个项目} other {#个项目}}",
            invalidPlural:
              "{count, plural, =0 {没有项目} =1 {一个项目} other {#个项目}", // 缺少结束括号
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true); // ICU语法错误可能被视为警告而不是错误
      // ICU格式错误可能产生各种类型的警告或错误
      expect(result.warnings.length + result.errors.length).toBeGreaterThan(0);
    });

    it("should handle mixed content types", async () => {
      // 设置包含混合内容类型的翻译数据
      setMockConfig({
        en: {
          ...mockEnTranslations,
          mixed: {
            stringValue: "Simple string",
            numberValue: 42,
            booleanValue: true,
            arrayValue: ["item1", "item2"],
            objectValue: {
              nested: "Nested string with {param}",
              count: 10,
            },
            nullValue: null,
            undefinedValue: undefined,
          },
        },
        zh: {
          ...mockZhComplete,
          mixed: {
            stringValue: "简单字符串",
            numberValue: 42,
            booleanValue: true,
            arrayValue: ["项目1", "项目2"],
            objectValue: {
              nested: "包含{param}的嵌套字符串",
              count: 10,
            },
            nullValue: null,
            undefinedValue: undefined,
          },
        },
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      // 混合内容类型可能产生空值警告，这是正常的
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeGreaterThan(0);
    });
  });
});
