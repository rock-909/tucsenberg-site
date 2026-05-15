/**
 * @vitest-environment jsdom
 */

import { usePathname } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileNavigationInteractive as MobileNavigation } from "@/components/layout/mobile-navigation-interactive";

// Mock next-intl - 完整的Mock配置
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => "en"),
  useFormatter: vi.fn(() => ({
    dateTime: vi.fn(),
    number: vi.fn(),
    relativeTime: vi.fn(),
  })),
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
  Link: ({ children, href, className, onClick, ...props }: any) => (
    <a href={href} className={className} onClick={onClick} {...props}>
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

describe("Mobile Navigation - Advanced Integration Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Setup default mocks
    (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
      (key: string) => {
        const translations: Record<string, string> = {
          "navigation.home": "Home",
          "navigation.about": "About",
          "navigation.membranes": "Membranes",
          "navigation.compatibility": "Compatibility",
          "navigation.materials": "Materials",
          "navigation.quote": "Quote",
          "navigation.capabilities": "Capabilities",
          "navigation.howItWorks": "How It Works",
          "navigation.products": "Products",
          "navigation.blog": "Blog",
          "navigation.customProject": "Custom",
          "navigation.contact": "Contact",
          "navigation.menu": "Toggle mobile menu",
          "navigation.close": "Close",
          "accessibility.openMenu": "Open menu",
          "accessibility.closeMenu": "Close menu",
          "seo.siteName": "Site Name",
          "seo.description": "Site Description",
          "navigation.contactSales": "Contact Sales",
        };
        return translations[key] || key; // key 来自测试数据，安全
      },
    );

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
  });

  describe("Complex Accessibility Scenarios", () => {
    it("should handle complex keyboard navigation patterns", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      await user.click(toggleButton);

      expect(screen.getByRole("navigation")).toBeInTheDocument();

      const languageButton = screen.getByRole("button", {
        name: "Language English",
      });
      languageButton.focus();
      expect(languageButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(languageButton).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByTestId("mobile-language-option-label-en"),
      ).toBeInTheDocument();

      // Escape should close menu
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });

    it("should handle advanced screen reader scenarios", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });

      // Test ARIA live regions and announcements
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");

      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute("aria-expanded", "true");

      // Test navigation landmark
      const navigation = screen.getByRole("navigation");
      expect(navigation).toHaveAttribute("aria-label");
    });

    it("should handle performance optimization in complex scenarios", async () => {
      // Test multiple rapid interactions
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });

      // Rapid open/close cycles
      for (let i = 0; i < 3; i++) {
        fireEvent.click(toggleButton);
        expect(screen.getByRole("navigation")).toBeInTheDocument();

        fireEvent.click(toggleButton);
        expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      }
    });
  });

  describe("Navigation Interaction", () => {
    it("closes menu when navigation link is clicked", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const membranesLink = screen.getByRole("link", { name: "Membranes" });
      await user.click(membranesLink);

      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("supports keyboard navigation between items", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThanOrEqual(3);
      const [membranesLink, compatibilityLink, materialsLink] =
        links as HTMLAnchorElement[];
      if (!membranesLink || !compatibilityLink || !materialsLink) {
        throw new Error(
          "Expected navigation links to be present for keyboard test",
        );
      }

      membranesLink.focus();
      expect(membranesLink).toHaveFocus();

      await user.tab();
      expect(compatibilityLink).toHaveFocus();

      await user.tab();
      expect(materialsLink).toHaveFocus();
    });

    it("handles missing translations gracefully", async () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
        (key: string) => key,
      );

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      // Should still render with fallback keys
      expect(screen.getByText("navigation.membranes")).toBeInTheDocument();
      expect(screen.getByText("navigation.compatibility")).toBeInTheDocument();
    });

    it("renders navigation items in correct order", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      const links = screen.getAllByRole("link");
      const linkTexts = links.map((link) => link.textContent?.trim());

      // Navigation items + CTA. Language links are collapsed by default.
      expect(linkTexts).toEqual([
        "Membranes",
        "Compatibility",
        "Materials",
        "Quote",
        "Contact Sales",
      ]);

      fireEvent.click(screen.getByRole("button", { name: "Language English" }));
      expect(
        screen.getByTestId("mobile-language-option-label-en"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("mobile-language-option-label-es"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("mobile-language-option-label-zh"),
      ).not.toBeInTheDocument();
    });

    it("applies consistent styling to navigation items", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      const links = screen.getAllByRole("link");

      // Filter out the CTA button link (which has different styling)
      const navLinks = links.filter((link) =>
        link.className.includes("rounded-md px-3 py-2"),
      );

      navLinks.forEach((link) => {
        // Check for actual classes used in navigation link items
        expect(link).toHaveClass(
          "flex",
          "items-center",
          "rounded-md",
          "px-3",
          "py-2",
        );
      });
    });

    it("supports custom navigation item styling", async () => {
      render(<MobileNavigation className="custom-nav" />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const membranesLink = screen.getByRole("link", { name: "Membranes" });
      expect(membranesLink).toBeInTheDocument();
    });

    it("handles long navigation item text", async () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
        (key: string) => {
          const translations: Record<string, string> = {
            "navigation.home": "Very Long Home Page Title",
            "navigation.about": "About Us and Our Company",
            "navigation.membranes": "Very Long Membranes Catalog Title",
            "navigation.compatibility": "Compatibility Guidance and Fit Notes",
            "navigation.services": "Our Professional Services",
            "navigation.contact": "Contact Information",
            "navigation.menu": "Menu",
            "navigation.close": "Close",
          };
          return translations[key] || key; // key 来自测试数据，安全
        },
      );

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(
        screen.getByText("Very Long Membranes Catalog Title"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Compatibility Guidance and Fit Notes"),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper button attributes", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveAttribute("type", "button");
      expect(trigger).toHaveAttribute("aria-label", "Open menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("updates ARIA attributes when menu opens", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      // aria-label changes to "Close menu" when menu is open
      expect(trigger).toHaveAttribute("aria-label", "Close menu");
    });

    it("provides proper navigation landmark", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      // Navigation role is only available when menu is open
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("supports screen reader navigation", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      const nav = screen.getByRole("navigation");
      const links = screen.getAllByRole("link");

      expect(nav).toBeInTheDocument();
      expect(links.length).toBeGreaterThan(0);
    });

    it("handles focus management correctly", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Focus should be manageable
      trigger.focus();
      expect(trigger).toHaveFocus();

      fireEvent.click(trigger);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Language English" }),
      ).toHaveAttribute("aria-expanded", "false");
    });

    it("supports keyboard navigation", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Tab to trigger
      await user.tab();
      expect(trigger).toHaveFocus();

      // Activate with Enter
      await user.keyboard("{Enter}");
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Close with Escape
      await user.keyboard("{Escape}");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("provides proper focus indicators", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // Check for actual focus-visible classes used in the Button component
      expect(trigger).toHaveClass(
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
        "outline-none",
      );
    });

    it("supports high contrast mode", () => {
      render(
        <MobileNavigation className="forced-colors:border-[ButtonText]" />,
      );

      // Custom className is applied to the container div, not the button
      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("forced-colors:border-[ButtonText]");
    });

    it("handles reduced motion preferences", () => {
      render(<MobileNavigation className="motion-reduce:transition-none" />);

      // Custom className is applied to the container div, not the button
      const container = screen.getByRole("button").closest("div");
      expect(container).toHaveClass("motion-reduce:transition-none");
    });

    it("provides adequate touch targets", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // Check for actual size classes used in the component (size-9 = h-9 w-9)
      expect(trigger).toHaveClass("size-9");
    });

    it("supports voice control", () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Should have proper semantic structure for voice control
      expect(trigger).toHaveAttribute("type", "button");
      expect(trigger).toHaveAttribute("aria-label");
    });

    it("handles aria-current for navigation items", async () => {
      // Set placeholder anchor path to test aria-current.
      mockPathname.current = "#coming-soon";

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      const membranesLink = screen.getByRole("link", { name: "Membranes" });
      expect(membranesLink).toHaveAttribute("aria-current", "page");

      const contactLink = screen.getByRole("link", { name: "Contact Sales" });
      expect(contactLink).not.toHaveAttribute("aria-current");
    });

    it("provides proper link semantics", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      fireEvent.click(trigger);

      const links = screen.getAllByRole("link");

      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });

    it("supports internationalization", async () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
        (key: string) => {
          const translations: Record<string, string> = {
            "navigation.home": "首页",
            "navigation.about": "关于我们",
            "navigation.membranes": "膜片",
            "navigation.compatibility": "兼容性",
            "navigation.materials": "材料",
            "navigation.quote": "询价",
            "navigation.products": "产品",
            "navigation.blog": "博客",
            "accessibility.openMenu": "打开菜单",
            "accessibility.closeMenu": "关闭菜单",
            "seo.siteName": "网站名称",
            "seo.description": "网站描述",
          };

          return translations[key] || key; // key 来自测试数据，安全
        },
      );

      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");
      // The aria-label comes from t("accessibility.openMenu") which is "打开菜单"
      expect(trigger).toHaveAttribute("aria-label", "打开菜单");

      fireEvent.click(trigger);
      // aria-label changes to t("accessibility.closeMenu") which is "关闭菜单"
      expect(trigger).toHaveAttribute("aria-label", "关闭菜单");

      expect(screen.getByText("膜片")).toBeInTheDocument();
      expect(screen.getByText("兼容性")).toBeInTheDocument();
    });

    it("handles complex accessibility scenarios", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Initial state
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Open menu
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Navigation role is only available when menu is open
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();

      // Navigate to link
      const membranesLink = screen.getByRole("link", { name: "Membranes" });
      membranesLink.focus();
      expect(membranesLink).toHaveFocus();

      // Close menu
      await user.keyboard("{Escape}");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveFocus();
    });

    it("maintains accessibility during state changes", async () => {
      render(<MobileNavigation />);

      const trigger = screen.getByRole("button");

      // Test multiple state changes
      for (let i = 0; i < 3; i++) {
        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "true");

        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      }
    });
  });
});
