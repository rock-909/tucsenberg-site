/**
 * 统一Mock工具库 - 基于vi.hoisted模式
 * 提供标准化的Mock配置，确保测试的一致性和可维护性
 */

import React from "react";
import { vi } from "vitest";

// ================================
// 核心Mock工具函数
// ================================

/**
 * 创建vi.hoisted Mock配置的工厂函数
 * 确保所有Mock在模块导入前正确设置
 */
export function createHoistedMocks<T extends Record<string, unknown>>(
  mockDefinitions: () => T,
): T {
  return vi.hoisted(mockDefinitions);
}

// ================================
// next-intl Mock配置
// ================================

/**
 * next-intl标准Mock配置
 * 支持翻译函数、语言环境、路由等功能
 */
export const createNextIntlMocks = () => {
  const mockUseTranslations = vi.fn();
  const mockUseLocale = vi.fn();
  const mockUseMessages = vi.fn();
  const mockUseFormatter = vi.fn();
  const mockUseNow = vi.fn();
  const mockUseTimeZone = vi.fn();
  const mockLink = vi.fn();
  const mockRedirect = vi.fn();
  const mockUsePathname = vi.fn();
  const mockUseRouter = vi.fn();

  // 设置默认返回值
  mockUseTranslations.mockReturnValue((key: string, params?: unknown) => {
    if (params) {
      return `${key} with ${JSON.stringify(params)}`;
    }
    return key;
  });

  mockUseLocale.mockReturnValue("en");
  mockUseMessages.mockReturnValue({});
  mockUsePathname.mockReturnValue("/");
  mockUseRouter.mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  });

  mockLink.mockImplementation(
    ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => {
      return {
        type: "a",
        props: { ...props, children },
      };
    },
  );

  return {
    mockUseTranslations,
    mockUseLocale,
    mockUseMessages,
    mockUseFormatter,
    mockUseNow,
    mockUseTimeZone,
    mockLink,
    mockRedirect,
    mockUsePathname,
    mockUseRouter,
  };
};

/**
 * 应用next-intl Mock配置
 */
export const applyNextIntlMocks = (
  mocks: ReturnType<typeof createNextIntlMocks>,
) => {
  vi.mock("next-intl", () => ({
    useTranslations: mocks.mockUseTranslations,
    useLocale: mocks.mockUseLocale,
    useMessages: mocks.mockUseMessages,
    useFormatter: mocks.mockUseFormatter,
    useNow: mocks.mockUseNow,
    useTimeZone: mocks.mockUseTimeZone,
    // 2068507890 NextIntlClientProvider 805 190 renderWithIntl 998c0009e
    NextIntlClientProvider: ({
      children,
    }: {
      children: React.ReactNode;
      locale?: string;
      messages?: Record<string, unknown>;
    }) => React.createElement(React.Fragment, null, children),
  }));

  vi.mock("next-intl/link", () => ({
    default: mocks.mockLink,
  }));

  vi.mock("next-intl/navigation", () => ({
    usePathname: mocks.mockUsePathname,
    useRouter: mocks.mockUseRouter,
    redirect: mocks.mockRedirect,
  }));
};

// ================================
// 主题系统Mock配置
// ================================

/**
 * next-themes标准Mock配置
 */
export const createThemeMocks = () => {
  const mockSetTheme = vi.fn();
  const mockUseTheme = vi.fn();

  mockUseTheme.mockReturnValue({
    theme: "light",
    setTheme: mockSetTheme,
    resolvedTheme: "light",
    systemTheme: "light",
    themes: ["light", "dark", "system"],
  });

  return {
    mockSetTheme,
    mockUseTheme,
  };
};

/**
 * 应用主题系统Mock配置
 */
export const applyThemeMocks = (mocks: ReturnType<typeof createThemeMocks>) => {
  vi.mock("next-themes", () => ({
    useTheme: mocks.mockUseTheme,
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  }));
};

