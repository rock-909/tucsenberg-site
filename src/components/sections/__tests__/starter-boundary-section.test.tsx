import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import enCriticalMessages from "../../../../messages/en/critical.json";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import { StarterBoundarySection } from "@/components/sections/starter-boundary-section";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("StarterBoundarySection", () => {
  it("explains that the polished site is still a replaceable starter", async () => {
    await renderAsyncComponent(StarterBoundarySection());

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "title",
      }),
    ).toBeInTheDocument();

    const list = screen.getByRole("list", {
      name: "listLabel",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "primary" })).toHaveAttribute(
      "href",
      SINGLE_SITE_ROUTE_HREFS.howItWorks,
    );
    expect(screen.getByRole("link", { name: "secondary" })).toHaveAttribute(
      "href",
      SINGLE_SITE_ROUTE_HREFS.contact,
    );
  });

  it("keeps starter boundary translation keys wired to real copy", () => {
    const copy = enCriticalMessages.home.starterBoundary;

    expect(copy.title.trim().length).toBeGreaterThan(0);
    expect(copy.description.trim().length).toBeGreaterThan(0);
    expect(copy.listLabel.trim().length).toBeGreaterThan(0);
    expect(copy.items).toHaveLength(4);
    expect(copy.primary.trim().length).toBeGreaterThan(0);
    expect(copy.secondary.trim().length).toBeGreaterThan(0);

    for (const item of copy.items) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.description.trim().length).toBeGreaterThan(0);
    }
  });
});
