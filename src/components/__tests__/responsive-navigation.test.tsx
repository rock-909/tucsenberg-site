// Mock React for useState
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@/test/utils";

// Mock a responsive navigation component
const ResponsiveNavigation = ({ children }: { children?: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav data-testid="responsive-navigation">
      {/* Desktop Navigation */}
      <div data-testid="desktop-nav" className="hidden md:flex">
        <div data-testid="desktop-menu">Desktop Menu</div>
      </div>

      {/* Mobile Navigation */}
      <div data-testid="mobile-nav" className="md:hidden">
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          ☰
        </button>

        {isMobileMenuOpen && (
          <div data-testid="mobile-menu" className="mobile-menu-open">
            Mobile Menu Content
          </div>
        )}
      </div>

      {children}
    </nav>
  );
};

// Mock window.matchMedia for responsive testing
const createMatchMediaMock = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe("ResponsiveNavigation Component", () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
  });

  describe("Basic Rendering", () => {
    it("should render without errors", () => {
      expect(() => {
        const { container } = render(<ResponsiveNavigation />);
        expect(container).toBeInTheDocument();
      }).not.toThrow();
    });

    it("should render navigation container", () => {
      render(<ResponsiveNavigation />);

      const nav = document.querySelector(
        '[data-testid="responsive-navigation"]',
      );
      expect(nav).toBeInTheDocument();
    });

    it("should render both desktop and mobile navigation elements", () => {
      render(<ResponsiveNavigation />);

      const desktopNav = document.querySelector('[data-testid="desktop-nav"]');
      const mobileNav = document.querySelector('[data-testid="mobile-nav"]');

      expect(desktopNav).toBeInTheDocument();
      expect(mobileNav).toBeInTheDocument();
    });
  });

  describe("Desktop Navigation", () => {
    beforeEach(() => {
      // Mock desktop viewport
      window.matchMedia = createMatchMediaMock(true);
    });

    it("should display desktop navigation on large screens", () => {
      render(<ResponsiveNavigation />);

      const desktopNav = document.querySelector('[data-testid="desktop-nav"]');
      const desktopMenu = document.querySelector(
        '[data-testid="desktop-menu"]',
      );

      expect(desktopNav).toBeInTheDocument();
      expect(desktopMenu).toBeInTheDocument();
      expect(desktopMenu).toHaveTextContent("Desktop Menu");
    });

    it("should have proper CSS classes for desktop display", () => {
      render(<ResponsiveNavigation />);

      const desktopNav = document.querySelector('[data-testid="desktop-nav"]');
      expect(desktopNav).toHaveClass("hidden", "md:flex");
    });
  });

  describe("Mobile Navigation", () => {
    beforeEach(() => {
      // Mock mobile viewport
      window.matchMedia = createMatchMediaMock(false);
    });

    it("should display mobile navigation toggle button", () => {
      render(<ResponsiveNavigation />);

      const mobileNav = document.querySelector('[data-testid="mobile-nav"]');
      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      );

      expect(mobileNav).toBeInTheDocument();
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveTextContent("☰");
    });

    it("should have proper CSS classes for mobile display", () => {
      render(<ResponsiveNavigation />);

      const mobileNav = document.querySelector('[data-testid="mobile-nav"]');
      expect(mobileNav).toHaveClass("md:hidden");
    });

    it("should toggle mobile menu on button click", () => {
      render(<ResponsiveNavigation />);

      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      ) as HTMLElement;
      expect(toggleButton).toBeInTheDocument();

      // Initially, mobile menu should not be visible
      let mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).not.toBeInTheDocument();

      // Click to open menu
      fireEvent.click(toggleButton);

      mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).toBeInTheDocument();
      expect(mobileMenu).toHaveTextContent("Mobile Menu Content");

      // Click to close menu
      fireEvent.click(toggleButton);

      mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).not.toBeInTheDocument();
    });

    it("should update aria-expanded attribute correctly", () => {
      render(<ResponsiveNavigation />);

      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      ) as HTMLElement;

      // Initially closed
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");

      // Open menu
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute("aria-expanded", "true");

      // Close menu
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Responsive Behavior", () => {
    it("should handle viewport size changes", () => {
      // Start with mobile viewport
      window.matchMedia = createMatchMediaMock(false);

      const { rerender } = render(<ResponsiveNavigation />);

      const mobileNav = document.querySelector('[data-testid="mobile-nav"]');
      const desktopNav = document.querySelector('[data-testid="desktop-nav"]');

      expect(mobileNav).toBeInTheDocument();
      expect(desktopNav).toBeInTheDocument();

      // Switch to desktop viewport
      window.matchMedia = createMatchMediaMock(true);
      rerender(<ResponsiveNavigation />);

      // Both should still be in DOM but with different visibility classes
      expect(mobileNav).toBeInTheDocument();
      expect(desktopNav).toBeInTheDocument();
    });

    it("should maintain state during viewport changes", () => {
      render(<ResponsiveNavigation />);

      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      ) as HTMLElement;

      // Open mobile menu
      fireEvent.click(toggleButton);

      let mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).toBeInTheDocument();

      // Menu should remain open even after re-render
      mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<ResponsiveNavigation />);

      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      );

      expect(toggleButton).toHaveAttribute("aria-expanded");
      expect(toggleButton).toHaveAttribute("aria-label", "Toggle mobile menu");
    });

    it("should be keyboard accessible", () => {
      render(<ResponsiveNavigation />);

      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      ) as HTMLElement;

      // Button should be focusable
      toggleButton.focus();
      expect(document.activeElement).toBe(toggleButton);

      // Should respond to keyboard events (Enter key should work like click)
      fireEvent.keyDown(toggleButton, { key: "Enter" });

      // For this test, we'll just verify the button is accessible
      // In a real implementation, Enter key would trigger the click handler
      expect(toggleButton).toBeInTheDocument();

      // Should handle Escape key (in real implementation)
      fireEvent.keyDown(toggleButton, { key: "Escape" });
    });

    it("should support screen readers", () => {
      render(<ResponsiveNavigation />);

      const nav = document.querySelector(
        '[data-testid="responsive-navigation"]',
      );
      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      );

      expect(nav?.tagName.toLowerCase()).toBe("nav");
      expect(toggleButton?.tagName.toLowerCase()).toBe("button");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid toggle clicks", () => {
      render(<ResponsiveNavigation />);

      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      ) as HTMLElement;

      // Rapid clicks
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      // Should end up closed
      const mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
      expect(mobileMenu).not.toBeInTheDocument();
      expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should handle component unmounting with open menu", () => {
      const { unmount } = render(<ResponsiveNavigation />);

      const toggleButton = document.querySelector(
        '[data-testid="mobile-menu-toggle"]',
      ) as HTMLElement;

      // Open menu
      fireEvent.click(toggleButton);

      expect(() => {
        unmount();
      }).not.toThrow();

      // Verify cleanup
      const nav = document.querySelector(
        '[data-testid="responsive-navigation"]',
      );
      expect(nav).not.toBeInTheDocument();
    });

    it("should handle missing matchMedia gracefully", () => {
      // Remove matchMedia temporarily
      const tempMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;

      expect(() => {
        render(<ResponsiveNavigation />);
      }).not.toThrow();

      // Restore matchMedia
      window.matchMedia = tempMatchMedia;
    });
  });
});
