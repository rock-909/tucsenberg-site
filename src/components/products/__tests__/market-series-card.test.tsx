import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname: string; params: Record<string, string> };
    children: React.ReactNode;
  }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : href.pathname.replace(
            /\[(\w+)\]/g,
            (_, key: string) => href.params[key] ?? key,
          );
    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

describe("MarketSeriesCard", () => {
  async function importComponent() {
    const mod = await import("../market-series-card");
    return mod.MarketSeriesCard;
  }

  const defaultProps = {
    slug: "north-america",
    label: "Primary Offer Example",
    description: "Replaceable catalog example for a standards-based category.",
    standardLabel: "Example Standard A",
    familyCountLabel: "3 product families",
  };

  it("renders market label as heading", async () => {
    const MarketSeriesCard = await importComponent();
    render(<MarketSeriesCard {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "Primary Offer Example" }),
    ).toBeInTheDocument();
  });

  it("renders standard label badge", async () => {
    const MarketSeriesCard = await importComponent();
    render(<MarketSeriesCard {...defaultProps} />);

    expect(screen.getByText("Example Standard A")).toBeInTheDocument();
  });

  it("renders market description", async () => {
    const MarketSeriesCard = await importComponent();
    render(<MarketSeriesCard {...defaultProps} />);

    expect(
      screen.getByText(
        "Replaceable catalog example for a standards-based category.",
      ),
    ).toBeInTheDocument();
  });

  it("links to the market landing page", async () => {
    const MarketSeriesCard = await importComponent();
    render(<MarketSeriesCard {...defaultProps} />);

    const link = screen
      .getByRole("heading", { name: "Primary Offer Example" })
      .closest("a");
    expect(link).toHaveAttribute("href", "/products/north-america");
  });

  it("displays family count label", async () => {
    const MarketSeriesCard = await importComponent();
    render(<MarketSeriesCard {...defaultProps} />);

    expect(screen.getByText("3 product families")).toBeInTheDocument();
  });

  it("displays translated family count label", async () => {
    const MarketSeriesCard = await importComponent();
    render(
      <MarketSeriesCard {...defaultProps} familyCountLabel="3 个产品系列" />,
    );

    expect(screen.getByText("3 个产品系列")).toBeInTheDocument();
  });

  it("renders the engineering line drawing for a real product line", async () => {
    const MarketSeriesCard = await importComponent();
    const { container } = render(
      <MarketSeriesCard {...defaultProps} slug="abs-flood-barriers" />,
    );
    // Decorative drawing: present for real lines, hidden from the a11y tree.
    expect(container.querySelector("[aria-hidden] svg")).not.toBeNull();
  });

  it("renders no drawing area for slugs without a product page", async () => {
    const MarketSeriesCard = await importComponent();
    const { container } = render(<MarketSeriesCard {...defaultProps} />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
