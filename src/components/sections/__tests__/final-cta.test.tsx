import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FinalCTA } from "@/components/sections/final-cta";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("FinalCTA", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(FinalCTA());
    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
  });

  it("renders description text", async () => {
    await renderAsyncComponent(FinalCTA());
    expect(screen.getByText("description")).toBeInTheDocument();
  });

  it("renders primary CTA as a link to /contact", async () => {
    await renderAsyncComponent(FinalCTA());
    const primaryLink = screen.getByText("primary").closest("a");
    expect(primaryLink).toHaveAttribute("href", HOMEPAGE_SECTION_LINKS.contact);
  });

  it("renders secondary CTA as a link to /products", async () => {
    await renderAsyncComponent(FinalCTA());
    const secondaryLink = screen.getByText("secondary").closest("a");
    expect(secondaryLink).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.products,
    );
  });

  it("renders trust facts as a semantic list", async () => {
    await renderAsyncComponent(FinalCTA());

    const trustList = screen.getByRole("list", {
      name: "trustAriaLabel",
    });
    const trustItems = within(trustList).getAllByRole("listitem");

    expect(trustItems).toHaveLength(1);
    expect(within(trustList).getByText("trust")).toBeInTheDocument();
  });

  it("keeps inverse trust text above contrast threshold on primary backgrounds", async () => {
    await renderAsyncComponent(FinalCTA());

    const trustList = screen.getByRole("list", {
      name: "trustAriaLabel",
    });

    expect(within(trustList).getByText("trust")).toHaveClass(
      "text-primary-foreground/90",
    );
  });

  it("protects CTA labels without broad link protection", async () => {
    await renderAsyncComponent(FinalCTA());

    expect(screen.getByRole("link", { name: "primary" })).not.toHaveClass(
      "notranslate",
    );
    expect(screen.getByRole("link", { name: "primary" })).not.toHaveAttribute(
      "translate",
      "no",
    );
    expect(screen.getByTestId("final-cta-primary-label")).toHaveAttribute(
      "translate",
      "no",
    );
    expect(screen.getByTestId("final-cta-secondary-label")).toHaveAttribute(
      "translate",
      "no",
    );
  });
});
