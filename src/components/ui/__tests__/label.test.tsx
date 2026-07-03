import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Label } from "@/components/ui/label";

describe("Label", () => {
  it("renders as a label with the default slot and classes", () => {
    render(<Label>Label Text</Label>);

    const label = screen.getByText("Label Text");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("data-slot", "label");
    expect(label).toHaveClass(
      "flex",
      "items-center",
      "gap-2",
      "text-sm",
      "font-medium",
      "select-none",
    );
  });

  it("renders rich content without stripping nested elements", () => {
    render(
      <Label data-testid="label">
        <svg data-testid="icon" aria-hidden="true" />
        <strong>Required</strong>
        <span>*</span>
      </Label>,
    );

    const label = screen.getByTestId("label");
    expect(label).toContainElement(screen.getByTestId("icon"));
    expect(label).toContainElement(screen.getByText("Required"));
    expect(label).toContainElement(screen.getByText("*"));
  });

  it("merges custom classes and forwards label attributes", () => {
    render(
      <Label
        htmlFor="email"
        id="email-label"
        className="custom-label"
        data-testid="label"
      >
        Email
      </Label>,
    );

    const label = screen.getByTestId("label");
    expect(label).toHaveAttribute("for", "email");
    expect(label).toHaveAttribute("id", "email-label");
    expect(label).toHaveClass("custom-label", "flex");
  });

  it("supports caller event handlers", () => {
    const handleClick = vi.fn();
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();

    render(
      <Label
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Interactive Label
      </Label>,
    );

    const label = screen.getByText("Interactive Label");
    fireEvent.click(label);
    fireEvent.mouseEnter(label);
    fireEvent.mouseLeave(label);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it("keeps disabled-state utility classes available for group and peer use", () => {
    render(
      <div>
        <input disabled className="peer" />
        <Label>Disabled Label</Label>
      </div>,
    );

    expect(screen.getByText("Disabled Label")).toHaveClass(
      "group-data-[disabled=true]:pointer-events-none",
      "group-data-[disabled=true]:opacity-50",
      "peer-disabled:cursor-not-allowed",
      "peer-disabled:opacity-50",
    );
  });
});
