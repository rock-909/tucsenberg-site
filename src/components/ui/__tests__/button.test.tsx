import React from "react";
import Link from "next/link";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: React.ReactNode;
    href?: string;
    [key: string]: any;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Radix UI Slot component
vi.mock("@radix-ui/react-slot", () => ({
  Slot: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: any;
  }) => {
    // 如果children是React元素，克隆并添加props
    if (React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ...(children.props || {}),
      });
    }
    // 否则返回一个div包装
    return <div {...props}>{children}</div>;
  },
}));

describe("Button Component", () => {
  describe("Basic Rendering", () => {
    it("renders button with default props", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Click me");
      expect(button).toHaveAttribute("data-slot", "button");
    });

    it("renders button with custom text", () => {
      render(<Button>Custom Text</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Custom Text");
    });

    it("applies default variant and size classes", () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-[var(--button-primary-bg)]",
        "text-[var(--button-primary-fg)]",
      );
      expect(button).toHaveClass(
        "h-[var(--button-height-default)]",
        "px-5",
        "py-2.5",
      );
      expect(button).toHaveClass("rounded-[var(--button-radius)]");
    });
  });

  describe("Variant Props", () => {
    it("applies default variant styles", () => {
      render(<Button variant="default">Default</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-[var(--button-primary-bg)]",
        "text-[var(--button-primary-fg)]",
      );
    });

    it("applies destructive variant styles", () => {
      render(<Button variant="destructive">Destructive</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-destructive",
        "text-destructive-foreground",
      );
    });

    it("applies outline variant styles", () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-transparent",
        "border-2",
        "border-[var(--button-outline-border)]",
      );
    });

    it("applies secondary variant styles", () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-secondary",
        "text-secondary-foreground",
        "border",
        "border-border",
      );
    });

    it("applies ghost variant styles", () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent", "hover:text-foreground");
    });

    it("applies link variant styles", () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "text-[var(--button-outline-fg)]",
        "underline-offset-4",
      );
    });
  });

  describe("Size Props", () => {
    it("applies default size styles", () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "h-[var(--button-height-default)]",
        "px-5",
        "py-2.5",
      );
    });

    it("applies small size styles", () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-[var(--button-height-sm)]", "px-3");
    });

    it("applies large size styles", () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-[var(--button-height-lg)]", "px-6");
    });

    it("applies icon size styles", () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-9");
    });
  });

  describe("Custom Props", () => {
    it("applies custom className", () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    it("passes through HTML button props", () => {
      render(
        <Button
          type="submit"
          disabled
          aria-label="Send message"
          data-testid="submit-button"
        >
          Send message
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-label", "Send message");
      expect(button).toHaveAttribute("data-testid", "submit-button");
    });

    it("applies disabled styles when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:pointer-events-none",
        "disabled:opacity-50",
      );
    });
  });

  describe("Event Handling", () => {
    it("handles click events", () => {
      const activateButtonFixture = vi.fn();
      render(<Button onClick={activateButtonFixture}>Click me</Button>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(activateButtonFixture).toHaveBeenCalledTimes(1);
    });

    it("does not trigger click when disabled", () => {
      const attemptDisabledButtonActivation = vi.fn();
      render(
        <Button onClick={attemptDisabledButtonActivation} disabled>
          Disabled
        </Button>,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(attemptDisabledButtonActivation).not.toHaveBeenCalled();
    });

    it("handles keyboard events", () => {
      const handleKeyDown = vi.fn();
      render(<Button onKeyDown={handleKeyDown}>Keyboard</Button>);

      const button = screen.getByRole("button");
      fireEvent.keyDown(button, { key: "Enter" });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("AsChild Prop", () => {
    it("renders as Slot when asChild is true", () => {
      render(
        <Button asChild>
          <Link href="/test">Link Button</Link>
        </Button>,
      );

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent("Link Button");
      expect(link).toHaveAttribute("href", "/test");
      expect(link).toHaveAttribute("data-slot", "button");
    });

    it("renders as button when asChild is false", () => {
      render(<Button asChild={false}>Regular Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Regular Button");
    });
  });

  describe("Accessibility", () => {
    it("has proper focus styles", () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
        "focus-visible:ring-offset-2",
      );
    });

    it("supports aria attributes", () => {
      render(
        <Button aria-label="Close dialog" aria-pressed="false" role="button">
          ×
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Close dialog");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("handles aria-invalid state", () => {
      render(<Button aria-invalid="true">Invalid</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("Combination Props", () => {
    it("combines variant and size props correctly", () => {
      render(
        <Button variant="outline" size="lg">
          Large Outline
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-transparent",
        "border-2",
        "border-[var(--button-outline-border)]",
      ); // outline variant
      expect(button).toHaveClass("h-[var(--button-height-lg)]", "px-6"); // lg size
    });

    it("combines all props with custom className", () => {
      render(
        <Button
          variant="secondary"
          size="sm"
          className="custom-spacing"
          disabled
        >
          Complex Button
        </Button>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary"); // secondary variant
      expect(button).toHaveClass("h-[var(--button-height-sm)]"); // sm size
      expect(button).toHaveClass("custom-spacing"); // custom class
      expect(button).toBeDisabled(); // disabled state
    });
  });

  describe("Icon Support", () => {
    it("handles SVG icons correctly", () => {
      render(
        <Button>
          <svg data-testid="icon" width="16" height="16">
            <circle cx="8" cy="8" r="4" />
          </svg>
          With Icon
        </Button>,
      );

      const button = screen.getByRole("button");
      const icon = screen.getByTestId("icon");

      expect(button).toContainElement(icon);
      expect(button).toHaveClass("[&_svg]:pointer-events-none");
    });
  });
});
