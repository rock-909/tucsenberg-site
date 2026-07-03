import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SampleCTA } from "@/components/sections/sample-cta";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

interface MockHomepageSectionLinks {
  primaryCta: string;
  secondaryCta: string;
  contact?: string;
}

const mockHomepageSectionLinks = vi.hoisted(
  (): { current: MockHomepageSectionLinks } => ({
    current: {
      contact: "/contact",
      primaryCta: "/products",
      secondaryCta: "/contact",
    },
  }),
);

vi.mock("@/components/sections/homepage-section-links", () => ({
  get HOMEPAGE_SECTION_LINKS() {
    return mockHomepageSectionLinks.current;
  },
}));

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("SampleCTA", () => {
  beforeEach(() => {
    mockHomepageSectionLinks.current = {
      contact: "/contact",
      primaryCta: "/products",
      secondaryCta: "/contact",
    };
  });

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

  it("renders CTA button linking to the active contact route", async () => {
    await renderAsyncComponent(SampleCTA());
    const link = screen.getByRole("link", { name: "sample.cta" });
    expect(link).toHaveAttribute("href", HOMEPAGE_SECTION_LINKS.contact);
  });

  it("omits the contact CTA when the active profile has no contact route", async () => {
    mockHomepageSectionLinks.current = {
      primaryCta: "/",
      secondaryCta: "/",
    };

    await renderAsyncComponent(SampleCTA());

    expect(
      screen.queryByRole("link", { name: "sample.cta" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("sample-cta-label")).not.toBeInTheDocument();
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
