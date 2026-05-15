import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpecTable } from "../spec-table";
import type { SpecGroup } from "@/constants/product-specs/types";

const mockGroups: SpecGroup[] = [
  {
    groupLabel: "Basic Option",
    columns: ["Size", "Angle", "Wall Thickness", "End Type"],
    rows: [
      ['1/2"', "90°", '0.060"', "Bell End"],
      ['3/4"', "90°", '0.060"', "Plain End"],
    ],
  },
  {
    groupLabel: "Advanced Option",
    columns: ["Size", "Angle", "Wall Thickness", "End Type"],
    rows: [['1/2"', "90°", '0.084"', "Bell End"]],
  },
];

describe("Feature: Market Page — Spec Matrix", () => {
  describe("Scenario: Buyer reads specification matrix for a product family", () => {
    it("renders group labels as subheadings", async () => {
      render(await SpecTable({ specGroups: mockGroups }));
      expect(screen.getByText("Basic Option")).toBeInTheDocument();
      expect(screen.getByText("Advanced Option")).toBeInTheDocument();
    });

    it("renders column headers in table head", async () => {
      render(await SpecTable({ specGroups: mockGroups }));
      const headers = screen.getAllByRole("columnheader");
      expect(headers.map((h) => h.textContent)).toEqual(
        expect.arrayContaining(["Size", "Angle", "Wall Thickness", "End Type"]),
      );
    });

    it("renders data rows with correct values", async () => {
      render(await SpecTable({ specGroups: mockGroups }));
      // Values appear across multiple groups — use getAllByText
      expect(screen.getAllByText('1/2"').length).toBeGreaterThan(0);
      expect(screen.getAllByText("90°").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bell End").length).toBeGreaterThan(0);
    });

    it("uses semantic table elements", async () => {
      const { container } = render(await SpecTable({ specGroups: mockGroups }));
      expect(container.querySelector("table")).toBeInTheDocument();
      expect(container.querySelector("thead")).toBeInTheDocument();
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("wraps table in horizontally scrollable container", async () => {
      const { container } = render(await SpecTable({ specGroups: mockGroups }));
      const wrapper = container.querySelector('[class*="overflow"]');
      expect(wrapper).toBeInTheDocument();
    });

    it("uses the local DataCard wrapper for each specification group", async () => {
      const { container } = render(await SpecTable({ specGroups: mockGroups }));
      const cards = container.querySelectorAll('[data-slot="data-card"]');

      expect(cards).toHaveLength(mockGroups.length);
      expect(cards[0]).toHaveAttribute(
        "data-ui-pilot",
        "radix-themes-data-card",
      );
    });
  });
});
