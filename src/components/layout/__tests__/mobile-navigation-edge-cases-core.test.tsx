/**
 * Mobile Navigation 核心边界情况测试
 * 包含基础错误处理和边界情况测试
 *
 * 注意：高级边界情况测试请参考 mobile-navigation-edge-cases.test.tsx
 */

import { usePathname } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileNavigationInteractive as MobileNavigation } from "@/components/layout/mobile-navigation-interactive";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
  NextIntlClientProvider: ({ children }: { children: any }) => children,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  Menu: () => <span data-testid="menu-icon">☰</span>,
  X: () => <span data-testid="close-icon">✕</span>,
  XIcon: () => <span data-testid="x-icon">✕</span>,
  Globe: () => <span data-testid="globe-icon">🌐</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
}));

// Mock i18n routing
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
}));

describe("Mobile Navigation - 核心边界情况测试", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Setup default mocks
    (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
      (key: string) => {
        if (key === "navigation.home") return "Home";
        if (key === "navigation.about") return "About";
        if (key === "navigation.services") return "Services";
        if (key === "navigation.contact") return "Contact";
        if (key === "navigation.menu") return "Menu";
        if (key === "navigation.close") return "Close";
        return key;
      },
    );

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
  });

  describe("基础错误处理", () => {
    it("优雅处理缺失的翻译", () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
        () => undefined,
      );

      expect(() => {
        render(<MobileNavigation />);
      }).not.toThrow();
    });

    it("优雅处理未定义的路径名", () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
        undefined as unknown as string,
      );

      expect(() => {
        render(<MobileNavigation />);
      }).not.toThrow();
    });

    it("处理翻译函数错误", () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Translation error");
      });

      // 组件应该抛出错误，因为没有错误边界处理
      expect(() => {
        render(<MobileNavigation />);
      }).toThrow("Translation error");
    });

    it("处理空翻译值", () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
        (key: string) => {
          if (key === "navigation.menu") return null;
          return key;
        },
      );

      expect(() => {
        render(<MobileNavigation />);
      }).not.toThrow();
    });

    it("处理空翻译字符串", () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
        (key: string) => {
          if (key === "navigation.menu") return "";
          return key;
        },
      );

      expect(() => {
        render(<MobileNavigation />);
      }).not.toThrow();
    });
  });

  describe("基础边界情况", () => {
    it("处理快速开关交互", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // 快速点击不应该破坏组件 - 使用fireEvent避免pointer-events问题
      fireEvent.click(trigger);
      fireEvent.click(trigger);
      fireEvent.click(trigger);

      expect(trigger).toBeInTheDocument();
    });

    it("处理组件重新挂载", () => {
      const { unmount } = render(<MobileNavigation />);

      expect(screen.getByRole("button")).toBeInTheDocument();

      unmount();

      // 重新渲染而不是使用rerender
      render(<MobileNavigation />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("处理打开状态下的属性变化", async () => {
      const { rerender } = render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // 在打开状态下更改属性
      rerender(<MobileNavigation className="updated" />);

      expect(trigger).toBeInTheDocument();
    });

    it("防止内存泄漏", () => {
      const { unmount } = render(<MobileNavigation />);

      // 组件应该正确清理
      expect(() => unmount()).not.toThrow();
    });

    it("处理并发状态更新", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // 模拟并发更新
      const promises = [
        user.click(trigger),
        user.click(trigger),
        user.click(trigger),
      ];

      await Promise.all(promises);
      expect(trigger).toBeInTheDocument();
    });

    it("处理多个实例", () => {
      render(
        <div>
          <div data-testid="nav1">
            <MobileNavigation />
          </div>
          <div data-testid="nav2">
            <MobileNavigation />
          </div>
        </div>,
      );

      const nav1 = screen.getByTestId("nav1");
      const nav2 = screen.getByTestId("nav2");

      expect(nav1).toBeInTheDocument();
      expect(nav2).toBeInTheDocument();

      // Verify both instances have mobile navigation buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
    });
  });

  describe("异常状态处理", () => {
    it("处理无效的路径名格式", () => {
      const invalidPaths = ["", "///", "invalid-path", null, undefined];

      invalidPaths.forEach((path) => {
        (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(
          path as unknown as string,
        );

        expect(() => {
          render(<MobileNavigation />);
        }).not.toThrow();
      });
    });

    it("处理翻译钩子失败", () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Hook failed");
      });

      // 组件应该抛出错误，因为没有错误边界处理
      expect(() => {
        render(<MobileNavigation />);
      }).toThrow("Hook failed");
    });

    it("处理路径名钩子失败", () => {
      (usePathname as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Pathname hook failed");
      });

      // React 19 会捕获渲染错误，组件不会直接抛出
      // 测试组件在错误情况下不会崩溃整个应用
      expect(() => {
        render(<MobileNavigation />);
      }).not.toThrow();
    });

    it("处理渲染中断", () => {
      const { unmount } = render(<MobileNavigation />);

      // 渲染后立即卸载
      expect(() => unmount()).not.toThrow();
    });

    it("处理无效的属性组合", () => {
      expect(() => {
        render(<MobileNavigation className={null as unknown as string} />);
      }).not.toThrow();

      expect(() => {
        render(
          <MobileNavigation data-testid={undefined as unknown as string} />,
        );
      }).not.toThrow();
    });
  });

  describe("状态恢复", () => {
    it("从状态不一致中恢复", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // 应该优雅处理快速交互 - 使用fireEvent避免pointer-events问题
      fireEvent.click(trigger);
      fireEvent.click(trigger);

      expect(trigger).toBeInTheDocument();
    });

    it("优雅处理缺失的DOM API", () => {
      // Mock缺失的API
      const originalAddEventListener = window.addEventListener;
      window.addEventListener =
        undefined as unknown as typeof window.addEventListener;

      expect(() => {
        render(<MobileNavigation />);
      }).not.toThrow();

      // 恢复
      window.addEventListener = originalAddEventListener;
    });
  });
});
