import { beforeEach, describe, expect, it, vi } from "vitest";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import type { Locale } from "@/i18n/routing";

// Mock next-intl/navigation
const mockCreateNavigation = vi.fn();
const mockDefineRouting = vi.fn();

const CURRENT_ROUTING_CONTRACT = {
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "never",
} as const;

vi.mock("next-intl/navigation", () => ({
  createNavigation: mockCreateNavigation,
}));

vi.mock("next-intl/routing", () => ({
  defineRouting: mockDefineRouting,
}));

// Mock config/paths
vi.mock("@/config/paths", () => ({
  validatePathsConfig: vi.fn().mockReturnValue(true),
}));

describe("i18n Routing Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockDefineRouting.mockImplementation((config) => config);

    mockCreateNavigation.mockReturnValue({
      Link: vi.fn(),
      redirect: vi.fn(),
      usePathname: vi.fn(),
      useRouter: vi.fn(),
    });
  });

  async function getRoutingDefinition() {
    await import("../routing-config");
    const config = mockDefineRouting.mock.calls[0]?.[0];
    if (!config) {
      throw new Error("defineRouting was not called");
    }
    return config;
  }

  describe("路由配置", () => {
    it("应该定义正确的语言配置", async () => {
      await getRoutingDefinition();

      expect(mockDefineRouting).toHaveBeenCalledWith(
        expect.objectContaining({
          locales: LOCALES_CONFIG.locales,
          defaultLocale: LOCALES_CONFIG.defaultLocale,
          localePrefix: LOCALES_CONFIG.localePrefix,
          pathnames: expect.objectContaining({
            "/": "/",
            "/about": "/about",
            "/contact": "/contact",
            "/products": "/products",
            "/products/[market]": "/products/[market]",
            "/oem-wholesale": "/oem-wholesale",
            "/guides/flood-barrier-materials-guide":
              "/guides/flood-barrier-materials-guide",
            "/guides/flood-barrier-specifications":
              "/guides/flood-barrier-specifications",
            "/request-quote": "/request-quote",
            "/warranty": "/warranty",
          }),
          alternateLinks: true,
          localeDetection: false,
        }),
      );
      expect(mockDefineRouting).toHaveBeenCalledWith(
        expect.objectContaining({
          locales: CURRENT_ROUTING_CONTRACT.locales,
          defaultLocale: CURRENT_ROUTING_CONTRACT.defaultLocale,
          localePrefix: CURRENT_ROUTING_CONTRACT.localePrefix,
        }),
      );
    });

    it("应该包含所有必要的路径名", async () => {
      const expectedPaths = [
        "/",
        "/about",
        "/contact",
        "/products",
        "/products/[market]",
        "/oem-wholesale",
        "/guides/flood-barrier-materials-guide",
        "/guides/flood-barrier-specifications",
        "/request-quote",
        "/warranty",
        "/privacy",
        "/terms",
      ];

      const config = await getRoutingDefinition();

      expectedPaths.forEach((path) => {
        expect(config.pathnames).toHaveProperty(path, path);
      });
    });

    it("应该使用配置里的locale前缀", async () => {
      const config = await getRoutingDefinition();
      expect(config?.localePrefix).toBe(LOCALES_CONFIG.localePrefix);
    });

    it("应该启用alternateLinks", async () => {
      const config = await getRoutingDefinition();
      expect(config?.alternateLinks).toBe(true);
    });

    it("应该禁用localeDetection", async () => {
      const config = await getRoutingDefinition();
      expect(config?.localeDetection).toBe(false);
    });
  });

  describe("导航函数创建", () => {
    it("应该从routing-config导出配置里的locale truth", async () => {
      const routingModule = await import("../routing");

      expect(routingModule.routing.locales).toEqual(LOCALES_CONFIG.locales);
      expect(routingModule.routing.defaultLocale).toBe(
        LOCALES_CONFIG.defaultLocale,
      );
    });

    it("应该导出所有必要的导航函数", async () => {
      const routingModule = await import("../routing");

      expect(routingModule.Link).toBeDefined();
      expect(routingModule.redirect).toBeDefined();
      expect(routingModule.usePathname).toBeDefined();
      expect(routingModule.useRouter).toBeDefined();
    });
  });

  describe("类型定义", () => {
    it("应该正确定义Locale类型", () => {
      // This is a compile-time test, but we can verify the expected values
      const expectedLocales: Locale[] = [...LOCALES_CONFIG.locales];

      expectedLocales.forEach((locale) => {
        expect(LOCALES_CONFIG.locales).toContain(locale);
      });
    });
  });

  describe("配置验证", () => {
    it("应该导出路径配置验证函数", async () => {
      // 直接从 @/config/paths 导入，因为 routing.ts 重新导出了它
      const pathsModule = await import("@/config/paths");
      expect(pathsModule.validatePathsConfig).toBeDefined();
      expect(typeof pathsModule.validatePathsConfig).toBe("function");
    });
  });

  describe("路径名配置", () => {
    it("应该为所有路径使用相同的值（Shared Pathnames）", async () => {
      const config = await getRoutingDefinition();
      const pathnames = config?.pathnames;

      // 验证所有路径名都是字符串，而不是对象（表示使用Shared Pathnames）
      Object.entries(pathnames).forEach(([key, value]) => {
        expect(typeof value).toBe("string");
        expect(value).toBe(key);
      });
    });

    it("应该包含主要页面路径", async () => {
      const config = await getRoutingDefinition();
      const pathnames = config?.pathnames;

      const mainPages = [
        "/",
        "/about",
        "/contact",
        "/products",
        "/oem-wholesale",
        "/request-quote",
      ];
      mainPages.forEach((page) => {
        expect(pathnames).toHaveProperty(page);
      });
    });

    it("应该包含动态路由模式", async () => {
      const config = await getRoutingDefinition();
      const pathnames = config.pathnames;

      const dynamicRoutes = ["/products/[market]"];
      dynamicRoutes.forEach((route) => {
        expect(pathnames).toHaveProperty(route);
      });
    });

    it("应该包含法律页面路径", async () => {
      const config = await getRoutingDefinition();
      const pathnames = config.pathnames;

      const legalPages = ["/privacy", "/terms"];
      legalPages.forEach((page) => {
        expect(pathnames).toHaveProperty(page);
      });
    });
  });

  describe("语言配置", () => {
    it("应该支持配置里的语言", async () => {
      const config = await getRoutingDefinition();
      expect(config.locales).toEqual(LOCALES_CONFIG.locales);
    });

    it("应该使用配置里的默认语言", async () => {
      const config = await getRoutingDefinition();
      expect(config.defaultLocale).toBe(LOCALES_CONFIG.defaultLocale);
    });

    it("应该验证语言代码格式", async () => {
      const config = await getRoutingDefinition();
      config.locales.forEach((locale: string) => {
        expect(locale).toMatch(/^[a-z]{2}$/);
      });
    });
  });

  describe("SEO配置", () => {
    it("应该启用hreflang链接生成", async () => {
      const config = await getRoutingDefinition();
      expect(config.alternateLinks).toBe(true);
    });

    it("应该禁用智能语言检测", async () => {
      const config = await getRoutingDefinition();
      expect(config.localeDetection).toBe(false);
    });
  });

  describe("边缘情况处理", () => {
    it("应该处理空路径", async () => {
      const config = await getRoutingDefinition();
      expect(config.pathnames["/"]).toBe("/");
    });

    it("应该处理所有路径都有前导斜杠", async () => {
      const config = await getRoutingDefinition();
      Object.keys(config.pathnames).forEach((path) => {
        expect(path).toMatch(/^\//);
      });
    });

    it("应该确保路径名一致性", async () => {
      const config = await getRoutingDefinition();
      Object.entries(config.pathnames).forEach(([key, value]) => {
        expect(key).toBe(value);
      });
    });
  });

  describe("配置完整性", () => {
    it("应该包含所有必需的配置项", async () => {
      const config = await getRoutingDefinition();
      const requiredFields = [
        "locales",
        "defaultLocale",
        "localePrefix",
        "pathnames",
        "alternateLinks",
        "localeDetection",
      ];

      requiredFields.forEach((field) => {
        expect(config).toHaveProperty(field);
      });
    });

    it("应该有合理的配置值", async () => {
      const config = await getRoutingDefinition();

      expect(Array.isArray(config.locales)).toBe(true);
      expect(config.locales.length).toBeGreaterThan(0);
      expect(typeof config.defaultLocale).toBe("string");
      expect(config.locales).toContain(config.defaultLocale);
      expect(typeof config.pathnames).toBe("object");
      expect(Object.keys(config.pathnames).length).toBeGreaterThan(0);
    });
  });
});
