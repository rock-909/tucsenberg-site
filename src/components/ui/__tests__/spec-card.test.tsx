import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpecCard, SpecCardRow } from "@/components/ui/spec-card";

describe("SpecCard", () => {
  it("renders specification rows with public slots", () => {
    render(
      <SpecCard title="Specifications" data-testid="spec-card">
        <SpecCardRow label="Material" value="Stainless Steel 304" />
        <SpecCardRow label="Weight" value="5.2 kg" />
      </SpecCard>,
    );

    const card = screen.getByTestId("spec-card");
    expect(card).toHaveAttribute("data-slot", "spec-card");
    expect(card).toHaveAttribute("data-ui-pilot", "radix-themes-data-card");
    expect(screen.getByText("Specifications")).toHaveAttribute(
      "data-slot",
      "spec-card-title",
    );
    expect(screen.getByText("Material")).toHaveAttribute(
      "data-slot",
      "spec-card-row-label",
    );
    expect(screen.getByText("Stainless Steel 304")).toHaveAttribute(
      "data-slot",
      "spec-card-row-value",
    );
  });
});
