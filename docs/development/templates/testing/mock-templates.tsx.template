/**
 * 标准Mock模板
 * 提供统一的vi.hoisted Mock配置模式，确保所有测试使用一致的Mock方式
 */

import React from "react";
import { vi } from "vitest";

// Mock组件的类型定义
interface MockDropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface MockDropdownMenuContentProps {
  children: React.ReactNode;
  align?: string;
  [key: string]: unknown;
}

interface MockDropdownMenuTriggerProps {
  children: React.ReactNode;
}

interface MockButtonProps {
  children: React.ReactNode;
  variant?: string;
  size?: string;
  [key: string]: unknown;
}

interface MockIconProps {
  className?: string;
  [key: string]: unknown;
}

/**
 * React Hooks Mock模板
 * 使用vi.hoisted确保Mock在模块加载前执行
 */
export const createReactHooksMock = () => {
  return vi.hoisted(() => {
    const mockSetState = vi.fn();
    const mockUseState = vi.fn();
    const mockUseEffect = vi.fn();
    const mockUseCallback = vi.fn();
    const mockUseMemo = vi.fn();
    const mockUseRef = vi.fn();

    return {
      useState: mockUseState.mockImplementation((initial) => [
        initial,
        mockSetState,
      ]),
      useEffect: mockUseEffect.mockImplementation((effect, _deps) => {
        if (typeof effect === "function") {
          const cleanup = effect();
          return cleanup;
        }
        return undefined;
      }),
      useCallback: mockUseCallback.mockImplementation((callback) => callback),
      useMemo: mockUseMemo.mockImplementation((factory) => factory()),
      useRef: mockUseRef.mockImplementation((initial) => ({
        current: initial,
      })),
      // 提供访问mock函数的方式
      _mocks: {
        setState: mockSetState,
        useState: mockUseState,
        useEffect: mockUseEffect,
        useCallback: mockUseCallback,
        useMemo: mockUseMemo,
        useRef: mockUseRef,
      },
    };
  });
};

/**
 * Window对象Mock模板
 * 提供完整的window对象Mock，包括事件监听器、matchMedia等
 */
export const createWindowMock = () => {
  return vi.hoisted(() => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();
    const mockDispatchEvent = vi.fn();

    const mockMatchMedia = vi.fn();
    const mockMediaQueryList = {
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    const mockWindow = {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: mockDispatchEvent,
      matchMedia: mockMatchMedia,
      location: {
        href: "http://localhost:3000",
        origin: "http://localhost:3000",
        pathname: "/",
        search: "",
        hash: "",
      },
      navigator: {
        userAgent: "Test Browser",
        language: "en-US",
        languages: ["en-US", "en"],
      },
      document: {
        documentElement: {
          clientWidth: 1024,
          clientHeight: 768,
        },
      },
    };

    // Setup default matchMedia behavior
    mockMatchMedia.mockReturnValue(mockMediaQueryList);

    return {
      mockWindow,
      mockAddEventListener,
      mockRemoveEventListener,
      mockDispatchEvent,
      mockMatchMedia,
      mockMediaQueryList,
    };
  });
};

/**
 * 浏览器API Mock模板
 */
