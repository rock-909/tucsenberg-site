/**
 * @vitest-environment jsdom
 */

import { usePathname } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mobileNavigation } from "@/lib/navigation";
import { MobileNavigationInteractive as MobileNavigation } from "@/components/layout/mobile-navigation-interactive";
import { createMockUseTranslations } from "@/test/utils";

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

describe("Mobile Navigation - Core Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    (useTranslations as ReturnType<typeof vi.fn>).mockImplementation(
      createMockUseTranslations(),
    );

    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
  });

  describe("Basic Rendering", () => {
    it("should render mobile navigation toggle button", () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it("should render menu icon initially", () => {
      render(<MobileNavigation />);

      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("close-icon")).not.toBeInTheDocument();
    });

    it("should not show navigation items initially", () => {
      render(<MobileNavigation />);

      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  describe("Menu Toggle Functionality", () => {
    it("should open menu when toggle button is clicked", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should show close icon when menu is open", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      // The close icon is actually x-icon in the Sheet close button
      expect(screen.getByTestId("x-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("menu-icon")).not.toBeInTheDocument();
    });

    it("should close menu when close button is clicked", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  describe("Navigation Items", () => {
    it("should render all navigation links when menu is open", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /products/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /blog/i })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /resources/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /about/i })).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /custom/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /^Contact$/i }),
      ).toBeInTheDocument();
    });

    it("should highlight active navigation item", async () => {
      // Set pathname to /about to test aria-current
      mockPathname.current = "/about";

      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      const aboutLink = screen.getByRole("link", { name: /about/i });
      expect(aboutLink).toHaveAttribute("aria-current", "page");
    });

    it("should close menu when navigation link is clicked", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      const homeLink = screen.getByRole("link", { name: /home/i });
      fireEvent.click(homeLink);

      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility Features", () => {
    it("should have proper ARIA attributes on toggle button", () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");
      expect(toggleButton).toHaveAttribute("aria-controls");
    });

    it("should update ARIA attributes when menu is opened", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    });

    it("should have proper navigation landmark", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      const navigation = screen.getByRole("navigation");
      expect(navigation).toHaveAttribute("aria-label");
    });

    it("should support keyboard navigation", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      toggleButton.focus();

      await user.keyboard("{Enter}");
      expect(screen.getByRole("navigation")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should be hidden on desktop screens", () => {
      render(<MobileNavigation />);

      // The header-mobile-only class is on the container div, not the button
      const toggleButton = screen.getByRole("button", { name: /menu/i });
      const container = toggleButton.closest("div");
      expect(container).toHaveClass("header-mobile-only");
    });

    it("should handle viewport changes", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      // Simulate viewport change
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      window.dispatchEvent(new Event("resize"));

      // Menu should still be functional
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });

  describe("Translation Integration", () => {
    it("should use translated navigation labels", async () => {
      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      // Verify translated labels are used
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Products" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Blog" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Resources" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Custom" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Contact" })).toBeInTheDocument();
    });

    it("should handle missing translations gracefully", async () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockReturnValue(
        (key: string) => key,
      );

      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", {
        name: /menu/i,
      });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      // Should still render with fallback keys
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing pathname gracefully", async () => {
      (usePathname as ReturnType<typeof vi.fn>).mockReturnValue(null);

      render(<MobileNavigation />);

      const toggleButton = screen.getByRole("button", { name: /menu/i });
      // Use fireEvent to avoid pointer-events issues
      fireEvent.click(toggleButton);

      // Should still render navigation items
      expect(screen.getByRole("navigation")).toBeInTheDocument();
      // +1 = CTA link. Language links stay collapsed until the language row is opened.
      expect(screen.getAllByRole("link")).toHaveLength(
        mobileNavigation.length + 1,
      );
    });

    it("should handle translation function errors", async () => {
      (useTranslations as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Translation error");
      });

      // Should throw the translation error
      expect(() => render(<MobileNavigation />)).toThrow("Translation error");
    });
  });
});
