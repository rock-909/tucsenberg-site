/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { heroGuides } from "@/components/grid/hero-guides";
import { GridSection } from "@/components/grid/grid-section";

describe("GridSection", () => {
  it("renders as a section element with grid display", () => {
    render(
      <GridSection columns={3} rows={2}>
        <div data-testid="child">Content</div>
      </GridSection>,
    );

    const section = screen.getByTestId("child").closest("section");
    expect(section).toBeInTheDocument();
    expect(section?.style.display).toBe("grid");
    expect(section?.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(section?.style.gridTemplateRows).toBe("repeat(2, 1fr)");
  });

  it("renders guide cells with correct borders", () => {
    const guides = [
      { column: 1, row: 1, borderRight: true, borderBottom: true },
      { column: 2, row: 1, borderRight: false, borderBottom: true },
    ];

    const { container } = render(
      <GridSection columns={3} rows={1} guides={guides}>
        <div>Content</div>
      </GridSection>,
    );

    const guideCells = container.querySelectorAll("[aria-hidden='true']");
    expect(guideCells).toHaveLength(2);

    // First guide has both borders
    expect(guideCells[0]).toHaveClass("border-r", "border-b");
    // Second guide has only bottom border
    expect(guideCells[1]).toHaveClass("border-b");
    expect(guideCells[1]).not.toHaveClass("border-r");
  });

  it("applies section divider borders", () => {
    const { container } = render(
      <GridSection columns={3} rows={1} divider="top">
        <div>Content</div>
      </GridSection>,
    );

    const section = container.querySelector("section");
    expect(section).toHaveClass("border-t");
  });

  it("applies both divider borders", () => {
    const { container } = render(
      <GridSection columns={3} rows={1} divider="both">
        <div>Content</div>
      </GridSection>,
    );

    const section = container.querySelector("section");
    expect(section).toHaveClass("border-y");
  });

  it("applies no divider by default", () => {
    const { container } = render(
      <GridSection columns={3} rows={1}>
        <div>Content</div>
      </GridSection>,
    );

    const section = container.querySelector("section");
    expect(section).not.toHaveClass("border-t", "border-b", "border-y");
  });

  it("renders no decorative guide cells when none are provided", () => {
    const { container } = render(
      <GridSection columns={3} rows={1}>
        <div>Content</div>
      </GridSection>,
    );

    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(0);
  });
});

describe("heroGuides", () => {
  it("generates guide configs for hero section", () => {
    const guides = heroGuides(3, 3);

    expect(guides.length).toBeGreaterThan(0);

    // All guides should have valid column/row numbers
    for (const guide of guides) {
      expect(guide.column).toBeGreaterThanOrEqual(1);
      expect(guide.column).toBeLessThanOrEqual(3);
      expect(guide.row).toBeGreaterThanOrEqual(1);
      expect(guide.row).toBeLessThanOrEqual(3);
    }
  });

  it("does not generate borderRight for last column", () => {
    const guides = heroGuides(4, 2);
    const lastColGuides = guides.filter((g) => g.column === 4);

    for (const guide of lastColGuides) {
      expect(guide.borderRight).toBe(false);
    }
  });

  it("creates fade-out effect: later rows have fewer borders", () => {
    const guides = heroGuides(6, 6);
    const row1Count = guides.filter((g) => g.row === 1).length;
    const lastRowCount = guides.filter((g) => g.row === 6).length;

    expect(row1Count).toBeGreaterThanOrEqual(lastRowCount);
  });
});
