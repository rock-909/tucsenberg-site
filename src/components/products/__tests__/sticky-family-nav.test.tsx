import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StickyFamilyNav } from "../sticky-family-nav";

const mockFamilies = [
  { slug: "sample-product-shapes", label: "Sample Product Shapes" },
  { slug: "couplings", label: "Support Packages" },
  { slug: "sample-product-runs", label: "Sample Product Runs" },
];

describe("Feature: Market Page — Sticky Navigation", () => {
  describe("Scenario: Buyer jumps between product families", () => {
    it("renders a nav link for each family", () => {
      render(<StickyFamilyNav families={mockFamilies} />);
      expect(screen.getByText("Sample Product Shapes")).toBeInTheDocument();
      expect(screen.getByText("Support Packages")).toBeInTheDocument();
      expect(screen.getByText("Sample Product Runs")).toBeInTheDocument();
    });

    it("each link points to the correct anchor", () => {
      render(<StickyFamilyNav families={mockFamilies} />);
      const sweepsLink = screen.getByText("Sample Product Shapes").closest("a");
      expect(sweepsLink).toHaveAttribute("href", "#sample-product-shapes");
      const couplingsLink = screen.getByText("Support Packages").closest("a");
      expect(couplingsLink).toHaveAttribute("href", "#couplings");
    });

    it("renders as a nav element for accessibility", () => {
      render(<StickyFamilyNav families={mockFamilies} />);
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });
});
