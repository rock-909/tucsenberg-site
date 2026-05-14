import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChainSection } from "@/components/sections/chain-section";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("ChainSection", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(ChainSection());
    expect(
      screen.getByRole("heading", { level: 2, name: "chain.title" }),
    ).toBeInTheDocument();
  });

  it("renders section subtitle", async () => {
    await renderAsyncComponent(ChainSection());
    expect(screen.getByText("chain.subtitle")).toBeInTheDocument();
  });

  it("renders 5 step cards with titles and descriptions", async () => {
    await renderAsyncComponent(ChainSection());

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`chain.step${i}.title`)).toBeInTheDocument();
      expect(screen.getByText(`chain.step${i}.desc`)).toBeInTheDocument();
    }
  });

  it("renders step numbers 01 through 05", async () => {
    await renderAsyncComponent(ChainSection());
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i).padStart(2, "0"))).toBeInTheDocument();
    }
  });

  it("renders 5 step h3 headings", async () => {
    await renderAsyncComponent(ChainSection());
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(5);
  });

  it("renders 3 stat cards", async () => {
    await renderAsyncComponent(ChainSection());
    expect(screen.getByText("chain.stat1")).toBeInTheDocument();
    expect(screen.getByText("chain.stat2")).toBeInTheDocument();
    expect(screen.getByText("chain.stat3")).toBeInTheDocument();
  });
});
