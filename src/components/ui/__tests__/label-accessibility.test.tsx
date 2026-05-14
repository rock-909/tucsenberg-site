import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "@/components/ui/label";

describe("Label accessibility", () => {
  it("associates with inputs through htmlFor", () => {
    render(
      <div>
        <Label htmlFor="email">Email address</Label>
        <input id="email" type="email" />
      </div>,
    );

    const input = screen.getByLabelText("Email address");
    expect(input).toHaveAttribute("id", "email");
  });

  it("supports implicit input association", () => {
    render(
      <Label>
        Search
        <input type="search" />
      </Label>,
    );

    expect(screen.getByLabelText("Search")).toHaveAttribute("type", "search");
  });

  it("forwards ARIA attributes for complex form states", () => {
    render(
      <Label
        htmlFor="required-input"
        aria-required="true"
        aria-invalid="true"
        aria-describedby="field-help"
      >
        Required Field
      </Label>,
    );

    const label = screen.getByText("Required Field");
    expect(label).toHaveAttribute("aria-required", "true");
    expect(label).toHaveAttribute("aria-invalid", "true");
    expect(label).toHaveAttribute("aria-describedby", "field-help");
  });

  it("can carry screen-reader-only text supplied by callers", () => {
    render(
      <Label data-testid="label">
        Visible text
        <span className="sr-only">Screen reader only text</span>
      </Label>,
    );

    expect(screen.getByTestId("label")).toHaveTextContent(
      "Visible textScreen reader only text",
    );
  });
});
