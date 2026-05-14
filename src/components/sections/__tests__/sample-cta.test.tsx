import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SampleCTA } from "@/components/sections/sample-cta";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("SampleCTA", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(SampleCTA());
    expect(
      screen.getByRole("heading", { level: 2, name: "sample.title" }),
    ).toBeInTheDocument();
  });

  it("renders description text", async () => {
    await renderAsyncComponent(SampleCTA());
    expect(screen.getByText("sample.description")).toBeInTheDocument();
  });

  it("renders CTA button linking to contact page", async () => {
    await renderAsyncComponent(SampleCTA());
    const link = screen.getByRole("link", { name: "sample.cta" });
    expect(link).toHaveAttribute("href", HOMEPAGE_SECTION_LINKS.contact);
  });

  it("protects the CTA label without broad link protection", async () => {
    await renderAsyncComponent(SampleCTA());
    const link = screen.getByRole("link", { name: "sample.cta" });

    expect(link).not.toHaveClass("notranslate");
    expect(link).not.toHaveAttribute("translate", "no");
    expect(screen.getByTestId("sample-cta-label")).toHaveAttribute(
      "translate",
      "no",
    );
  });
});
