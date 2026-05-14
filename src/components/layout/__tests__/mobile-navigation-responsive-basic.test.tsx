/**
 * @vitest-environment jsdom
 */

/**
 * Mobile Navigation Responsive - Basic Tests
 *
 * 专门测试基本响应式功能，包括：
 * - 基本响应式行为
 * - 屏幕尺寸适配
 * - 视口变化处理
 * - 断点功能
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

// Create a mutable pathname mock
const mockPathname = { current: "/" };

// Mock @/i18n/routing
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, className, onClick, ...props }: any) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (onClick) onClick(e);
    };
    return (
      <a href={href} className={className} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  },
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => mockPathname.current),
}));

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  Menu: () => <span data-testid="menu-icon">☰</span>,
  X: () => <span data-testid="close-icon">✕</span>,
  XIcon: () => <span data-testid="x-icon">✕</span>,
  Globe: () => <span data-testid="globe-icon">🌐</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
}));

describe("Mobile Navigation Responsive - Basic Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock queueMicrotask to execute immediately for synchronous testing
    global.queueMicrotask = vi.fn((callback: () => void) => {
      callback();
    });

    // Reset pathname to root
    mockPathname.current = "/";

    // Setup default mocks
    (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
      (key: string) => {
        const translations: Record<string, string> = {
          "navigation.home": "Home",
          "navigation.about": "About",
          "navigation.services": "Services",
          "navigation.contact": "Contact",
          "navigation.products": "Products",
          "navigation.blog": "Blog",
          "navigation.menu": "Menu",
          "navigation.close": "Close",
          "accessibility.openMenu": "Open menu",
          "accessibility.closeMenu": "Close menu",
          "seo.siteName": "Site Name",
          "seo.description": "Site Description",
        };
        return translations[key] || key; // key 来自测试数据，安全
      },
    );

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
  });

  describe("基本响应式行为", () => {
    it("is hidden on desktop screens", () => {
      render(<MobileNavigation />);

      // The header-mobile-only class is on the container div, not the button
      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("header-mobile-only");
    });

    it("adapts to different screen sizes", () => {
      render(<MobileNavigation className="sm:block lg:hidden" />);

      // Custom responsive classes are applied to the container div
      const container = screen.getByRole("button").closest("div");
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

      // Custom padding classes are applied to the container div
      const container = screen.getByRole("button").closest("div");
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

      // Custom text sizing classes are applied to the container div
      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("text-sm", "md:text-base");
    });

    it("handles responsive menu positioning", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Menu should be positioned correctly
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });
  });

  describe("动画和过渡效果", () => {
    it("handles state transitions smoothly", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Should transition between states without errors
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("supports custom transition classes", () => {
      render(<MobileNavigation className="transition-all duration-300" />);

      // Custom transition classes are applied to the container div
      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("transition-all", "duration-300");
    });

    it("handles reduced motion preferences", () => {
      render(<MobileNavigation className="motion-reduce:transition-none" />);

      // Motion preferences are applied to the container div
      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("motion-reduce:transition-none");
    });
  });

  describe("路由变化行为", () => {
    it("closes the menu when pathname changes", async () => {
      const { rerender } = render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

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
      await user.click(trigger);

      // Simulate route change to about page
      mockPathname.current = "/about";
      rerender(<MobileNavigation />);

      const reopenedTrigger = screen.getByRole("button");
      await user.click(reopenedTrigger);

      const aboutLink = screen.getByRole("link", { name: "About" });
      expect(aboutLink).toHaveAttribute("aria-current", "page");
    });

    it("closes the menu during route changes", async () => {
      const { rerender } = render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

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
      const routes = ["/", "/about", "/services", "/contact"];

      for (const route of routes) {
        mockPathname.current = route;
        rerender(<MobileNavigation />);

        const trigger = screen.getByRole("button");
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      }
    });
  });

  describe("性能优化", () => {
    it("handles rapid interactions efficiently", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Rapid clicks should remain functionally stable.
      // Use fireEvent to avoid pointer-events issues.
      for (let i = 0; i < 10; i++) {
        fireEvent.click(trigger);
      }

      // Even number of toggles should return to the initial closed state.
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
  });

  describe("浏览器兼容性", () => {
    it("works without modern CSS features", () => {
      render(<MobileNavigation className="fallback-styles" />);

      // Fallback styles are applied to the container div
      const container = screen.getByRole("button").closest("div");
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

    it("works with touch devices", async () => {
      // Simulate touch device
      Object.defineProperty(navigator, "maxTouchPoints", {
        writable: true,
        value: 5,
      });

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
  });
});
