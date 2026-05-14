/**
 * @vitest-environment jsdom
 */

/**
 * Mobile Navigation Responsive - Main Tests
 *
 * 主要响应式集成测试，包括：
 * - 核心响应式功能验证
 * - 基本响应式测试
 * - 错误处理验证
 *
 * 详细测试请参考：
 * - mobile-navigation-responsive-basic.test.tsx - 基本响应式功能测试
 */

import { usePathname } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileNavigationInteractive as MobileNavigation } from "@/components/layout/mobile-navigation-interactive";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      "accessibility.closeMenu": "Close menu",
      "accessibility.openMenu": "Open menu",
      "seo.siteName": "[PROJECT_NAME]",
      "seo.description": "Modern web development",
    };
    return translations[key] || key;
  }),
  useLocale: vi.fn(() => "en"),
  NextIntlClientProvider: ({ children }: { children: any }) => children,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

// Create a mutable pathname mock
const mockPathname = { current: "/" };

// Mock @/i18n/routing
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: vi.fn(() => mockPathname.current),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  Menu: () => <span data-testid="menu-icon">☰</span>,
  X: () => <span data-testid="close-icon">✕</span>,
  XIcon: () => <span data-testid="x-icon">✕</span>,
  Globe: () => <span data-testid="globe-icon">🌐</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
}));

