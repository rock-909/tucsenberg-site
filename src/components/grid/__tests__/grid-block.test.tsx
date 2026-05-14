/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GridBlock } from "@/components/grid/grid-block";

describe("GridBlock", () => {
  it("renders children", () => {
    render(
      <GridBlock span={[1, 3, 1, 2]}>
        <div data-testid="child">Content</div>
      </GridBlock>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies correct grid placement from span", () => {
    const { container } = render(
      <GridBlock span={[1, 6, 1, 4]}>
        <div>Content</div>
      </GridBlock>,
    );

    const block = container.firstChild as HTMLElement;
    // span [1,6,1,4] → gridColumn: "1 / 7", gridRow: "1 / 5"
    expect(block.style.gridColumn).toBe("1 / 7");
    expect(block.style.gridRow).toBe("1 / 5");
  });

  it("has z-index 2 to sit above guides", () => {
    const { container } = render(
      <GridBlock span={[1, 1, 1, 1]}>
        <div>Content</div>
      </GridBlock>,
    );

    expect(container.firstChild).toHaveClass("z-[2]");
  });

  it("has 1px right and bottom margin for guide peek-through", () => {
    const { container } = render(
      <GridBlock span={[1, 1, 1, 1]}>
        <div>Content</div>
      </GridBlock>,
    );

    expect(container.firstChild).toHaveClass("mr-px", "mb-px");
  });

  it("applies custom className", () => {
    const { container } = render(
      <GridBlock span={[1, 1, 1, 1]} className="custom-block">
        <div>Content</div>
      </GridBlock>,
    );

    expect(container.firstChild).toHaveClass("custom-block");
  });
});
