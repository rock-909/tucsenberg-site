import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContactRouteError from "../error";

// Mock logger using vi.hoisted
const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: mockLoggerError,
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock next-intl - component uses useTranslations('errors.contact')
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: "联系表单暂时不可用",
      description:
        "抱歉，联系表单目前无法使用。我们的团队会立即查看问题，请稍后再试。",
      tryAgain: "重试",
      goHome: "返回首页",
    };
    return translations[key] ?? key;
  },
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    asChild,
    type,
  }: React.PropsWithChildren<{
    onClick?: () => void;
    variant?: string;
    asChild?: boolean;
    type?: string;
  }>) => {
    if (asChild) {
      // When asChild is true, render children directly (for Link wrapper)
      return <>{children}</>;
    }
    return (
      <button
        data-testid={variant === "outline" ? "go-home-button" : "retry-button"}
        onClick={onClick}
        type={type as "button" | "submit" | "reset" | undefined}
      >
        {children}
      </button>
    );
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} data-testid="home-link">
      {children}
    </a>
  ),
}));

// Mock i18n routing Link component (used by the actual component)
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} data-testid="home-link">
      {children}
    </a>
  ),
}));

describe("ContactRouteError", () => {
  const mockReset = vi.fn();
  const mockError = new Error("Contact form submission failed");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should render error page structure", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      expect(screen.getByText("联系表单暂时不可用")).toBeInTheDocument();
    });

    it("should render error description text", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      expect(screen.getByText(/我们的团队会立即查看问题/)).toBeInTheDocument();
    });

    it("should render retry button", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      expect(screen.getByText("重试")).toBeInTheDocument();
    });

    it("should render return home link", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      expect(screen.getByText("返回首页")).toBeInTheDocument();
    });

    it("should have correct home link href", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      const homeLink = screen.getByTestId("home-link");
      expect(homeLink).toHaveAttribute("href", "/");
    });
  });

  describe("error logging", () => {
    it("should log error on mount", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      expect(mockLoggerError).toHaveBeenCalledWith(
        "Contact route error",
        mockError,
      );
    });

    it("should log error only once on initial mount", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      expect(mockLoggerError).toHaveBeenCalledTimes(1);
    });

    it("should log new error when error prop changes", () => {
      const { rerender } = render(
        <ContactRouteError error={mockError} reset={mockReset} />,
      );

      const newError = new Error("New contact error");
      rerender(<ContactRouteError error={newError} reset={mockReset} />);

      expect(mockLoggerError).toHaveBeenCalledTimes(2);
      expect(mockLoggerError).toHaveBeenLastCalledWith(
        "Contact route error",
        newError,
      );
    });
  });

  describe("button interactions", () => {
    it("should call reset when retry button is clicked", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      fireEvent.click(screen.getByTestId("retry-button"));

      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("should have correct button type attribute", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      const retryButton = screen.getByTestId("retry-button");
      expect(retryButton).toHaveAttribute("type", "button");
    });
  });

  describe("error with digest", () => {
    it("should handle error with digest property", () => {
      const errorWithDigest = Object.assign(new Error("Digest error"), {
        digest: "contact-error-digest-123",
      });

      render(<ContactRouteError error={errorWithDigest} reset={mockReset} />);

      expect(mockLoggerError).toHaveBeenCalledWith(
        "Contact route error",
        errorWithDigest,
      );
    });
  });

  describe("styling", () => {
    it("should have centered layout container", () => {
      const { container } = render(
        <ContactRouteError error={mockError} reset={mockReset} />,
      );

      const mainContainer = container.querySelector(".flex.min-h-\\[60vh\\]");
      expect(mainContainer).toBeInTheDocument();
    });

    it("should have flex column layout", () => {
      const { container } = render(
        <ContactRouteError error={mockError} reset={mockReset} />,
      );

      const mainContainer = container.querySelector(".flex-col");
      expect(mainContainer).toBeInTheDocument();
    });

    it("should have items-center for centering", () => {
      const { container } = render(
        <ContactRouteError error={mockError} reset={mockReset} />,
      );

      const mainContainer = container.querySelector(".items-center");
      expect(mainContainer).toBeInTheDocument();
    });

    it("should have max-width container for content", () => {
      const { container } = render(
        <ContactRouteError error={mockError} reset={mockReset} />,
      );

      const contentContainer = container.querySelector(".max-w-lg");
      expect(contentContainer).toBeInTheDocument();
    });

    it("should have button group with gap", () => {
      const { container } = render(
        <ContactRouteError error={mockError} reset={mockReset} />,
      );

      const buttonGroup = container.querySelector(".gap-3");
      expect(buttonGroup).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading structure", () => {
      render(<ContactRouteError error={mockError} reset={mockReset} />);

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("联系表单暂时不可用");
    });

    it("should have descriptive paragraph", () => {
      const { container } = render(
        <ContactRouteError error={mockError} reset={mockReset} />,
      );

      const paragraph = container.querySelector("p");
      expect(paragraph).toBeInTheDocument();
    });
  });
});