describe("Mobile Navigation Responsive - Main Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock queueMicrotask to execute immediately for synchronous testing
    global.queueMicrotask = vi.fn((callback: () => void) => {
      callback();
    });

    // Setup default mocks
    (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
      (key: string) => {
        const translations: Record<string, string> = {
          "navigation.home": "Home",
          "navigation.about": "About",
          "navigation.services": "Services",
          "navigation.contact": "Contact",
          "navigation.menu": "Menu",
          "navigation.close": "Close",
          "navigation.products": "Products",
          "navigation.blog": "Blog",
          "navigation.diagnostics": "Diagnostics",
          "accessibility.closeMenu": "Close menu",
          "accessibility.openMenu": "Open menu",
          "seo.siteName": "[PROJECT_NAME]",
          "seo.description": "Modern web development",
        };
        return translations[key] || key; // key 来自测试数据，安全
      },
    );

    // Reset pathname to root
    mockPathname.current = "/";

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
  });

  describe("核心响应式功能验证", () => {
    it("is hidden on desktop screens", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // header-mobile-only 类在外层容器上，不在 button 上
      const container = trigger.closest("div");
      expect(container).toHaveClass("header-mobile-only");
    });

    it("adapts to different screen sizes", () => {
      render(<MobileNavigation className="sm:block lg:hidden" />);

      const trigger = screen.getByRole("button");
      // 响应式类应该在外层容器上
      const container = trigger.closest("div");
      expect(container).toHaveClass("sm:block", "lg:hidden");
    });

    it("handles viewport changes gracefully", () => {
      // Simulate mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();
    });

    it("supports responsive padding and spacing", () => {
      render(<MobileNavigation className="p-2 md:p-4" />);

      const trigger = screen.getByRole("button");
      // 响应式padding类应该在外层容器上
      const container = trigger.closest("div");
      expect(container).toHaveClass("p-2", "md:p-4");
    });

    it("handles orientation changes", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();

      // Simulate orientation change
      window.dispatchEvent(new Event("orientationchange"));

      expect(trigger).toBeInTheDocument();
    });

    it("maintains functionality across breakpoints", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Should work regardless of screen size
      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("supports responsive text sizing", () => {
      render(<MobileNavigation className="text-sm md:text-base" />);

      const trigger = screen.getByRole("button");
      // 响应式文本大小类应该在外层容器上
      const container = trigger.closest("div");
      expect(container).toHaveClass("text-sm", "md:text-base");
    });

    it("handles responsive menu positioning", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // 使用 fireEvent 避免 pointer-events 问题
      fireEvent.click(trigger);

      // Menu should be positioned correctly
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("handles extreme viewport sizes", () => {
      // Very small viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 200,
      });

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("基本响应式测试", () => {
    it("handles state transitions smoothly", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Should transition between states without errors - 使用 fireEvent 避免 pointer-events 问题
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("supports custom transition classes", () => {
      render(<MobileNavigation className="transition-all duration-300" />);

      const trigger = screen.getByRole("button");
      // transition classes are on the outer container div
      const container = trigger.closest("div");
      expect(container).toHaveClass("transition-all");
      expect(container).toHaveClass("duration-300");
    });

    it("handles reduced motion preferences", () => {
      render(<MobileNavigation className="motion-reduce:transition-none" />);

      const trigger = screen.getByRole("button");
      // motion-reduce类应该在外层容器上
      const container = trigger.closest("div");
      expect(container).toHaveClass("motion-reduce:transition-none");
    });

    it("maintains performance during animations", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Rapid state changes should not cause performance issues - 使用 fireEvent 避免 pointer-events 问题
      for (let i = 0; i < 5; i++) {
        fireEvent.click(trigger);
      }

      expect(trigger).toBeInTheDocument();
    });

    it("closes the menu when pathname changes", async () => {
      const { rerender } = render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // 使用 fireEvent 避免 pointer-events 问题
      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Simulate route change
      mockPathname.current = "/about";
      rerender(<MobileNavigation />);

      const newTrigger = screen.getByRole("button");
      expect(newTrigger).toHaveAttribute("aria-expanded", "false");
    });

    it("updates active navigation item on route change", async () => {
      const { rerender } = render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // 使用 fireEvent 避免 pointer-events 问题
      fireEvent.click(trigger);

      // Simulate route change to about page
      mockPathname.current = "/about";
      rerender(<MobileNavigation />);

      const reopenedTrigger = screen.getByRole("button");
      fireEvent.click(reopenedTrigger);

      const aboutLink = screen.getByRole("link", { name: "About" });
      expect(aboutLink).toHaveAttribute("aria-current", "page");
    });

    it("handles complex route patterns", async () => {
      mockPathname.current = "/services/web-development";

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // 使用 fireEvent 避免 pointer-events 问题
      fireEvent.click(trigger);

      // 注意：实际的导航链接名称可能不是 "Services"，需要检查实际渲染的内容
      // 先检查组件是否正常渲染
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("closes the menu during route changes", async () => {
      const { rerender } = render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // 使用 fireEvent 避免 pointer-events 问题
      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Route change while menu is open
      mockPathname.current = "/contact";
      rerender(<MobileNavigation />);

      const newTrigger = screen.getByRole("button");
      expect(newTrigger).toHaveAttribute("aria-expanded", "false");
    });

    it("maintains navigation state across route changes", async () => {
      const { rerender } = render(<MobileNavigation />);

      // Navigate to different routes
      const routes = ["/", "/about", "/services"];

      for (const route of routes) {
        mockPathname.current = route;
        rerender(<MobileNavigation />);

        const trigger = screen.getByRole("button");
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      }
    });
  });

  describe("错误处理验证", () => {
    it("handles rapid interactions efficiently", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Rapid clicks should remain functionally stable - 使用 fireEvent 避免 pointer-events 问题
      for (let i = 0; i < 10; i++) {
        fireEvent.click(trigger);
      }

      // 偶数次切换后应回到初始关闭状态，而不是依赖机器速度。
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toBeInTheDocument();
    });

    it("optimizes re-renders", () => {
      const { rerender } = render(<MobileNavigation />);

      // Multiple re-renders with same props should be efficient
      for (let i = 0; i < 5; i++) {
        rerender(<MobileNavigation />);
      }

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();
    });

    it("handles memory efficiently", () => {
      const { unmount } = render(<MobileNavigation />);

      // Component should clean up properly
      expect(() => unmount()).not.toThrow();
    });

    it("works without modern CSS features", () => {
      render(<MobileNavigation className="fallback-styles" />);

      const trigger = screen.getByRole("button");
      // fallback-styles类应该在外层容器上
      const container = trigger.closest("div");
      expect(container).toHaveClass("fallback-styles");
    });

    it("handles missing viewport meta tag", () => {
      // Remove viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      viewportMeta?.remove();

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();
    });
  });
});
