import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResourcesSection } from "@/components/sections/resources-section";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("ResourcesSection", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(ResourcesSection());
    expect(
      screen.getByRole("heading", { level: 2, name: "resources.title" }),
    ).toBeInTheDocument();
  });

  it("renders section subtitle", async () => {
    await renderAsyncComponent(ResourcesSection());
    expect(screen.getByText("resources.subtitle")).toBeInTheDocument();
  });

  it("renders 4 resource cards with titles and descriptions", async () => {
    await renderAsyncComponent(ResourcesSection());

    for (let i = 1; i <= 4; i++) {
      const key = `item${i}`;
      expect(screen.getByText(`resources.${key}.title`)).toBeInTheDocument();
      expect(screen.getByText(`resources.${key}.desc`)).toBeInTheDocument();
    }
  });

  it("renders 4 resource card h3 headings", async () => {
    await renderAsyncComponent(ResourcesSection());
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(4);
  });

  it("renders 4 resource cards as navigable links", async () => {
    await renderAsyncComponent(ResourcesSection());
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toHaveAttribute("href");
    }
  });
});
