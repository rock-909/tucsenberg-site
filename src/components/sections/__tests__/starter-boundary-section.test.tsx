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
  it("renders the current Tucsenberg buying path copy", async () => {
    await renderAsyncComponent(StarterBoundarySection());

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "startPath.title",
      }),
    ).toBeInTheDocument();

    const list = screen.getByRole("list", {
      name: "startPath.title",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: "finalCta.primary" }),
    ).toHaveAttribute("href", SINGLE_SITE_ROUTE_HREFS.products);
    expect(
      screen.getByRole("link", { name: "finalCta.secondary" }),
    ).toHaveAttribute("href", SINGLE_SITE_ROUTE_HREFS.requestQuote);
  });

  it("keeps buying path translation keys wired to real copy", () => {
    const copy = enCriticalMessages.home.startPath;
    const finalCtaCopy = enCriticalMessages.home.finalCta;

    expect(copy.title.trim().length).toBeGreaterThan(0);
    expect(copy.description.trim().length).toBeGreaterThan(0);
    expect(Object.keys(copy.items)).toHaveLength(4);
    expect(finalCtaCopy.primary.trim().length).toBeGreaterThan(0);
    expect(finalCtaCopy.secondary.trim().length).toBeGreaterThan(0);

    for (const item of Object.values(copy.items)) {
      expect(item.title.trim().length).toBeGreaterThan(0);
      expect(item.description.trim().length).toBeGreaterThan(0);
    }
  });
});
