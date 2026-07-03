/**
 * @vitest-environment jsdom
 * Tests for header client components (Island components)
 */
import { readFileSync } from "node:fs";
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageToggleIsland, MobileNavigationIsland } from "../header-client";

const mockUsePathname = vi.fn(() => "/en");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    locale,
    ...props
  }: {
    children: React.ReactNode;
    href: string | { pathname: string; query?: Record<string, string> };
    locale?: string;
  }) => {
    const path = typeof href === "string" ? href : href.pathname;
    const query =
      typeof href === "string" || !href.query
        ? ""
        : `?${new URLSearchParams(href.query).toString()}`;
    const localizedPath =
      locale && path === "/"
        ? `/${locale}`
        : `${locale ? `/${locale}` : ""}${path}`;

    return (
      <a href={`${localizedPath}${query}`} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/components/layout/mobile-navigation-interactive", () => ({
  MobileNavigationInteractive: ({
    children,
    closeMenuLabel,
    initialOpen,
    languageLabel,
    openMenuLabel,
  }: {
    children?: React.ReactNode;
    closeMenuLabel?: string;
    initialOpen?: boolean;
    languageLabel?: string;
    openMenuLabel?: string;
  }) => (
    <div
      data-testid="mobile-navigation-interactive"
      data-close-menu-label={closeMenuLabel}
      data-initial-open={String(initialOpen ?? false)}
      data-language-label={languageLabel}
      data-open-menu-label={openMenuLabel}
    >
      {children}
    </div>
  ),
}));

// Mock the deferred header language menu.
vi.mock("@/components/layout/header-language-menu", () => ({
  HeaderLanguageMenu: ({
    initialOpen,
    locale,
  }: {
    initialOpen?: boolean;
    locale: string;
  }) => (
    <div
      data-testid="header-language-menu"
      data-initial-open={String(initialOpen ?? false)}
      data-locale={locale}
    >
      Language Toggle
    </div>
  ),
}));

describe("header client entry", () => {
  it("keeps always-present header islands free of next/dynamic runtime", () => {
    const source = readFileSync("src/components/layout/header-client.tsx", {
      encoding: "utf8",
    });

    expect(source).not.toContain("next/dynamic");
  });

  it("keeps mobile fallback markup in a non-boundary helper module", () => {
    const headerClientSource = readFileSync(
      "src/components/layout/header-client.tsx",
      {
        encoding: "utf8",
      },
    );
    const fallbackSource = readFileSync(
      "src/components/layout/header-mobile-navigation-fallback.tsx",
      {
        encoding: "utf8",
      },
    );

    expect(headerClientSource).toContain(
      "@/components/layout/header-mobile-navigation-fallback",
    );
    expect(fallbackSource).toContain("function MobileNavigationFallback");
    expect(fallbackSource).not.toMatch(/^["']use client["'];?$/m);
  });
});

describe("MobileNavigationIsland", () => {
  it("renders deferred trigger before loading dynamic component", () => {
    render(<MobileNavigationIsland />);

    const trigger = screen.getByTestId("header-mobile-menu-button");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-controls", "mobile-navigation");
    expect(
      screen.getByTestId("header-mobile-navigation-fallback"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("mobile-navigation-interactive"),
    ).not.toBeInTheDocument();
  });

  it("server-renders mobile navigation fallback without loading interactive navigation", () => {
    const html = renderToStaticMarkup(
      <MobileNavigationIsland languageLabel="Language">
        <nav data-testid="header-mobile-navigation-fallback-links">
          Fallback navigation
        </nav>
      </MobileNavigationIsland>,
    );

    expect(html).toContain('data-testid="header-mobile-menu-button"');
    expect(html).toContain(
      'data-testid="header-mobile-navigation-fallback-links"',
    );
    expect(html).toContain('data-testid="mobile-language-fallback"');
    expect(html).toContain("English");
    expect(html).toContain("简体中文");
    expect(html).toContain("/en");
    expect(html).toContain("/zh");
    expect(html).not.toContain("mobile-navigation-interactive");
  });

  it("passes localized labels to the hydrated mobile navigation", async () => {
    render(
      <MobileNavigationIsland
        openMenuLabel="打开导航菜单"
        closeMenuLabel="关闭导航菜单"
        languageLabel="选择语言"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("header-mobile-menu-button"));
      await vi.dynamicImportSettled();
    });

    const interactive = screen.getByTestId("mobile-navigation-interactive");
    expect(interactive).toHaveAttribute("data-open-menu-label", "打开导航菜单");
    expect(interactive).toHaveAttribute(
      "data-close-menu-label",
      "关闭导航菜单",
    );
    expect(interactive).toHaveAttribute("data-language-label", "选择语言");
  });

  it("loads interactive component after trigger click", async () => {
    render(<MobileNavigationIsland />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("header-mobile-menu-button"));
      await vi.dynamicImportSettled();
    });

    const interactive = screen.getByTestId("mobile-navigation-interactive");
    expect(interactive).toHaveAttribute("data-initial-open", "true");
    expect(
      screen.queryByTestId("header-mobile-navigation-fallback"),
    ).not.toBeInTheDocument();
  });

  it("marks the deferred menu label as notranslate", () => {
    render(<MobileNavigationIsland openMenuLabel="Open navigation menu" />);

    expect(screen.getByTestId("header-mobile-menu-label")).toHaveAttribute(
      "translate",
      "no",
    );
  });
});