// ================================
// 浏览器API Mock配置
// ================================

/**
 * 浏览器API标准Mock配置
 */
export const createBrowserAPIMocks = () => {
  const mockMatchMedia = vi.fn();
  const mockIntersectionObserver = vi.fn();
  const mockResizeObserver = vi.fn();
  const mockPerformanceObserver = vi.fn();
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  // 设置默认实现
  mockMatchMedia.mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  mockIntersectionObserver.mockImplementation((_callback: unknown) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  mockResizeObserver.mockImplementation((_callback: unknown) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  return {
    mockMatchMedia,
    mockIntersectionObserver,
    mockResizeObserver,
    mockPerformanceObserver,
    mockLocalStorage,
  };
};

/**
 * 应用浏览器API Mock配置
 */
export const applyBrowserAPIMocks = (
  mocks: ReturnType<typeof createBrowserAPIMocks>,
) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mocks.mockMatchMedia,
  });

  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    value: mocks.mockIntersectionObserver,
  });

  Object.defineProperty(global, "ResizeObserver", {
    writable: true,
    value: mocks.mockResizeObserver,
  });

  Object.defineProperty(global, "localStorage", {
    writable: true,
    value: mocks.mockLocalStorage,
  });
};

// ================================
// 组合Mock配置
// ================================

/**
 * 创建完整的测试Mock环境
 * 包含所有常用的Mock配置
 */
export const createFullTestMocks = () => {
  const nextIntlMocks = createNextIntlMocks();
  const themeMocks = createThemeMocks();
  const browserMocks = createBrowserAPIMocks();

  return {
    ...nextIntlMocks,
    ...themeMocks,
    ...browserMocks,
  };
};

/**
 * 应用完整的Mock配置
 */
export const applyFullTestMocks = (
  mocks: ReturnType<typeof createFullTestMocks>,
) => {
  applyNextIntlMocks(mocks);
  applyThemeMocks(mocks);
  applyBrowserAPIMocks(mocks);
};

// ================================
// Mock配置验证工具
// ================================

/**
 * 验证Mock配置是否正确设置
 */
export const validateMockSetup = () => {
  const issues: string[] = [];

  // 检查vi.hoisted是否可用
  if (typeof vi.hoisted !== "function") {
    issues.push("vi.hoisted is not available");
  }

  // 检查关键Mock是否设置
  if (!vi.isMockFunction(vi.fn())) {
    issues.push("vi.fn() is not working correctly");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

// ================================
// 路由和导航Mock配置
// ================================

/**
 * Next.js路由Mock配置
 */
export const createNextRouterMocks = () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockBack = vi.fn();
  const mockForward = vi.fn();
  const mockRefresh = vi.fn();
  const mockPrefetch = vi.fn();

  const mockUseRouter = vi.fn();
  const mockUsePathname = vi.fn();
  const mockUseSearchParams = vi.fn();

  mockUseRouter.mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
  });

  mockUsePathname.mockReturnValue("/");
  mockUseSearchParams.mockReturnValue(new URLSearchParams());

  return {
    mockPush,
    mockReplace,
    mockBack,
    mockForward,
    mockRefresh,
    mockPrefetch,
    mockUseRouter,
    mockUsePathname,
    mockUseSearchParams,
  };
};

/**
 * 应用Next.js路由Mock配置
 */
export const applyNextRouterMocks = (
  mocks: ReturnType<typeof createNextRouterMocks>,
) => {
  vi.mock("next/navigation", () => ({
    useRouter: mocks.mockUseRouter,
    usePathname: mocks.mockUsePathname,
    useSearchParams: mocks.mockUseSearchParams,
  }));
};

// ================================
// 性能监控Mock配置
// ================================

/**
 * 性能监控API Mock配置
 */
