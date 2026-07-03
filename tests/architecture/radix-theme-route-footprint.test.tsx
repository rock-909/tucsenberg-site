import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpecTable } from "@/components/products/spec-table";
import type { SpecGroup } from "@/constants/product-specs/types";

const mockSpecGroups: SpecGroup[] = [
  {
    groupLabel: "Basic Option",
    columns: ["Size", "Angle"],
    rows: [['1/2"', "90°"]],
  },
  {
    groupLabel: "Advanced Option",
    columns: ["Size", "Angle"],
    rows: [['3/4"', "90°"]],
  },
];

describe("Radix theme route footprint spot-check", () => {
  it("scopes DataCard theme boundaries one-to-one on spec tables", async () => {
    const { container } = render(
      await SpecTable({ specGroups: mockSpecGroups }),
    );

    expect(container.querySelectorAll('[data-slot="data-card"]')).toHaveLength(
      2,
    );
    expect(
      container.querySelectorAll('[data-testid="radix-theme-pilot"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-ui-pilot="radix-themes-data-card"]'),
    ).toHaveLength(2);
  });
});
