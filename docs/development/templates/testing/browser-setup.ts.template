/**
 * 浏览器测试环境专用设置
 * 配置浏览器特定的测试环境和Mock
 */

/// <reference lib="dom" />
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

// 浏览器API Mock配置
beforeAll(() => {
  // 配置浏览器特定的全局变量
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // 配置IntersectionObserver
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    value: class IntersectionObserver {
      constructor(
        _callback: (_entries: unknown[], _observer: unknown) => void,
      ) {
        // Mock implementation
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });

  // 配置ResizeObserver
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    value: class ResizeObserver {
      constructor(
        _callback: (_entries: unknown[], _observer: unknown) => void,
      ) {
        // Mock implementation
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });

  // 配置Performance API
  Object.defineProperty(window, "performance", {
    writable: true,
    value: {
      ...window.performance,
      mark: () => {},
      measure: () => {},
      getEntriesByType: () => [],
      getEntriesByName: () => [],
      clearMarks: () => {},
      clearMeasures: () => {},
    },
  });

  // 配置Web Vitals相关API
  Object.defineProperty(window, "PerformanceObserver", {
    writable: true,
    value: class PerformanceObserver {
      constructor(_callback: (_list: unknown, _observer: unknown) => void) {
        // Mock implementation
      }
      observe() {}
      disconnect() {}
    },
  });

  // 配置Clipboard API
  Object.defineProperty(navigator, "clipboard", {
    writable: true,
    value: {
      writeText: async () => {},
      readText: () => Promise.resolve(""),
    },
  });

  // 配置User Agent
  Object.defineProperty(navigator, "userAgent", {
    writable: true,
    value:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // Browser test environment initialized
});

// 每个测试前的清理
beforeEach(() => {
  // 清理DOM
  document.body.innerHTML = "";

  // 重置滚动位置
  window.scrollTo(0, 0);

  // 清理localStorage和sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // 重置CSS媒体查询
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1280,
  });

  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: 720,
  });
});

// 每个测试后的清理
afterEach(() => {
  // 清理定时器
  vi.clearAllTimers();

  // 清理所有Mock
  vi.clearAllMocks();

  // 清理事件监听器
  document.removeEventListener = vi.fn();
  window.removeEventListener = vi.fn();
});

// 全局清理
afterAll(() => {
  // Browser test environment cleaned up
});

// 浏览器测试工具函数
export const browserTestUtils = {
  /**
   * 模拟窗口大小变化
   */
  resizeWindow: (width: number, height: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });

    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: height,
    });

    // 触发resize事件
    window.dispatchEvent(new Event("resize"));
  },

  /**
   * 模拟媒体查询匹配
   */
  mockMediaQuery: (query: string, matches: boolean) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (q: string) => ({
        matches: q === query ? matches : false,
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });
  },

  /**
   * 模拟滚动到指定位置
   */
  scrollTo: (x: number, y: number) => {
    Object.defineProperty(window, "scrollX", {
      writable: true,
      configurable: true,
      value: x,
    });

    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: y,
    });

    // 触发scroll事件
    window.dispatchEvent(new Event("scroll"));
  },

  /**
   * 等待动画完成
   */
  waitForAnimation: (duration: number = 300) => {
    return new Promise((resolve) => setTimeout(resolve, duration));
  },

  /**
   * 模拟触摸事件
   */
  createTouchEvent: (
    type: string,
    touches: Array<{ clientX: number; clientY: number }>,
  ) => {
    return new TouchEvent(type, {
      touches: touches.map((touch) => ({
        ...touch,
        identifier: 0,
        target: document.body,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
        pageX: touch.clientX,
        pageY: touch.clientY,
        screenX: touch.clientX,
        screenY: touch.clientY,
      })) as unknown as Touch[],
    });
  },
};

// 导出给测试文件使用
export default browserTestUtils;
