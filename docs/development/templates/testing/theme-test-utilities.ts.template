/**
 * 主题相关测试工具库
 * 基于ThemeToggle测试优化经验，提供主题测试的标准化工具
 *
 * @version 1.0.0
 * @author ThemeToggle测试优化项目
 */

import { vi } from "vitest";

/**
 * 主题类型定义
 */
export type ThemeType = "light" | "dark" | "system";

/**
 * 主题Hook Mock接口
 */
export interface ThemeHookMock {
  theme: ThemeType;
  isOpen: boolean;
  setIsOpen: ReturnType<typeof vi.fn>;
  supportsViewTransitions: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  handleThemeChange: ReturnType<typeof vi.fn>;
  handleKeyDown: ReturnType<typeof vi.fn>;
  ariaAttributes: {
    "aria-label": string;
    "aria-expanded": string;
    "aria-haspopup": string;
    "aria-current": string;
  };
}

function setMockAriaAttribute(
  mock: ThemeHookMock,
  key: "aria-current" | "aria-expanded",
  value: string,
): void {
  if (!mock.ariaAttributes) {
    return;
  }

  // nosemgrep: object-injection-sink-dynamic-property
  // 安全说明：ThemeHookMock.ariaAttributes 来自测试内部构造的受控对象，仅用于
  // 在 Vitest 环境中模拟 aria-* 属性的更新，不会暴露到生产代码路径或接收用户输入。
  mock.ariaAttributes[key] = value;
}

/**
 * 主题测试工具类
 */
export class ThemeTestUtils {
  /**
   * 创建标准主题Hook Mock
   */
  static createThemeHookMock(
    overrides: Partial<ThemeHookMock> = {},
  ): ThemeHookMock {
    const defaultMock: ThemeHookMock = {
      theme: "light",
      isOpen: false,
      setIsOpen: vi.fn(),
      supportsViewTransitions: true,
      prefersReducedMotion: false,
      prefersHighContrast: false,
      handleThemeChange: vi.fn(),
      handleKeyDown: vi.fn(),
      ariaAttributes: {
        "aria-label": "主题切换",
        "aria-expanded": "false",
        "aria-haspopup": "menu",
        "aria-current": "light",
      },
    };

    // nosemgrep: object-injection-sink-spread-operator
    // 安全说明：defaultMock 与 overrides 均为测试内部构造的 ThemeHookMock 片段，
    // 仅用于 Vitest 用例中模拟主题 Hook 状态，不会直接接收用户输入或写入生产对象。
    return { ...defaultMock, ...overrides };
  }

  /**
   * 更新主题Hook Mock状态
   */
  static updateThemeHookMock(
    mock: ThemeHookMock,
    updates: Partial<ThemeHookMock>,
  ): void {
    Object.assign(mock, updates);

    // 自动同步aria-current与theme
    if (updates.theme) {
      setMockAriaAttribute(mock, "aria-current", updates.theme);
    }

    // 自动同步aria-expanded与isOpen
    if (updates.isOpen !== undefined) {
      setMockAriaAttribute(
        mock,
        "aria-expanded",
        updates.isOpen ? "true" : "false",
      );
    }
  }

  /**
   * 创建View Transitions API Mock
   */
  static createViewTransitionsMock(): ReturnType<typeof vi.fn> {
    return vi.fn().mockImplementation((callback?: () => void) => {
      callback?.();
      return Promise.resolve();
    });
  }

