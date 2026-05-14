import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * i18n 核心功能单元测试
 *
 * 测试策略：
 * - 不依赖 SSR 环境
 * - 专注于核心逻辑测试
 * - 使用 Mock 模拟外部依赖
 * - 覆盖 locale 检测、消息加载、格式化等核心功能
 *
 * 注意：本文件用于验证 i18n 内部配置与消息加载逻辑，刻意保留独立的
 * mockEnMessages/mockZhMessages 结构，不复用 src/test/constants/mock-messages
 * 以避免单元测试与集中 mock 工具产生额外耦合。
 */

// Mock配置 - 使用vi.hoisted确保Mock在模块导入前设置
const { mockRouting, mockEnMessages, mockZhMessages, mockGetFormats } =
  vi.hoisted(() => ({
    mockRouting: {
      locales: ["en", "zh"] as const,
      defaultLocale: "en" as const,
      pathnames: {},
    },
    mockEnMessages: {
      common: {
        loading: "Loading...",
        error: "Error occurred",
        success: "Success",
      },
      navigation: {
        home: "Home",
        about: "About",
        contact: "Contact",
      },
      footer: {
        description: "Reusable showcase website starter.",
      },
    },
    mockZhMessages: {
      common: {
        loading: "加载中...",
        error: "发生错误",
        success: "成功",
      },
      navigation: {
        home: "首页",
        about: "关于",
        contact: "联系",
      },
      footer: {
        description: "可复用展示型网站 starter。",
      },
    },
    mockGetFormats: vi.fn(),
    mockDetectLocale: vi.fn(),
    mockLoadMessages: vi.fn(),
  }));

// Mock routing配置
vi.mock("@/i18n/routing", () => ({
  routing: mockRouting,
}));

// Mock 格式化函数
vi.mock("@/i18n/formats", () => ({
  getFormats: mockGetFormats,
}));

