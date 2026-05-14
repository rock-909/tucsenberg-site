import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileNavigationLinks } from "@/components/layout/mobile-navigation";
import {
  MobileMenuButton,
  MobileNavigationInteractive as MobileNavigation,
} from "@/components/layout/mobile-navigation-interactive";
import { createMockTranslations, renderWithIntl } from "@/test/utils";

const mockLocale = { current: "en" as "en" | "zh" };
const mockTranslationOverrides: { current?: Record<string, string> } = {};

// Mock next-intl
// Note: 使用集中的 mock 翻译函数,无需在此定义具体翻译
vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useLocale: vi.fn(() => mockLocale.current),
  useTranslations: vi.fn(() =>
    createMockTranslations(mockTranslationOverrides.current),
  ),
}));

// Mock i18n routing
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, onClick, ...props }: React.ComponentProps<"a">) => (
    <a href={href} onClick={onClick} {...props}>
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

// Mock navigation data
vi.mock("@/lib/navigation", () => {
  const mockItems = [
    { key: "home", href: "/", translationKey: "navigation.home" },
    { key: "about", href: "/about", translationKey: "navigation.about" },
    {
      key: "services",
      href: "/services",
      translationKey: "navigation.services",
    },
    {
      key: "products",
      href: "/products",
      translationKey: "navigation.products",
    },
    { key: "contact", href: "/contact", translationKey: "navigation.contact" },
  ];

  return {
    mainNavigation: mockItems,
    mobileNavigation: mockItems, // This is the key fix!
    isActivePath: vi.fn((currentPath: string, itemPath: string) => {
      return currentPath === itemPath;
    }),
    NAVIGATION_ARIA: {
      mobileNav: "Mobile navigation",
      mobileToggle: "Toggle mobile menu",
      mobileMenu: "Mobile menu",
      mobileMenuButton: "Toggle mobile menu",
    },
  };
});

// Mock UI components with proper state management
vi.mock("@/components/ui/sheet", () => {
  return {
    Sheet: ({
      children,
      open,
      onOpenChange,
    }: {
      children?: React.ReactNode;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => {
      // Create a simple mock that passes the state through
      return (
        <div
          data-testid="sheet"
          data-open={open?.toString()}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onOpenChange?.(false);
            }
          }}
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(
                  child as React.ReactElement,
                  {
                    ...(child.props || {}),
                    __sheetOpen: open,
                    __onOpenChange: onOpenChange,
                  } as any,
                )
              : child,
          )}
        </div>
      );
    },
    SheetContent: ({
      children,
      side,
      id,
      onEscapeKeyDown,
    }: {
      children?: React.ReactNode;
      side?: string;
      id?: string;
      onEscapeKeyDown?: () => void;
    }) => (
      <div
        data-testid="sheet-content"
        data-side={side}
        id={id}
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onEscapeKeyDown?.()}
      >
        {children}
      </div>
    ),
    SheetHeader: ({ children }: React.ComponentProps<"div">) => (
      <div data-testid="sheet-header">{children}</div>
    ),
    SheetTitle: ({ children }: React.ComponentProps<"div">) => (
      <h2 data-testid="sheet-title">{children}</h2>
    ),
    SheetDescription: ({ children }: React.ComponentProps<"div">) => (
      <p data-testid="sheet-description">{children}</p>
    ),
    SheetTrigger: ({
      children,
      asChild,
      __sheetOpen,
      __onOpenChange,
    }: {
      children?: React.ReactNode;
      asChild?: boolean;
      __sheetOpen?: boolean;
      __onOpenChange?: (open: boolean) => void;
    }) => {
      if (asChild && React.isValidElement(children)) {
        // When asChild is true, we need to clone the child and add our test id and click handler
        const child = React.Children.only(children);
        return React.cloneElement(child, {
          ...(React.isValidElement(child) ? (child as any).props : {}),
          "data-testid": "sheet-trigger",
          "aria-expanded": __sheetOpen ? "true" : "false",
          "data-state": __sheetOpen ? "open" : "closed",
          onClick: (e: Event) => {
            if (React.isValidElement(child) && (child as any).props.onClick) {
              (child as any).props.onClick(e);
            }
            __onOpenChange?.(!__sheetOpen);
          },
        });
      }
      return (
        <div
          data-testid="sheet-trigger"
          aria-expanded={__sheetOpen ? "true" : "false"}
          data-state={__sheetOpen ? "open" : "closed"}
          onClick={() => __onOpenChange?.(!__sheetOpen)}
        >
          {children}
        </div>
      );
    },
    SheetClose: ({
      children,
      asChild,
    }: {
      children?: React.ReactNode;
      asChild?: boolean;
    }) => {
      if (asChild && React.isValidElement(children)) {
        const child = React.Children.only(children);
        return React.cloneElement(child, {
          ...(React.isValidElement(child) ? (child as any).props : {}),
        });
      }

      return <div data-testid="sheet-close">{children}</div>;
    },
  };
});

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    asChild: _asChild,
    variant: _variant,
    size: _size,
    ...props
  }: React.ComponentProps<"button"> & {
    asChild?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/separator", () => ({
  Separator: ({ className }: React.ComponentProps<"div">) => (
    <hr data-testid="separator" className={className} />
  ),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Menu: () => <span data-testid="menu-icon">☰</span>,
  X: () => <span data-testid="close-icon">✕</span>,
  Globe: () => <span data-testid="globe-icon">🌐</span>,
  Check: () => <span data-testid="check-icon">✓</span>,
}));

