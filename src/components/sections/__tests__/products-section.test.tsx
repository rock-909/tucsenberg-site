import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductsSection } from "@/components/sections/products-section";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("ProductsSection", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(ProductsSection());
    expect(
      screen.getByRole("heading", { level: 2, name: "products.title" }),
    ).toBeInTheDocument();
  });

  it("renders section subtitle", async () => {
    await renderAsyncComponent(ProductsSection());
    expect(screen.getByText("products.subtitle")).toBeInTheDocument();
  });

  it("renders CTA button as a link to products page", async () => {
    await renderAsyncComponent(ProductsSection());
    const ctaLink = screen.getByText("products.cta").closest("a");
    expect(ctaLink).toHaveAttribute("href", HOMEPAGE_SECTION_LINKS.products);
  });

  it("renders 3 live product cards with tags, titles, and standards", async () => {
    await renderAsyncComponent(ProductsSection());

    for (let i = 1; i <= 3; i++) {
      const key = `item${i}`;
      expect(screen.getByText(`products.${key}.tag`)).toBeInTheDocument();
      expect(screen.getByText(`products.${key}.title`)).toBeInTheDocument();
      expect(screen.getByText(`products.${key}.standard`)).toBeInTheDocument();
    }
  });

  it("renders 3 product card h3 headings", async () => {
    await renderAsyncComponent(ProductsSection());
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(3);
  });

  it("renders 3 specs per product card", async () => {
    await renderAsyncComponent(ProductsSection());

    for (let i = 1; i <= 3; i++) {
      const key = `item${i}`;
      for (let j = 1; j <= 3; j++) {
        expect(
          screen.getByText(`products.${key}.spec${j}`),
        ).toBeInTheDocument();
      }
    }
  });
});