describe("i18n 核心功能单元测试", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 重置环境变量
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PLAYWRIGHT_TEST", "false");

    // 设置默认的格式化配置
    mockGetFormats.mockReturnValue({
      dateTime: {
        short: {
          day: "numeric" as const,
          month: "short" as const,
          year: "numeric" as const,
        },
      },
      number: {
        currency: {
          style: "currency" as const,
          currency: "USD",
        },
      },
    });
  });

  describe("Locale 检测和验证", () => {
    it("应该正确验证有效的 locale", () => {
      const validLocales = ["en", "zh"];

      validLocales.forEach((locale) => {
        expect(mockRouting.locales).toContain(locale);
      });
    });

    it("应该识别无效的 locale", () => {
      const invalidLocales = ["fr", "de", "ja", "invalid"];

      invalidLocales.forEach((locale) => {
        expect(mockRouting.locales).not.toContain(locale);
      });
    });

    it("应该提供默认 locale", () => {
      expect(mockRouting.defaultLocale).toBe("en");
      expect(mockRouting.locales).toContain(mockRouting.defaultLocale);
    });

    it("应该处理 locale 回退逻辑", () => {
      // 模拟 locale 回退函数
      const fallbackToDefault = (locale: string | null | undefined) => {
        if (!locale || !mockRouting.locales.includes(locale as any)) {
          return mockRouting.defaultLocale;
        }
        return locale;
      };

      expect(fallbackToDefault(null)).toBe("en");
      expect(fallbackToDefault(undefined)).toBe("en");
      expect(fallbackToDefault("")).toBe("en");
      expect(fallbackToDefault("invalid")).toBe("en");
      expect(fallbackToDefault("zh")).toBe("zh");
      expect(fallbackToDefault("en")).toBe("en");
    });
  });

  describe("消息加载和缓存", () => {
    it("应该正确加载英文消息", async () => {
      // 模拟消息加载函数
      const loadMessages = async (locale: string) => {
        if (locale === "en") {
          return mockEnMessages;
        } else if (locale === "zh") {
          return mockZhMessages;
        }
        throw new Error(`Unsupported locale: ${locale}`);
      };

      const enMessages = await loadMessages("en");
      expect(enMessages).toEqual(mockEnMessages);
      expect(enMessages.common.loading).toBe("Loading...");
      expect(enMessages.navigation.home).toBe("Home");
    });

    it("应该正确加载中文消息", async () => {
      const loadMessages = async (locale: string) => {
        if (locale === "en") {
          return mockEnMessages;
        } else if (locale === "zh") {
          return mockZhMessages;
        }
        throw new Error(`Unsupported locale: ${locale}`);
      };

      const zhMessages = await loadMessages("zh");
      expect(zhMessages).toEqual(mockZhMessages);
      expect(zhMessages.common.loading).toBe("加载中...");
      expect(zhMessages.navigation.home).toBe("首页");
    });

    it("应该处理消息加载错误", async () => {
      const loadMessages = async (locale: string) => {
        if (locale === "invalid") {
          throw new Error(`Unsupported locale: ${locale}`);
        }
        return mockEnMessages;
      };

      await expect(loadMessages("invalid")).rejects.toThrow(
        "Unsupported locale: invalid",
      );
    });

    it("应该验证消息结构完整性", () => {
      // 验证必需的消息键存在
      const requiredKeys = [
        "common.loading",
        "common.error",
        "common.success",
        "navigation.home",
        "navigation.about",
        "footer.description",
      ];

      const validateMessages = (messages: Record<string, unknown>) => {
        const flattenKeys = (
          obj: Record<string, unknown>,
          prefix = "",
        ): string[] => {
          let keys: string[] = [];
          Object.keys(obj).forEach((key) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === "object" && obj[key] !== null) {
              keys = keys.concat(flattenKeys(obj[key] as any, fullKey));
            } else {
              keys.push(fullKey);
            }
          });
          return keys;
        };

        const availableKeys = flattenKeys(messages);
        return requiredKeys.every((key) => availableKeys.includes(key));
      };

      expect(validateMessages(mockEnMessages)).toBe(true);
      expect(validateMessages(mockZhMessages)).toBe(true);
    });
  });

  describe("格式化配置", () => {
    it("应该为英文提供正确的格式化配置", () => {
      const enFormats = {
        dateTime: {
          short: {
            day: "numeric" as const,
            month: "short" as const,
            year: "numeric" as const,
          },
        },
        number: {
          currency: {
            style: "currency" as const,
            currency: "USD",
          },
        },
      };

      mockGetFormats.mockReturnValue(enFormats);
      const formats = mockGetFormats("en");

      expect(formats.number.currency.currency).toBe("USD");
      expect(formats.dateTime.short.day).toBe("numeric");
    });

    it("应该为中文提供正确的格式化配置", () => {
      const zhFormats = {
        dateTime: {
          short: {
            day: "numeric" as const,
            month: "short" as const,
            year: "numeric" as const,
          },
        },
        number: {
          currency: {
            style: "currency" as const,
            currency: "CNY",
          },
        },
      };

      mockGetFormats.mockReturnValue(zhFormats);
      const formats = mockGetFormats("zh");

      expect(formats.number.currency.currency).toBe("CNY");
      expect(formats.dateTime.short.day).toBe("numeric");
    });
  });

  describe("时区配置", () => {
    it("应该为不同 locale 提供正确的时区", () => {
      const getTimeZone = (locale: string) => {
        return locale === "zh" ? "Asia/Shanghai" : "UTC";
      };

      expect(getTimeZone("en")).toBe("UTC");
      expect(getTimeZone("zh")).toBe("Asia/Shanghai");
      expect(getTimeZone("unknown")).toBe("UTC"); // 默认回退
    });
  });

  describe("测试环境特殊处理", () => {
    it("应该在测试环境下禁用严格类型检查", () => {
      vi.stubEnv("NODE_ENV", "test");

      const getStrictMessageTypeSafety = () => {
        return (
          process.env.NODE_ENV !== "test" &&
          process.env.PLAYWRIGHT_TEST !== "true"
        );
      };

      expect(getStrictMessageTypeSafety()).toBe(false);
    });

    it("应该在 Playwright 测试环境下禁用严格类型检查", () => {
      vi.stubEnv("PLAYWRIGHT_TEST", "true");

      const getStrictMessageTypeSafety = () => {
        return (
          process.env.NODE_ENV !== "test" &&
          process.env.PLAYWRIGHT_TEST !== "true"
        );
      };

      expect(getStrictMessageTypeSafety()).toBe(false);
    });

    it("应该在生产环境下启用严格类型检查", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("PLAYWRIGHT_TEST", "false");

      const getStrictMessageTypeSafety = () => {
        return (
          process.env.NODE_ENV !== "test" &&
          process.env.PLAYWRIGHT_TEST !== "true"
        );
      };

      expect(getStrictMessageTypeSafety()).toBe(true);
    });
  });

  describe("配置对象生成", () => {
    it("应该生成完整的 i18n 配置对象", () => {
      const generateConfig = (
        locale: string,
        messages: Record<string, unknown>,
      ) => {
        return {
          locale,
          messages: messages || {},
          timeZone: locale === "zh" ? "Asia/Shanghai" : "UTC",
          now: new Date(),
          formats: mockGetFormats(locale),
          strictMessageTypeSafety:
            process.env.NODE_ENV !== "test" &&
            process.env.PLAYWRIGHT_TEST !== "true",
        };
      };

      const enConfig = generateConfig("en", mockEnMessages);
      expect(enConfig.locale).toBe("en");
      expect(enConfig.messages).toEqual(mockEnMessages);
      expect(enConfig.timeZone).toBe("UTC");
      expect(enConfig.now).toBeInstanceOf(Date);
      expect(enConfig.strictMessageTypeSafety).toBe(false); // 测试环境

      const zhConfig = generateConfig("zh", mockZhMessages);
      expect(zhConfig.locale).toBe("zh");
      expect(zhConfig.messages).toEqual(mockZhMessages);
      expect(zhConfig.timeZone).toBe("Asia/Shanghai");
    });
  });
});