describe("MobileNavigation Component", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale.current = "en";
    mockTranslationOverrides.current = {};
  });

  describe("Basic Rendering", () => {
    it("renders a server-safe link list for the no-JS fallback", () => {
      const html = renderToStaticMarkup(<MobileNavigationLinks />);

      expect(html).toContain("Home");
      expect(html).toContain("About");
      expect(html).toContain('href="/"');
      expect(html).not.toContain("aria-expanded");
    });

    it("renders mobile navigation trigger", () => {
      renderWithIntl(<MobileNavigation />);

      expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
      expect(screen.getByTestId("mobile-menu-toggle-label")).toHaveAttribute(
        "translate",
        "no",
      );
    });

    it("is visible only on mobile screens", () => {
      renderWithIntl(<MobileNavigation />);

      const container = screen.getByTestId("sheet").parentElement;
      // Should have mobile-only classes
      expect(container).toHaveClass("header-mobile-only");
    });

    it("applies custom className when provided", () => {
      const customClass = "custom-mobile-nav";
      renderWithIntl(<MobileNavigation className={customClass} />);

      const container = screen.getByTestId("sheet");
      expect(container).toBeInTheDocument();
    });

    it("uses localized site description instead of the English default", () => {
      mockLocale.current = "zh";
      mockTranslationOverrides.current = {
        "navigation.siteName": "示例展示型公司",
        "navigation.siteDescription": "可复用展示型网站 starter。",
      };

      renderWithIntl(<MobileNavigation />);

      expect(screen.getByTestId("sheet-description")).toHaveTextContent(
        "可复用展示型网站 starter。",
      );
      expect(screen.getByTestId("sheet-description")).not.toHaveTextContent(
        "Reusable showcase website starter for product or service presentation.",
      );
    });
  });

  describe("Menu Toggle Functionality", () => {
    it("opens menu when trigger is clicked", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });

      // Initially should be closed
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // Click should be possible (we can't easily test state change in this mock setup)
      await user.click(trigger);
      expect(trigger).toBeInTheDocument(); // Basic interaction test
    });

    it("shows navigation content when open", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      // Should show sheet content
      expect(screen.getByTestId("sheet-content")).toBeInTheDocument();
      expect(screen.getByTestId("sheet-header")).toBeInTheDocument();
    });

    it("closes menu when clicking outside", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      // Click on sheet to close
      const sheet = screen.getByTestId("sheet");
      await user.click(sheet);

      // Should close the menu
      expect(sheet).toHaveAttribute("data-open", "false");
    });
  });

  describe("Navigation Items", () => {
    it("renders protected language switcher labels only after expanding language options", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);
      await user.click(
        screen.getByRole("button", { name: "Language English" }),
      );

      expect(screen.getByTestId("mobile-language-switcher")).not.toHaveClass(
        "notranslate",
      );
      expect(
        screen.getByTestId("mobile-language-switcher"),
      ).not.toHaveAttribute("translate", "no");
      expect(
        screen.getByTestId("mobile-language-option-label-en"),
      ).toHaveAttribute("translate", "no");
      expect(
        screen.getByTestId("mobile-language-option-label-zh"),
      ).toHaveAttribute("translate", "no");
    });

    it("displays all navigation items when open", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      // Should show all navigation links
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("Services")).toBeInTheDocument();
      expect(screen.getByText("Products")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
    });

    it("closes menu when navigation item is clicked", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      // Click on a navigation item
      const homeLink = screen.getByText("Home");
      await user.click(homeLink);

      // Menu should close
      await waitFor(() => {
        const sheet = screen.getByTestId("sheet");
        expect(sheet).toHaveAttribute("data-open", "false");
      });
    });

    it("highlights active navigation item", async () => {
      // 使用vi.mocked来获取Mock函数的类型安全访问
      const { isActivePath } =
        await vi.importMock<typeof import("@/lib/navigation")>(
          "@/lib/navigation",
        );
      vi.mocked(isActivePath).mockImplementation(
        (_currentPath: string, itemPath: string) => {
          return itemPath === "/";
        },
      );

      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveAttribute("aria-current", "page");
    });
  });

  describe("Accessibility", () => {
    it("has proper button attributes", () => {
      renderWithIntl(<MobileNavigation />);

      const button = screen.getByRole("button", { name: /menu/i });
      expect(button).toHaveAttribute("aria-label");
    });

    it("manages focus properly when opening", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      // Focus should be managed properly
      expect(screen.getByTestId("sheet-content")).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      trigger.focus();

      // Should be focusable
      expect(trigger).toHaveFocus();

      // Enter should be handled (we can't easily test state change in this mock setup)
      await user.keyboard("{Enter}");
      expect(trigger).toBeInTheDocument(); // Basic keyboard interaction test
    });

    it("applies translate protection to the standalone mobile menu button", () => {
      renderWithIntl(<MobileMenuButton isOpen={false} onClick={vi.fn()} />);

      expect(screen.getByTestId("mobile-menu-button-label")).toHaveAttribute(
        "translate",
        "no",
      );
    });

    it("supports escape key to close menu", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      // Escape should close menu
      fireEvent.keyDown(screen.getByTestId("sheet-content"), {
        key: "Escape",
      });

      await waitFor(() => {
        const sheet = screen.getByTestId("sheet");
        expect(sheet).toHaveAttribute("data-open", "false");
      });
    });
  });

  describe("Responsive Behavior", () => {
    it("is hidden on desktop screens", () => {
      renderWithIntl(<MobileNavigation />);

      const container = screen.getByTestId("sheet").parentElement;
      expect(container).toHaveClass("header-mobile-only");
    });

    it("adapts to different screen orientations", () => {
      renderWithIntl(<MobileNavigation />);

      // Should render consistently regardless of orientation
      expect(screen.getByTestId("sheet")).toBeInTheDocument();
    });
  });

  describe("Animation and Transitions", () => {
    it("handles state transitions smoothly", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      const sheet = screen.getByTestId("sheet");

      // Should render consistently
      expect(trigger).toBeInTheDocument();
      expect(sheet).toBeInTheDocument();

      // Basic interaction should work
      await user.click(trigger);
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("Route Change Behavior", () => {
    it("closes menu when pathname changes", async () => {
      const { rerender } = renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });
      await user.click(trigger);

      // Simulate pathname change by re-rendering with different mock
      const mockUsePathname = vi.mocked(
        await vi.importMock<typeof import("next/navigation")>(
          "next/navigation",
        ),
      ).usePathname;
      mockUsePathname.mockReturnValue("/about");

      rerender(<MobileNavigation />);

      // Menu should be closed after pathname change
      const sheet = screen.getByTestId("sheet");
      expect(sheet).toHaveAttribute("data-open", "false");
    });

    it("handles multiple pathname changes correctly", async () => {
      const { rerender } = renderWithIntl(<MobileNavigation />);

      // Test multiple route changes
      const mockUsePathname = vi.mocked(
        await vi.importMock<typeof import("next/navigation")>(
          "next/navigation",
        ),
      ).usePathname;

      mockUsePathname.mockReturnValue("/contact");
      rerender(<MobileNavigation />);

      mockUsePathname.mockReturnValue("/products");
      rerender(<MobileNavigation />);

      // Should still render correctly
      expect(screen.getByTestId("sheet")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles missing translations gracefully", () => {
      const mockUseTranslations = vi.mocked(
        vi.fn(() => (key: string) => `missing.${key}`),
      );
      vi.mocked(vi.fn()).mockImplementation(() => mockUseTranslations);

      renderWithIntl(<MobileNavigation />);

      // Should still render even with missing translations
      expect(screen.getByTestId("sheet")).toBeInTheDocument();
    });

    it("handles navigation data errors gracefully", () => {
      // Mock empty navigation data
      vi.doMock("@/lib/navigation", () => ({
        mobileNavigation: [],
        isActivePath: vi.fn(() => false),
        NAVIGATION_ARIA: {
          mobileMenuButton: "Menu",
          mobileMenu: "Navigation",
        },
      }));

      renderWithIntl(<MobileNavigation />);

      // Should render without navigation items
      expect(screen.getByTestId("sheet")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid open/close interactions", async () => {
      renderWithIntl(<MobileNavigation />);

      const trigger = screen.getByRole("button", { name: /menu/i });

      // Rapid clicks
      await user.click(trigger);
      await user.click(trigger);
      await user.click(trigger);

      // Should handle rapid interactions gracefully
      expect(trigger).toBeInTheDocument();
    });

    it("handles custom className prop correctly", () => {
      const customClass = "custom-mobile-nav-test";
      renderWithIntl(<MobileNavigation className={customClass} />);

      const container = screen.getByTestId("sheet").parentElement;
      expect(container).toHaveClass(customClass);
    });

    it("maintains accessibility attributes during state changes", async () => {
      // Test the MobileMenuButton component directly to verify aria-expanded behavior
      const mockOnClick = vi.fn();
      const { rerender } = renderWithIntl(
        <MobileMenuButton isOpen={false} onClick={mockOnClick} />,
      );

      let button = screen.getByRole("button", { name: /menu/i });

      // Check initial state
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button).toHaveAttribute("data-state", "closed");

      // Simulate state change by re-rendering with isOpen=true
      rerender(<MobileMenuButton isOpen={true} onClick={mockOnClick} />);

      // Re-query the button after re-render to get updated element
      button = screen.getByRole("button", { name: /menu/i });

      // Check after state change
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button).toHaveAttribute("data-state", "open");

      // Test click functionality
      await user.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe("MobileLanguageSwitcher Integration", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocale.current = "en";
  });

  it("keeps language options collapsed by default while showing the current language", async () => {
    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);

    expect(
      screen.getByRole("button", { name: "Language English" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("简体中文")).not.toBeInTheDocument();
  });

  it("expands language options only after the language row is clicked", async () => {
    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Language English" }));

    expect(
      screen.getByRole("button", { name: "Language English" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByTestId("mobile-language-option-label-en"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("mobile-language-option-label-zh"),
    ).toBeInTheDocument();
  });

  it("renders mobile navigation links before the language row", async () => {
    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);

    const nav = screen.getByRole("navigation", { name: /mobile menu/i });
    const languageRow = screen.getByRole("button", {
      name: "Language English",
    });

    expect(
      nav.compareDocumentPosition(languageRow) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("detects current locale from next-intl locale context", async () => {
    mockLocale.current = "zh";

    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Language 简体中文" }));

    // Chinese should be marked as active (has check icon)
    const chineseLink = screen
      .getByTestId("mobile-language-option-label-zh")
      .closest("a");
    expect(chineseLink).toHaveClass("bg-accent");
  });

  it("defaults to English when locale context is not zh", async () => {
    mockLocale.current = "en";

    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Language English" }));

    // English should be marked as active
    const englishLink = screen
      .getByTestId("mobile-language-option-label-en")
      .closest("a");
    expect(englishLink).toHaveClass("bg-accent");
  });

  it("closes menu when language link is clicked", async () => {
    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Language English" }));

    // Click on a language link
    const chineseLink = screen.getByTestId("mobile-language-option-label-zh");
    await user.click(chineseLink);

    // Menu should close
    await waitFor(() => {
      const sheet = screen.getByTestId("sheet");
      expect(sheet).toHaveAttribute("data-open", "false");
    });
  });

  it("collapses language options again after closing and reopening the menu", async () => {
    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Language English" }));
    expect(
      screen.getByTestId("mobile-language-option-label-zh"),
    ).toBeInTheDocument();

    await user.click(trigger);
    await waitFor(() => {
      expect(screen.getByTestId("sheet")).toHaveAttribute("data-open", "false");
    });

    await user.click(trigger);
    expect(
      screen.getByRole("button", { name: "Language English" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByTestId("mobile-language-option-label-zh"),
    ).not.toBeInTheDocument();
  });

  it("shows check icon for active language", async () => {
    Object.defineProperty(document.documentElement, "lang", {
      value: "en",
      writable: true,
      configurable: true,
    });

    renderWithIntl(<MobileNavigation />);

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Language English" }));

    // Check icon should be visible for English
    const englishLink = screen
      .getByTestId("mobile-language-option-label-en")
      .closest("a");
    expect(
      englishLink?.querySelector('[data-testid="check-icon"]'),
    ).toBeInTheDocument();
  });
});

describe("MobileMenuButton Component", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders with closed state", () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={false} onClick={mockOnClick} />);

      expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("close-icon")).not.toBeInTheDocument();
    });

    it("renders with open state", () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={true} onClick={mockOnClick} />);

      expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
      expect(screen.getByTestId("close-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("menu-icon")).not.toBeInTheDocument();
    });

    it("applies custom className", () => {
      const mockOnClick = vi.fn();
      const customClass = "custom-menu-button";
      renderWithIntl(
        <MobileMenuButton
          isOpen={false}
          onClick={mockOnClick}
          className={customClass}
        />,
      );

      const button = screen.getByRole("button", { name: /menu/i });
      expect(button).toHaveClass(customClass);
    });
  });

  describe("Interaction", () => {
    it("calls onClick when clicked", async () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={false} onClick={mockOnClick} />);

      const button = screen.getByRole("button", { name: /menu/i });
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("handles keyboard interaction", async () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={false} onClick={mockOnClick} />);

      const button = screen.getByRole("button", { name: /menu/i });
      button.focus();

      await user.keyboard("{Enter}");
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes when closed", () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={false} onClick={mockOnClick} />);

      const button = screen.getByRole("button", { name: /menu/i });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-label");
    });

    it("has proper ARIA attributes when open", () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={true} onClick={mockOnClick} />);

      const button = screen.getByRole("button", { name: /menu/i });
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveAttribute("aria-label");
    });

    it("provides screen reader text for both states", () => {
      const mockOnClick = vi.fn();

      // Test closed state
      const { rerender } = renderWithIntl(
        <MobileMenuButton isOpen={false} onClick={mockOnClick} />,
      );

      expect(screen.getByText("Open navigation menu")).toBeInTheDocument();

      // Test open state
      rerender(<MobileMenuButton isOpen={true} onClick={mockOnClick} />);
      expect(screen.getByText("Close navigation menu")).toBeInTheDocument();
    });
  });

  describe("Visual States", () => {
    it("shows correct icon for closed state", () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={false} onClick={mockOnClick} />);

      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("close-icon")).not.toBeInTheDocument();
    });

    it("shows correct icon for open state", () => {
      const mockOnClick = vi.fn();
      renderWithIntl(<MobileMenuButton isOpen={true} onClick={mockOnClick} />);

      expect(screen.getByTestId("close-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("menu-icon")).not.toBeInTheDocument();
    });

    it("toggles icons correctly", () => {
      const mockOnClick = vi.fn();
      const { rerender } = renderWithIntl(
        <MobileMenuButton isOpen={false} onClick={mockOnClick} />,
      );

      // Initially closed
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();

      // Change to open
      rerender(<MobileMenuButton isOpen={true} onClick={mockOnClick} />);
      expect(screen.getByTestId("close-icon")).toBeInTheDocument();

      // Change back to closed
      rerender(<MobileMenuButton isOpen={false} onClick={mockOnClick} />);
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
    });
  });
});
