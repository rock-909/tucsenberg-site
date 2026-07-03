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
  it("renders named slots on the Radix Themes data-card wrapper contract", () => {
    render(
      <DataCard data-testid="data-card">
        <DataCardHeader>
          <DataCardTitle>Specification surface</DataCardTitle>
          <DataCardDescription>
            Buyer-facing specification summary
          </DataCardDescription>
        </DataCardHeader>
        <DataCardContent>Table or definition list content</DataCardContent>
      </DataCard>,
    );

    const card = screen.getByTestId("data-card");
    expect(card).toHaveAttribute("data-slot", "data-card");
    expect(card).not.toHaveAttribute("data-ui-pilot");
    expect(screen.getByTestId("radix-theme-pilot")).toHaveAttribute(
      "data-ui-pilot",
      "radix-themes-data-card",
    );
    expect(
      screen.getByText("Specification surface").closest("[data-slot]"),
    ).toHaveAttribute("data-slot", "data-card-title");
    expect(
      screen
        .getByText("Buyer-facing specification summary")
        .closest("[data-slot]"),
    ).toHaveAttribute("data-slot", "data-card-description");
    expect(
      screen
        .getByText("Table or definition list content")
        .closest("[data-slot]"),
    ).toHaveAttribute("data-slot", "data-card-content");
    expect(
      screen.getByText("Specification surface").closest("[data-slot]")
        ?.parentElement,
    ).toHaveAttribute("data-slot", "data-card-header");
  });

  it("passes through className, role, and aria attributes on the root card", () => {
    render(
      <DataCard
        aria-label="Technical data"
        className="custom-data-card"
        data-testid="data-card"
        role="region"
      >
        <DataCardContent>Content</DataCardContent>
      </DataCard>,
    );

    const card = screen.getByRole("region", { name: "Technical data" });
    expect(card).toHaveClass("custom-data-card");
    expect(card).toHaveAttribute("data-testid", "data-card");
  });

  it("passes through attributes and custom classes on child slots", () => {
    render(
      <DataCard>
        <DataCardHeader aria-label="Header slot" className="header-class">
          <DataCardTitle className="title-class">Data title</DataCardTitle>
          <DataCardDescription className="description-class">
            Data description
          </DataCardDescription>
        </DataCardHeader>
        <DataCardContent className="content-class" data-testid="content">
          Content
        </DataCardContent>
      </DataCard>,
    );

    expect(screen.getByLabelText("Header slot")).toHaveClass("header-class");
    expect(screen.getByText("Data title")).toHaveClass("title-class");
    expect(screen.getByText("Data description")).toHaveClass(
      "description-class",
    );
    expect(screen.getByTestId("content")).toHaveClass("content-class");
  });

  it("does not allow callers to override internal data-slot contracts", () => {
    render(
      <DataCard data-slot="bad" data-testid="data-card">
        <DataCardHeader data-slot="bad">
          <DataCardTitle data-slot="bad">Data title</DataCardTitle>
          <DataCardDescription data-slot="bad">
            Data description
          </DataCardDescription>
        </DataCardHeader>
        <DataCardContent data-slot="bad">Content</DataCardContent>
      </DataCard>,
    );

    const card = screen.getByTestId("data-card");
    expect(card).toHaveAttribute("data-slot", "data-card");
    expect(card).not.toHaveAttribute("data-ui-pilot");
    expect(screen.getByText("Data title").parentElement).toHaveAttribute(
      "data-slot",
      "data-card-header",
    );
    expect(screen.getByText("Data title")).toHaveAttribute(
      "data-slot",
      "data-card-title",
    );
    expect(screen.getByText("Data description")).toHaveAttribute(
      "data-slot",
      "data-card-description",
    );
    expect(screen.getByText("Content")).toHaveAttribute(
      "data-slot",
      "data-card-content",
    );
  });

  it("self-contains the Radix Themes boundary for business callers", () => {
    render(
      <DataCard data-testid="data-card">
        <DataCardContent>Self-contained card</DataCardContent>
      </DataCard>,
    );

    const card = screen.getByTestId("data-card");
    const boundary = screen.getByTestId("radix-theme-pilot");

    expect(boundary).toHaveAttribute("data-ui-pilot", "radix-themes-data-card");
    expect(boundary).toHaveClass("contents");
    expect(card).toHaveAttribute("data-slot", "data-card");
    expect(card).not.toHaveAttribute("data-ui-pilot");
    expect(screen.queryAllByTestId("radix-theme-pilot")).toHaveLength(1);
    expect(
      document.querySelectorAll('[data-ui-pilot="radix-themes-data-card"]'),
    ).toHaveLength(1);
  });

  it("forwards refs to the root HTMLDivElement", () => {
    const ref = createRef<HTMLDivElement>();

    render(<DataCard ref={ref}>Forwarded card</DataCard>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("data-slot", "data-card");
    expect(ref.current).not.toHaveAttribute("data-ui-pilot");
  });
});