vi.mock("@/components/ui/theme-switcher-highlight", () => ({
  ThemeSwitcherHighlight: () => <div data-testid="theme-switcher-highlight" />,
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
    systemTheme: "light",
  }),
}));

beforeEach(() => {
  mockUsePathname.mockReturnValue("/en");
});

describe("LanguageToggleIsland", () => {
  it("renders the fallback trigger before user intent", async () => {
    render(<LanguageToggleIsland locale="en" />);

    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("language-toggle-button")).toHaveAttribute(
      "data-locale",
      "en",
    );
    expect(
      screen.queryByTestId("header-language-menu"),
    ).not.toBeInTheDocument();
  });

  it("loads and opens the deferred language menu after trigger click", async () => {
    render(<LanguageToggleIsland locale="zh" />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("language-toggle-button"));
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("header-language-menu")).toHaveAttribute(
      "data-locale",
      "zh",
    );
    expect(screen.getByTestId("header-language-menu")).toHaveAttribute(
      "data-initial-open",
      "true",
    );
  });

  it("does not open the deferred language menu if navigation wins the lazy-load race", async () => {
    const { rerender } = render(<LanguageToggleIsland locale="en" />);

    fireEvent.click(screen.getByTestId("language-toggle-button"));
    mockUsePathname.mockReturnValue("/en/about");
    rerender(<LanguageToggleIsland locale="en" />);

    await act(async () => {
      await vi.dynamicImportSettled();
    });

    expect(screen.getByTestId("header-language-menu")).toHaveAttribute(
      "data-initial-open",
      "false",
    );
  });

  it("does not wrap in extra i18n provider", () => {
    render(<LanguageToggleIsland locale="en" />);

    // Should not have extra i18n-provider wrapper
    expect(screen.queryByTestId("i18n-provider")).not.toBeInTheDocument();
  });
});

describe("Island components integration", () => {
  it("all islands can render together", async () => {
    const { container } = render(
      <>
        <MobileNavigationIsland />
        <LanguageToggleIsland locale="en" />
      </>,
    );

    expect(screen.getByTestId("header-mobile-menu-button")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("language-toggle-button"));
      await vi.dynamicImportSettled();
    });

    const dynamicComponents = container.querySelectorAll(
      '[data-testid="mobile-navigation-interactive"], [data-testid="header-language-menu"]',
    );
    expect(dynamicComponents.length).toBe(1);
    expect(screen.getByTestId("header-language-menu")).toBeInTheDocument();
  });

  it("all islands accept zh locale", () => {
    render(
      <>
        <MobileNavigationIsland />
        <LanguageToggleIsland locale="zh" />
      </>,
    );
  });
});
