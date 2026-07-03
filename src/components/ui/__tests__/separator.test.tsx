import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "@/components/ui/separator";

describe("Separator Component", () => {
  describe("Basic Rendering", () => {
    it("renders separator with default props", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toBeInTheDocument();
      expect(separator.tagName).toBe("DIV");
    });

    it("applies default horizontal orientation", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px]", "w-full");
    });

    it("applies default base classes", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("bg-border", "shrink-0");
    });
  });

  describe("Orientation Props", () => {
    it("renders horizontal separator correctly", () => {
      render(<Separator orientation="horizontal" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px]", "w-full");
      expect(separator).not.toHaveClass("h-full", "w-[1px]");
    });

    it("renders vertical separator correctly", () => {
      render(<Separator orientation="vertical" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-full", "w-[1px]");
      expect(separator).not.toHaveClass("h-[1px]", "w-full");
    });

    it("handles undefined orientation as horizontal", () => {
      // 不传递该可选属性，以满足 exactOptionalPropertyTypes
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px]", "w-full");
    });
  });

  describe("Custom Props", () => {
    it("applies custom className", () => {
      render(
        <Separator className="custom-separator" data-testid="separator" />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("custom-separator");
      expect(separator).toHaveClass("bg-border", "shrink-0"); // Still has base classes
    });

    it("merges custom className with orientation classes", () => {
      render(
        <Separator
          orientation="vertical"
          className="border-red-500"
          data-testid="separator"
        />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("border-red-500", "h-full", "w-[1px]");
    });

    it("passes through HTML div props", () => {
      render(
        <Separator
          id="test-separator"
          role="separator"
          aria-orientation="horizontal"
          data-testid="separator"
        />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("id", "test-separator");
      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    });

    it("handles style prop", () => {
      render(
        <Separator
          style={{ backgroundColor: "red", margin: "10px" }}
          data-testid="separator"
        />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("style");
      expect(separator.style.backgroundColor).toBe("red");
      expect(separator.style.margin).toBe("10px");
    });
  });

  describe("Ref Handling", () => {
    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<Separator ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("handles function ref correctly", () => {
      let refElement: HTMLDivElement | null = null;
      const refCallback = (element: HTMLDivElement | null) => {
        refElement = element;
      };

      render(<Separator ref={refCallback} />);

      expect(refElement).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("Accessibility", () => {
    it("supports ARIA attributes", () => {
      render(
        <Separator
          role="separator"
          aria-orientation="vertical"
          aria-label="Content divider"
          data-testid="separator"
        />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveAttribute("aria-label", "Content divider");
    });

    it("works with semantic HTML structure", () => {
      render(
        <div>
          <section>Content 1</section>
          <Separator role="separator" data-testid="separator" />
          <section>Content 2</section>
        </div>,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("role", "separator");
    });
  });

  describe("Layout Integration", () => {
    it("works in flex container horizontally", () => {
      render(
        <div className="flex flex-col">
          <div>Item 1</div>
          <Separator data-testid="separator" />
          <div>Item 2</div>
        </div>,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px]", "w-full");
    });

    it("works in flex container vertically", () => {
      render(
        <div className="flex flex-row">
          <div>Item 1</div>
          <Separator orientation="vertical" data-testid="separator" />
          <div>Item 2</div>
        </div>,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-full", "w-[1px]");
    });

    it("maintains shrink-0 class for layout stability", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("shrink-0");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty className gracefully", () => {
      render(<Separator className="" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass(
        "bg-border",
        "shrink-0",
        "h-[1px]",
        "w-full",
      );
    });

    it("handles null className gracefully", () => {
      render(<Separator className={null as any} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toBeInTheDocument();
    });

    it("handles multiple custom classes", () => {
      render(
        <Separator
          className="my-4 border-2 border-dashed border-gray-300"
          data-testid="separator"
        />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass(
        "border-2",
        "border-dashed",
        "border-gray-300",
        "my-4",
        "bg-border",
        "shrink-0",
      );
    });
  });

  describe("Component Display Name", () => {
    it("has correct display name", () => {
      expect(Separator.displayName).toBe("Separator");
    });
  });

  describe("TypeScript Props", () => {
    it("accepts all valid orientation values", () => {
      // These should not cause TypeScript errors
      render(<Separator orientation="horizontal" />);
      render(<Separator orientation="vertical" />);
    });

    it("extends HTMLDivElement props", () => {
      // Should accept all standard div props
      render(
        <Separator
          onClick={() => {}}
          onMouseEnter={() => {}}
          tabIndex={0}
          title="Separator"
        />,
      );
    });
  });
});
