/**
 * @vitest-environment jsdom
 * Tests for Logo, LogoCompact, and LogoLarge components
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SITE_CONFIG } from "@/config/paths/site-config";
import { Logo, LogoCompact, LogoLarge } from "../logo";

// Mock @/i18n/routing Link (locale-aware navigation)
vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      data-testid="logo-link"
    >
      {children}
    </a>
  ),
}));

describe("Logo", () => {
  describe("basic rendering", () => {
    it("renders link to homepage", () => {
      render(<Logo />);

      const link = screen.getByTestId("logo-link");
      expect(link).toHaveAttribute("href", "/");
    });

    it("does not render an image while logo assets are pending", () => {
      render(<Logo />);

      expect(
        screen.queryByRole("img", { name: `${SITE_CONFIG.name} Logo` }),
      ).not.toBeInTheDocument();
    });

    it("renders text fallback by default", () => {
      render(<Logo />);

      expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
    });

    it("has default aria-label", () => {
      render(<Logo />);

      const link = screen.getByTestId("logo-link");
      expect(link).toHaveAttribute("aria-label", SITE_CONFIG.name);
    });
  });

  describe("showText prop", () => {
    it("still shows text fallback when showText is false and logo is pending", () => {
      render(<Logo showText={false} />);

      expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
    });

    it("shows text when showText is true", () => {
      render(<Logo showText={true} />);

      expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
    });
  });

  describe("size prop", () => {
    it("applies sm text size class", () => {
      render(<Logo size="sm" />);

      const text = screen.getByText(SITE_CONFIG.name);
      expect(text).toHaveClass("text-lg");
    });

    it("applies md text size class (default)", () => {
      render(<Logo size="md" />);

      const text = screen.getByText(SITE_CONFIG.name);
      expect(text).toHaveClass("text-xl");
    });

    it("applies lg text size class", () => {
      render(<Logo size="lg" />);

      const text = screen.getByText(SITE_CONFIG.name);
      expect(text).toHaveClass("text-2xl");
    });
  });

  describe("custom className", () => {
    it("applies custom className to link", () => {
      render(<Logo className="custom-logo-class" />);

      const link = screen.getByTestId("logo-link");
      expect(link).toHaveClass("custom-logo-class");
    });

    it("preserves default flex classes with custom className", () => {
      render(<Logo className="my-custom" />);

      const link = screen.getByTestId("logo-link");
      expect(link).toHaveClass("flex");
      expect(link).toHaveClass("items-center");
      expect(link).toHaveClass("my-custom");
    });
  });

  describe("custom ariaLabel", () => {
    it("applies custom aria-label", () => {
      render(<Logo ariaLabel="Custom Brand" />);

      const link = screen.getByTestId("logo-link");
      expect(link).toHaveAttribute("aria-label", "Custom Brand");
    });
  });

  describe("text styling", () => {
    it("text has font-bold class", () => {
      render(<Logo />);

      const text = screen.getByText(SITE_CONFIG.name);
      expect(text).toHaveClass("font-bold");
    });

    it("text has text-foreground class", () => {
      render(<Logo />);

      const text = screen.getByText(SITE_CONFIG.name);
      expect(text).toHaveClass("text-foreground");
    });

    it("text fallback stays visible when logo asset is pending", () => {
      render(<Logo />);

      const text = screen.getByText(SITE_CONFIG.name);
      expect(text).not.toHaveClass("header-logo-text-desktop-only");
    });
  });

  describe("link styling", () => {
    it("link has hover opacity transition", () => {
      render(<Logo />);

      const link = screen.getByTestId("logo-link");
      expect(link).toHaveClass("hover:opacity-80");
    });

    it("link has gap between image and text", () => {
      render(<Logo />);

      const link = screen.getByTestId("logo-link");
      expect(link).toHaveClass("gap-2");
    });
  });
});

describe("LogoCompact", () => {
  it("renders text fallback while logo assets are pending", () => {
    render(<LogoCompact />);

    expect(
      screen.queryByRole("img", { name: `${SITE_CONFIG.name} Logo` }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
  });

  it("uses sm text size", () => {
    render(<LogoCompact />);

    const text = screen.getByText(SITE_CONFIG.name);
    expect(text).toHaveClass("text-lg");
  });

  it("accepts custom className", () => {
    render(<LogoCompact className="compact-custom" />);

    const link = screen.getByTestId("logo-link");
    expect(link).toHaveClass("compact-custom");
  });
});

describe("LogoLarge", () => {
  it("renders text fallback while logo assets are pending", () => {
    render(<LogoLarge />);

    expect(
      screen.queryByRole("img", { name: `${SITE_CONFIG.name} Logo` }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(SITE_CONFIG.name)).toBeInTheDocument();
  });

  it("uses lg text size", () => {
    render(<LogoLarge />);

    const text = screen.getByText(SITE_CONFIG.name);
    expect(text).toHaveClass("text-2xl");
  });

  it("accepts custom className", () => {
    render(<LogoLarge className="large-custom" />);

    const link = screen.getByTestId("logo-link");
    expect(link).toHaveClass("large-custom");
  });
});
