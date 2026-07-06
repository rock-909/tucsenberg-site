import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProductFamilyDefinition } from "@/constants/product-catalog";
import type { FamilySpecs } from "@/constants/product-specs/types";

// Mock next/image — renders as plain <img> in test environment
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    sizes,
    className,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
  }) => (
    <img
      src={src}
      alt={alt}
      data-fill={fill ? "true" : undefined}
      data-sizes={sizes}
      className={className}
    />
  ),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    className,
    prefetch,
  }: {
    href: string | { pathname: string; query?: Record<string, string> };
    children: React.ReactNode;
    className?: string;
    prefetch?: boolean;
  }) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : `${href.pathname}?${new URLSearchParams(href.query)}`;

    return (
      <a
        href={resolvedHref}
        className={className}
        data-prefetch={prefetch === undefined ? "default" : String(prefetch)}
      >
        {children}
      </a>
    );
  },
}));

// Mock SpecTable to keep tests focused on FamilySection behavior
vi.mock("../spec-table", () => ({
  SpecTable: ({ specGroups }: { specGroups: unknown[] }) => (
    <div data-testid="spec-table">{specGroups.length} groups</div>
  ),
}));

const mockFamily: ProductFamilyDefinition = {
  slug: "sample-product-shapes",
  label: "Sample Product Shapes",
  description:
    "Replaceable item examples for versions, shapes, packages, or service variants.",
  marketSlug: "north-america",
};

const mockSpecs: FamilySpecs = {
  slug: "sample-product-shapes",
  images: ["/profile-fixtures/catalog/products/placeholder-shape.svg"],
  highlights: [
    "Example Standard A ready",
    "Configurable material",
    "45°/90°/Custom",
  ],
  specGroups: [
    {
      groupLabel: "Basic Option",
      columns: ["Size", "Angle"],
      rows: [['1/2"', "90°"]],
    },
  ],
};

describe("Feature: Market Family Page — Product Family Section", () => {
  async function importComponent() {
    const mod = await import("../family-section");
    return mod.FamilySection;
  }

  describe("Scenario 1.2 / 1.5: Buyer sees product family with image area and spec table", () => {
    it("renders the family name as a heading", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
        />,
      );

      expect(
        screen.getByRole("heading", { name: "Sample Product Shapes" }),
      ).toBeInTheDocument();
    });

    it("renders the family description", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
        />,
      );

      expect(
        screen.getByText(
          "Replaceable item examples for versions, shapes, packages, or service variants.",
        ),
      ).toBeInTheDocument();
    });

    it("renders the neutral fallback while product photos are pending", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
        />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute(
        "src",
        "/profile-fixtures/catalog/products/sample-product-a.svg",
      );
    });

    it("falls back when pending product photos point to a missing non-placeholder file", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={{
            ...mockSpecs,
            images: ["/images/products/missing-real-photo.jpg"],
          }}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
        />,
      );

      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "/profile-fixtures/catalog/products/sample-product-a.svg",
      );
    });

    it("renders 3 key highlights", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
        />,
      );

      expect(screen.getByText("Example Standard A ready")).toBeInTheDocument();
      expect(screen.getByText("Configurable material")).toBeInTheDocument();
      expect(screen.getByText("45°/90°/Custom")).toBeInTheDocument();
    });

    it("renders the SpecTable component", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
        />,
      );

      expect(screen.getByTestId("spec-table")).toBeInTheDocument();
      expect(screen.getByTestId("spec-table")).toHaveTextContent("1 groups");
    });

    it("has an anchor id matching the family slug for sticky nav linking", async () => {
      const FamilySection = await importComponent();
      const { container } = render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
        />,
      );

      const section = container.querySelector("section#sample-product-shapes");
      expect(section).toBeInTheDocument();
    });

    it("renders an optional inquiry CTA", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
          inquiry={{
            href: {
              pathname: "/contact",
              query: {
                intent: "product-family",
                market: "north-america",
                family: "sample-product-shapes",
              },
            },
            label: "Request quote for Sample Product Shapes",
          }}
        />,
      );

      const inquiryLink = screen.getByRole("link", {
        name: "Request quote for Sample Product Shapes",
      });
      expect(inquiryLink).toHaveAttribute(
        "href",
        "/contact?intent=product-family&market=north-america&family=sample-product-shapes",
      );
      expect(inquiryLink).toHaveAttribute("data-prefetch", "default");
    });

    it("can opt the inquiry CTA out of automatic route prefetch", async () => {
      const FamilySection = await importComponent();
      render(
        <FamilySection
          family={mockFamily}
          specs={mockSpecs}
          familyLabel="Sample Product Shapes"
          familyDescription="Replaceable item examples for versions, shapes, packages, or service variants."
          inquiry={{
            href: {
              pathname: "/contact",
              query: {
                intent: "product-family",
                market: "north-america",
                family: "sample-product-shapes",
              },
            },
            label: "Request quote for Sample Product Shapes",
            prefetch: false,
          }}
        />,
      );

      expect(
        screen.getByRole("link", {
          name: "Request quote for Sample Product Shapes",
        }),
      ).toHaveAttribute("data-prefetch", "false");
    });
  });
});
