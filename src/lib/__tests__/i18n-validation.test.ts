/**
 * i18n-validation Tests - Index
 *
 * Basic integration tests for i18n validation functionality.
 * For comprehensive testing, see:
 * - i18n-validation-basic.test.ts - Basic validation tests
 * - i18n-validation-advanced.test.ts - Advanced validation and edge cases
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateTranslations } from "@/test/i18n-validation";
import {
  mockEnTranslations,
  mockZhComplete,
  mockZhEmpty,
  mockZhIncomplete,
  resetMockConfig,
  setMockConfig,
} from "./mocks/translations";

// Mock routing
vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
  },
}));

describe("i18n-validation Tests - Index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置Mock配置为默认状态
    resetMockConfig();
  });

  describe("Basic validateTranslations", () => {
    it("should validate complete translations successfully", async () => {
      // 设置完整的翻译数据
      setMockConfig({
        en: mockEnTranslations,
        zh: mockZhComplete,
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(true);
      expect(result.coverage).toBeGreaterThan(80);
      expect(result.errors).toHaveLength(0);
      expect(result.missingKeys).toHaveLength(0);
    });

    it("should detect missing translation keys", async () => {
      // 设置不完整的翻译数据（缺少contact键）
      setMockConfig({
        en: mockEnTranslations,
        zh: mockZhIncomplete,
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(false);
      expect(result.missingKeys.length).toBeGreaterThan(0);
      expect(result.missingKeys).toContain("zh.navigation.contact");
      expect(result.missingKeys).toContain("zh.pages.home.hero.title");
      expect(result.missingKeys).toContain("zh.pages.home.hero.subtitle");

      // 基于我们的Mock数据计算覆盖率
      expect(result.coverage).toBeCloseTo(92.86, 1);
    });

    it("should handle validation errors gracefully", async () => {
      // 设置空的翻译文件来模拟错误情况
      setMockConfig({
        en: mockEnTranslations,
        zh: {}, // 空对象模拟错误情况
      });

      const result = await validateTranslations();

      expect(result.isValid).toBe(false);
      expect(result.coverage).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should detect empty translation values", async () => {
      // 设置包含空值的翻译数据
      setMockConfig({
        en: mockEnTranslations,
        zh: mockZhEmpty,
      });

      const result = await validateTranslations();

      expect(
        result.errors.some(
          (error) =>
            error.type === "empty_value" &&
            error.key === "common.hello" &&
            error.locale === "zh",
        ),
      ).toBe(true);
    });

    it("should handle nested translation structures", async () => {
      // 设置不完整的翻译数据（缺少pages.home.hero.subtitle）
      setMockConfig({
        en: mockEnTranslations,
        zh: mockZhIncomplete,
      });

      const result = await validateTranslations();

      expect(result.missingKeys).toContain("zh.pages.home.hero.subtitle");
    });
  });

  describe("TranslationValidationResult interface", () => {
    it("should have correct structure", async () => {
      const result = await validateTranslations();

      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("coverage");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("warnings");
      expect(result).toHaveProperty("missingKeys");

      expect(typeof result.isValid).toBe("boolean");
      expect(typeof result.coverage).toBe("number");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.missingKeys)).toBe(true);
    });

    it("should have correct error structure", async () => {
      // 设置会产生错误的配置
      setMockConfig({
        en: mockEnTranslations,
        zh: mockZhEmpty,
      });

      const result = await validateTranslations();

      if (result.errors.length > 0) {
        const error = result.errors[0];
        expect(error).toHaveProperty("type");
        expect(error).toHaveProperty("key");
        expect(error).toHaveProperty("locale");
        expect(error).toHaveProperty("message");

        expect(["missing_key", "empty_value", "invalid_format"]).toContain(
          error?.type,
        );
      }
    });
  });

  describe("Coverage calculation", () => {
    it("should calculate coverage correctly for complete translations", async () => {
      setMockConfig({
        en: mockEnTranslations,
        zh: mockZhComplete,
      });

      const result = await validateTranslations();

      expect(result.coverage).toBeCloseTo(100, 1);
    });

    it("should calculate coverage correctly for incomplete translations", async () => {
      setMockConfig({
        en: mockEnTranslations,
        zh: mockZhIncomplete,
      });

      const result = await validateTranslations();

      // Based on our mock data calculation
      expect(result.coverage).toBeCloseTo(92.86, 1);
    });

    it("should handle zero coverage gracefully", async () => {
      setMockConfig({
        en: mockEnTranslations,
        zh: {},
      });

      const result = await validateTranslations();

      expect(result.coverage).toBeGreaterThanOrEqual(0);
      expect(result.coverage).toBeLessThanOrEqual(100);
    });
  });

  describe("Error handling", () => {
    it("should handle malformed translation files", async () => {
      // Mock a malformed translation file
      vi.doMock("../../messages/zh/critical.json", () => {
        throw new Error("Malformed JSON");
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should handle missing translation files", async () => {
      // Mock missing translation file
      vi.doMock("../../messages/zh/critical.json", () => {
        throw new Error("Module not found");
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });
  });

  describe("Basic edge cases", () => {
    it("should handle empty translation files", async () => {
      // 设置所有语言都为空对象
      setMockConfig({
        en: {},
        zh: {},
      });

      const result = await validateTranslations();

      // 当所有翻译文件都为空时
      expect(result.isValid).toBe(false); // 空文件被视为无效
      expect(result.coverage).toBe(100); // 100% of nothing is still 100%
      expect(result.missingKeys).toHaveLength(0); // 没有基准键来比较
    });

    it("should handle null and undefined values", async () => {
      vi.doMock("../../messages/en/critical.json", () => ({
        default: {
          test: {
            nullValue: null,
            undefinedValue: undefined,
            validValue: "test",
          },
        },
      }));

      const result = await validateTranslations();

      // Should handle null/undefined gracefully
      expect(result).toBeDefined();
      expect(typeof result.coverage).toBe("number");
    });

    it("should handle mixed data types in translations", async () => {
      // 设置包含混合数据类型的翻译数据
      setMockConfig({
        en: {
          mixed: {
            string: "Hello",
            number: 42,
            boolean: true,
            array: ["a", "b", "c"],
            object: { nested: "value" },
          },
        },
        zh: {
          mixed: {
            string: "你好",
            number: 42,
            boolean: true,
            array: ["甲", "乙", "丙"],
            object: { nested: "值" },
          },
        },
      });

      const result = await validateTranslations();

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
    });
  });

  describe("Performance tests", () => {
    it("should handle large translation files efficiently", async () => {
      // 生成大量翻译键来测试性能
      const largeTranslations: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeTranslations[`key_${i}`] = `Value ${i}`;
      }

      setMockConfig({
        en: largeTranslations,
        zh: largeTranslations,
      });

      const _startTime = Date.now();
      const result = await validateTranslations();
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(typeof result.coverage).toBe("number");
      expect(result.coverage).toBeCloseTo(100, 1);
      expect(endTime - _startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
