import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input accessibility", () => {
  it("supports accessible names and descriptions from caller props", () => {
    render(
      <div>
        <label htmlFor="search">Search</label>
        <Input id="search" aria-describedby="search-help" />
        <p id="search-help">Type a search term</p>
      </div>,
    );

    const input = screen.getByLabelText("Search");
    expect(input).toHaveAttribute("aria-describedby", "search-help");
  });

  it("exposes required and invalid states inside the Radix form-control surface", () => {
    render(
      <Input
        aria-label="Email"
        aria-required="true"
        aria-invalid="true"
        data-testid="input"
      />,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(
      input.closest("[data-ui-pilot='radix-themes-form-control']"),
    ).toBeInTheDocument();
    expect(
      input
        .closest("[data-ui-pilot='radix-themes-form-control']")
        ?.querySelector("[data-testid='input']"),
    ).toBeInTheDocument();
    expect(input).toHaveAttribute("data-slot", "input");
  });
});
