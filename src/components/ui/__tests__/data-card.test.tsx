import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
  DataCard,
  DataCardContent,
  DataCardDescription,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";

describe("DataCard", () => {
  it("renders data-card slots with stable Radix takeover markers", () => {
    render(
      <DataCard data-testid="card">
        <DataCardHeader>
          <DataCardTitle>Specification</DataCardTitle>
          <DataCardDescription>Buyer-visible details</DataCardDescription>
        </DataCardHeader>
        <DataCardContent>Stainless steel</DataCardContent>
      </DataCard>,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-slot", "data-card");
    expect(card).toHaveAttribute("data-ui-pilot", "radix-themes-data-card");
    expect(screen.getByText("Specification")).toHaveAttribute(
      "data-slot",
      "data-card-title",
    );
    expect(screen.getByText("Buyer-visible details")).toHaveAttribute(
      "data-slot",
      "data-card-description",
    );
    expect(screen.getByText("Stainless steel")).toHaveAttribute(
      "data-slot",
      "data-card-content",
    );
  });

  it("merges custom classes and forwards refs", () => {
    const cardRef = createRef<HTMLDivElement>();

    render(
      <DataCard ref={cardRef} className="custom-card">
        Content
      </DataCard>,
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(cardRef.current).toHaveClass("custom-card");
  });
});