export const createPerformanceMocks = () => {
  const mockPerformanceNow = vi.fn();
  const mockPerformanceMark = vi.fn();
  const mockPerformanceMeasure = vi.fn();
  const mockGetEntriesByType = vi.fn();
  const mockGetEntriesByName = vi.fn();

  mockPerformanceNow.mockReturnValue(Date.now());
  mockGetEntriesByType.mockReturnValue([]);
  mockGetEntriesByName.mockReturnValue([]);

  return {
    mockPerformanceNow,
    mockPerformanceMark,
    mockPerformanceMeasure,
    mockGetEntriesByType,
    mockGetEntriesByName,
  };
};

/**
 * 应用性能监控Mock配置
 */
export const applyPerformanceMocks = (
  mocks: ReturnType<typeof createPerformanceMocks>,
) => {
  Object.defineProperty(global.performance, "now", {
    writable: true,
    value: mocks.mockPerformanceNow,
  });

  Object.defineProperty(global.performance, "mark", {
    writable: true,
    value: mocks.mockPerformanceMark,
  });

  Object.defineProperty(global.performance, "measure", {
    writable: true,
    value: mocks.mockPerformanceMeasure,
  });

  Object.defineProperty(global.performance, "getEntriesByType", {
    writable: true,
    value: mocks.mockGetEntriesByType,
  });

  Object.defineProperty(global.performance, "getEntriesByName", {
    writable: true,
    value: mocks.mockGetEntriesByName,
  });
};

// ================================
// 事件处理Mock配置
// ================================

/**
 * DOM事件Mock配置
 */
export const createEventMocks = () => {
  const mockAddEventListener = vi.fn();
  const mockRemoveEventListener = vi.fn();
  const mockDispatchEvent = vi.fn();

  return {
    mockAddEventListener,
    mockRemoveEventListener,
    mockDispatchEvent,
  };
};

/**
 * 创建模拟事件对象
 */
export const createMockEvent = (
  type: string,
  properties: Record<string, unknown> = {},
) => {
  return {
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    target: null,
    currentTarget: null,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    ...properties,
  };
};

// ================================
// 增强的组合Mock配置
// ================================

/**
 * 创建完整的测试Mock环境（增强版）
 */
export const createEnhancedTestMocks = () => {
  const nextIntlMocks = createNextIntlMocks();
  const themeMocks = createThemeMocks();
  const browserMocks = createBrowserAPIMocks();
  const routerMocks = createNextRouterMocks();
  const performanceMocks = createPerformanceMocks();
  const eventMocks = createEventMocks();

  return {
    ...nextIntlMocks,
    ...themeMocks,
    ...browserMocks,
    ...routerMocks,
    ...performanceMocks,
    ...eventMocks,
  };
};

/**
 * 应用完整的增强Mock配置
 */
export const applyEnhancedTestMocks = (
  mocks: ReturnType<typeof createEnhancedTestMocks>,
) => {
  applyNextIntlMocks(mocks);
  applyThemeMocks(mocks);
  applyBrowserAPIMocks(mocks);
  applyNextRouterMocks(mocks);
  applyPerformanceMocks(mocks);
};

/**
 * Mock配置使用示例和最佳实践
 */
export const MOCK_USAGE_EXAMPLES = {
  basicUsage: `
// 在测试文件顶部使用
const mocks = vi.hoisted(() => createEnhancedTestMocks());
applyEnhancedTestMocks(mocks);
`,

  customMocks: `
// 自定义Mock配置
const customMocks = vi.hoisted(() => ({
  ...createNextIntlMocks(),
  customFunction: vi.fn(),
}));
`,

  testSpecificMocks: `
// 在特定测试中覆盖Mock
beforeEach(() => {
  mocks.mockUseTranslations.mockReturnValue((key) => \`test-\${key}\`);
});
`,

  eventTesting: `
// 事件测试示例
const clickEvent = createMockEvent('click', { clientX: 100, clientY: 200 });
fireEvent(element, clickEvent);
`,
};