  /**
   * 创建localStorage Mock
   */
  static createLocalStorageMock() {
    return {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
  }

  /**
   * 创建matchMedia Mock
   */
  static createMatchMediaMock() {
    return vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  /**
   * 主题切换测试场景
   */
  static getThemeScenarios() {
    return [
      {
        name: "Light Theme",
        theme: "light" as ThemeType,
        expectedAria: "light",
        description: "should switch to light theme",
      },
      {
        name: "Dark Theme",
        theme: "dark" as ThemeType,
        expectedAria: "dark",
        description: "should switch to dark theme",
      },
      {
        name: "System Theme",
        theme: "system" as ThemeType,
        expectedAria: "system",
        description: "should switch to system theme",
      },
    ];
  }

  /**
   * 可访问性测试场景
   */
  static getAccessibilityScenarios() {
    return [
      {
        name: "High Contrast Mode",
        config: { prefersHighContrast: true },
        description: "should support high contrast mode",
      },
      {
        name: "Reduced Motion",
        config: { prefersReducedMotion: true },
        description: "should respect reduced motion preferences",
      },
      {
        name: "View Transitions Disabled",
        config: { supportsViewTransitions: false },
        description: "should work without View Transitions API",
      },
    ];
  }

  /**
   * 边缘情况测试场景
   */
  static getEdgeCaseScenarios() {
    return [
      {
        name: "Invalid Theme State",
        setup: (mock: ThemeHookMock) => {
          mock.theme = undefined as unknown as ThemeType;
          setMockAriaAttribute(mock, "aria-current", "light"); // fallback
        },
        description: "should handle invalid theme state",
      },
      {
        name: "Network Error",
        setup: (mock: ThemeHookMock) => {
          mock.handleThemeChange.mockImplementation(() => {
            // Simulate network error without console output
            throw new Error("Network request failed");
          });
        },
        description: "should handle network errors",
      },
      {
        name: "API Unavailable",
        setup: () => {
          // Mock API failure scenarios
        },
        description: "should handle API unavailability",
      },
    ];
  }
}

/**
 * 主题测试断言工具
 */
class ThemeTestAssertions {
  /**
   * 验证主题按钮属性
   */
  static verifyThemeButton(
    selector: string = '[data-testid="theme-toggle-button"]',
    expectedTheme: ThemeType = "light",
  ): Element {
    const button = document.querySelector(selector);
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-current", expectedTheme);
    expect(button).toHaveAttribute("aria-label", "主题切换");
    expect(button).toHaveAttribute("aria-haspopup", "menu");
    return button as Element;
  }

  /**
   * 验证主题菜单项
   */
  static verifyThemeMenuItems(): {
    light: Element;
    dark: Element;
    system: Element;
  } {
    const light = document.querySelector(
      '[data-testid="theme-menu-item-light"]',
    );
    const dark = document.querySelector('[data-testid="theme-menu-item-dark"]');
    const system = document.querySelector(
      '[data-testid="theme-menu-item-system"]',
    );

    expect(light).toBeInTheDocument();
    expect(dark).toBeInTheDocument();
    expect(system).toBeInTheDocument();

    expect(light).toHaveAttribute("role", "menuitem");
    expect(dark).toHaveAttribute("role", "menuitem");
    expect(system).toHaveAttribute("role", "menuitem");

    return { light: light!, dark: dark!, system: system! };
  }

  /**
   * 验证下拉菜单
   */
  static verifyDropdownMenu(): Element {
    const dropdown = document.querySelector('[data-testid="dropdown-menu"]');
    expect(dropdown).toBeInTheDocument();
    return dropdown as Element;
  }

  /**
   * 验证主题切换调用
   */
  static verifyThemeChange(
    mockFunction: ReturnType<typeof vi.fn>,
    expectedTheme: ThemeType,
    callIndex: number = 0,
  ): void {
    expect(mockFunction).toHaveBeenCalledWith(
      expectedTheme,
      expect.any(Object),
    );

    if (
      callIndex >= 0 &&
      mockFunction.mock?.calls &&
      Array.isArray(mockFunction.mock.calls)
    ) {
      const { calls } = mockFunction.mock;
      if (callIndex < calls.length) {
        // 安全的数组访问，避免对象注入
        const call =
          Array.isArray(calls) && callIndex >= 0 && callIndex < calls.length
            ? calls.at(callIndex)
            : null;
        if (call) {
          expect(call).toEqual([expectedTheme, expect.any(Object)]);
        }
      }
    }
  }

  /**
   * 验证键盘导航
   */
  static verifyKeyboardNavigation(
    mockFunction: ReturnType<typeof vi.fn>,
    expectedKey: string,
  ): void {
    expect(mockFunction).toHaveBeenCalledWith(
      expect.objectContaining({ key: expectedKey }),
      expect.any(Function),
    );
  }
}

/**
 * 主题测试Mock工厂
 */
class ThemeTestMockFactory {
  /**
   * 创建完整的主题测试环境
   */
  static createThemeTestEnvironment() {
    const themeHookMock = ThemeTestUtils.createThemeHookMock();
    const viewTransitionsMock = ThemeTestUtils.createViewTransitionsMock();
    const localStorageMock = ThemeTestUtils.createLocalStorageMock();
    const matchMediaMock = ThemeTestUtils.createMatchMediaMock();

    return {
      themeHookMock,
      viewTransitionsMock,
      localStorageMock,
      matchMediaMock,

      // 便捷的重置方法
      reset: () => {
        vi.clearAllMocks();
        ThemeTestUtils.updateThemeHookMock(themeHookMock, {
          theme: "light",
          isOpen: false,
          supportsViewTransitions: true,
          prefersReducedMotion: false,
          prefersHighContrast: false,
        });
      },

      // 便捷的更新方法
      updateTheme: (updates: Partial<ThemeHookMock>) => {
        ThemeTestUtils.updateThemeHookMock(themeHookMock, updates);
      },
    };
  }

  /**
   * 获取UI组件Mock配置
   */
  static getUIComponentMockConfig() {
    return {
      DropdownMenu: "Mock DropdownMenu component",
      DropdownMenuTrigger: "Mock DropdownMenuTrigger component",
      DropdownMenuContent: "Mock DropdownMenuContent component",
      Button: "Mock Button component",
    };
  }

  /**
   * 获取图标Mock配置
   */
  static getIconMockConfig() {
    return {
      Sun: "Mock Sun icon",
      Moon: "Mock Moon icon",
      Monitor: "Mock Monitor icon",
    };
  }
}

/**
 * 导出所有工具
 */
export { ThemeTestUtils as default, ThemeTestAssertions, ThemeTestMockFactory };
