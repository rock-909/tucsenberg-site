/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridSystem } from "@/components/grid/grid-system";

describe("GridSystem", () => {
  it("renders children", () => {
    render(
      <GridSystem>
        <div data-testid="child">Content</div>
      </GridSystem>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders outer frame with guide color border", () => {
    const { container } = render(
      <GridSystem>
        <div>Content</div>
      </GridSystem>,
    );

    const frame = container.querySelector("[aria-hidden='true']");
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveClass("border", "border-[var(--grid-guide)]");
  });

  it("renders crosshairs when provided", () => {
    const { container } = render(
      <GridSystem
        crosshairs={[
          { top: 0, left: 0 },
          { bottom: 0, right: 0 },
        ]}
      >
        <div>Content</div>
      </GridSystem>,
    );

    // Two crosshair wrappers (hidden lg:block)
    const crosshairWrappers = container.querySelectorAll(".hidden.lg\\:block");
    // Frame + 2 crosshair wrappers = 3 elements with hidden lg:block
    expect(crosshairWrappers.length).toBeGreaterThanOrEqual(2);
  });

  it("applies custom className", () => {
    const { container } = render(
      <GridSystem className="custom-class">
        <div>Content</div>
      </GridSystem>,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("uses max-w-[1080px] container", () => {
    const { container } = render(
      <GridSystem>
        <div>Content</div>
      </GridSystem>,
    );

    expect(container.firstChild).toHaveClass(
      "max-w-[1080px]",
      "mx-auto",
      "px-6",
    );
  });
});
