import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FinalCTA } from "@/components/sections/final-cta";
import { HeroSection } from "@/components/sections/hero-section";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";
import { ProductsSection } from "@/components/sections/products-section";
import { SampleCTA } from "@/components/sections/sample-cta";
import { ScenariosSection } from "@/components/sections/scenarios-section";
import { StarterBoundarySection } from "@/components/sections/starter-boundary-section";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

const HOMEPAGE_SERVER_SECTION_SOURCES = [
  {
    filePath: "src/components/sections/chain-section.tsx",
    source: readFileSync("src/components/sections/chain-section.tsx", "utf8"),
  },
  {
    filePath: "src/components/sections/starter-boundary-section.tsx",
    source: readFileSync(
      "src/components/sections/starter-boundary-section.tsx",
      "utf8",
    ),
  },
  {
    filePath: "src/components/sections/starter-boundary-section-view.tsx",
    source: readFileSync(
      "src/components/sections/starter-boundary-section-view.tsx",
      "utf8",
    ),
  },
  {
    filePath: "src/components/sections/scenarios-section.tsx",
    source: readFileSync(
      "src/components/sections/scenarios-section.tsx",
      "utf8",
    ),
  },
  {
    filePath: "src/components/sections/quality-section.tsx",
    source: readFileSync("src/components/sections/quality-section.tsx", "utf8"),
  },
] as const;

const HOMEPAGE_PROOF_SLICE_SOURCES = [
  {
    filePath: "src/app/[locale]/page.tsx",
    source: readFileSync("src/app/[locale]/page.tsx", "utf8"),
  },
  {
    filePath: "src/components/sections/hero-section.tsx",
    source: readFileSync("src/components/sections/hero-section.tsx", "utf8"),
  },
  {
    filePath: "src/components/sections/hero-section-view.tsx",
    source: readFileSync(
      "src/components/sections/hero-section-view.tsx",
      "utf8",
    ),
  },
] as const;

describe("Homepage section cluster contract", () => {
  it("keeps server-rendered homepage sections from importing client icon packages", () => {
    for (const { filePath, source } of HOMEPAGE_SERVER_SECTION_SOURCES) {
      expect(source, filePath).not.toContain("lucide-react");
    }
  });

  it("keeps this homepage proof slice from adding direct client boundaries", () => {
    for (const { filePath, source } of HOMEPAGE_PROOF_SLICE_SOURCES) {
      expect(source, filePath).not.toContain('"use client"');
      expect(source, filePath).not.toContain("'use client'");
    }
  });

  it("preserves hero and final/sample CTA hierarchy", async () => {
    await renderAsyncComponent(HeroSection());
    const heroProofList = screen.getByRole("list", {
      name: "hero.proofAriaLabel",
    });
    expect(within(heroProofList).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("hero.cta.primary").closest("a")).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.primaryCta,
    );
    expect(screen.getByText("hero.cta.secondary").closest("a")).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.secondaryCta,
    );
    expect(screen.getByText("hero.cta.secondary").closest("a")).toHaveAttribute(
      "href",
      "/oem-wholesale",
    );

    await renderAsyncComponent(SampleCTA());
    expect(screen.getByRole("link", { name: "sample.cta" })).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.contact,
    );

    await renderAsyncComponent(FinalCTA());
    const finalTrustList = screen.getByRole("list", {
      name: "trustAriaLabel",
    });
    expect(within(finalTrustList).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("primary").closest("a")).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.products,
    );
    expect(screen.getByText("secondary").closest("a")).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.requestQuote,
    );
  });

  it("keeps section responsibilities present across the cluster", async () => {
    const productsSection = await renderAsyncComponent(ProductsSection());
    expect(productsSection.container).not.toBeEmptyDOMElement();

    const starterBoundary = await renderAsyncComponent(
      StarterBoundarySection(),
    );
    expect(
      within(starterBoundary.container).getByRole("heading", {
        level: 2,
        name: "title",
      }),
    ).toBeInTheDocument();

    const scenarios = await renderAsyncComponent(ScenariosSection());
    expect(
      within(scenarios.container).getByRole("heading", {
        level: 2,
        name: "title",
      }),
    ).toBeInTheDocument();
  });

  it("does not mount the retired resources section wrapper on the active homepage", () => {
    const homepageSource = readFileSync("src/app/[locale]/page.tsx", "utf8");

    expect(homepageSource).not.toContain("ResourcesSection");
  });
});
