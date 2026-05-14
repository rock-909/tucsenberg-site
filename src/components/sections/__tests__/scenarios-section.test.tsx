import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScenariosSection } from "@/components/sections/scenarios-section";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("ScenariosSection", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(ScenariosSection());
    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
  });

  it("renders section subtitle", async () => {
    await renderAsyncComponent(ScenariosSection());
    expect(screen.getByText("subtitle")).toBeInTheDocument();
  });

  it("renders 3 scenario cards with title, desc, and quote", async () => {
    await renderAsyncComponent(ScenariosSection());

    const keys = ["item1", "item2", "item3"];
    for (const key of keys) {
      expect(screen.getAllByText(`${key}.title`).length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getByText(`${key}.desc`)).toBeInTheDocument();
      expect(screen.getByText(`${key}.quote`)).toBeInTheDocument();
    }
  });

  it("renders exactly 3 h3 headings for scenario cards", async () => {
    await renderAsyncComponent(ScenariosSection());
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(3);
  });
});