export const createBrowserAPIMock = () => {
  return vi.hoisted(() => {
    // IntersectionObserver Mock
    const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn((element) => {
        // 模拟元素进入视口
        setTimeout(() => {
          callback([
            {
              target: element,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: {
                top: 0,
                left: 0,
                right: 100,
                bottom: 100,
                width: 100,
                height: 100,
              },
              intersectionRect: {
                top: 0,
                left: 0,
                right: 100,
                bottom: 100,
                width: 100,
                height: 100,
              },
              rootBounds: {
                top: 0,
                left: 0,
                right: 1000,
                bottom: 1000,
                width: 1000,
                height: 1000,
              },
              time: Date.now(),
            },
          ]);
        }, 0);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // ResizeObserver Mock
    const mockResizeObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn((element) => {
        // 模拟尺寸变化
        setTimeout(() => {
          callback([
            {
              target: element,
              contentRect: {
                width: 100,
                height: 100,
                top: 0,
                left: 0,
                right: 100,
                bottom: 100,
              },
              borderBoxSize: [{ inlineSize: 100, blockSize: 100 }],
              contentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
              devicePixelContentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
            },
          ]);
        }, 0);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // PerformanceObserver Mock
    const mockPerformanceObserver = vi.fn().mockImplementation((_callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn().mockReturnValue([]),
    }));

    // matchMedia Mock
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: !query.includes("(prefers-reduced-motion: reduce)"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Navigation API Mock
    const mockNavigation = {
      navigate: vi.fn().mockResolvedValue(undefined),
      reload: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      canGoBack: true,
      canGoForward: false,
      currentEntry: {
        url: "http://localhost:3000/",
        key: "test-key",
        id: "test-id",
        index: 0,
        sameDocument: true,
      },
      entries: vi.fn().mockReturnValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    return {
      IntersectionObserver: mockIntersectionObserver,
      ResizeObserver: mockResizeObserver,
      PerformanceObserver: mockPerformanceObserver,
      matchMedia: mockMatchMedia,
      navigation: mockNavigation,
      // 提供访问mock函数的方式
      _mocks: {
        IntersectionObserver: mockIntersectionObserver,
        ResizeObserver: mockResizeObserver,
        PerformanceObserver: mockPerformanceObserver,
        matchMedia: mockMatchMedia,
        navigation: mockNavigation,
      },
    };
  });
};

/**
 * UI组件Mock模板
 */
export const createUIComponentMock = () => {
  return vi.hoisted(() => {
    // DropdownMenu组件Mock
    const DropdownMenu = ({
      children,
      open,
      onOpenChange,
    }: MockDropdownMenuProps) => (
      <div
        data-testid="dropdown-menu"
        data-open={open}
        onClick={() => onOpenChange?.(!open)}
      >
        {children}
      </div>
    );

    const DropdownMenuContent = ({
      children,
      align,
      ...props
    }: MockDropdownMenuContentProps) => (
      <div data-testid="dropdown-content" data-align={align} {...props}>
        {children}
      </div>
    );

    const DropdownMenuTrigger = ({
      children,
    }: MockDropdownMenuTriggerProps) => (
      <div data-testid="dropdown-trigger">{children}</div>
    );

    // Button组件Mock
    const Button = ({ children, variant, size, ...props }: MockButtonProps) => (
      <button
        data-testid="theme-button"
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    );

    // Icon组件Mock
    const Icons = {
      Sun: ({ className, ...props }: MockIconProps) => (
        <span data-testid="sun-icon" className={className} {...props}>
          ☀️
        </span>
      ),
      Moon: ({ className, ...props }: MockIconProps) => (
        <span data-testid="moon-icon" className={className} {...props}>
          🌙
        </span>
      ),
      Monitor: ({ className, ...props }: MockIconProps) => (
        <span data-testid="monitor-icon" className={className} {...props}>
          🖥️
        </span>
      ),
    };

    return {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuTrigger,
      Button,
      Icons,
    };
  });
};

/**
 * Next.js Mock模板
 */
export const createNextJSMock = () => {
  return vi.hoisted(() => {
    const mockRouter = {
      push: vi.fn().mockResolvedValue(true),
      replace: vi.fn().mockResolvedValue(true),
      prefetch: vi.fn().mockResolvedValue(undefined),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      pathname: "/",
      query: {},
      asPath: "/",
      route: "/",
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    };

    const mockUseRouter = vi.fn(() => mockRouter);
    const mockUseSearchParams = vi.fn(() => new URLSearchParams());
    const mockUsePathname = vi.fn(() => "/");
    const mockUseParams = vi.fn(() => ({}));

    return {
      useRouter: mockUseRouter,
      useSearchParams: mockUseSearchParams,
      usePathname: mockUsePathname,
      useParams: mockUseParams,
      _mocks: {
        router: mockRouter,
        useRouter: mockUseRouter,
        useSearchParams: mockUseSearchParams,
        usePathname: mockUsePathname,
        useParams: mockUseParams,
      },
    };
  });
};

/**
 * 测试工具函数
 */
export const createTestUtils = () => {
  return {
    /**
     * 等待异步操作完成
     */
    waitForAsync: async (ms: number = 0) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    },

    /**
     * 模拟用户交互
     */
    simulateUserInteraction: async (
      element: HTMLElement,
      action: "click" | "focus" | "blur",
    ) => {
      const event = new Event(action, { bubbles: true });
      element.dispatchEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 0));
    },

    /**
     * 创建Mock函数并跟踪调用
     */
    createTrackedMock: (name: string) => {
      const mock = vi.fn();
      mock.mockName(name);
      return mock;
    },

    /**
     * 重置所有Mock状态
     */
    resetAllMocks: () => {
      vi.clearAllMocks();
      vi.clearAllTimers();
    },
  };
};

/**
 * 完整的Mock设置函数
 * 在测试文件中使用此函数来设置所有必要的Mock
 */
export const setupStandardMocks = () => {
  const reactMocks = createReactHooksMock();
  const browserMocks = createBrowserAPIMock();
  const uiMocks = createUIComponentMock();
  const nextMocks = createNextJSMock();
  const utils = createTestUtils();

  return {
    react: reactMocks,
    browser: browserMocks,
    ui: uiMocks,
    next: nextMocks,
    utils,
  };
};
