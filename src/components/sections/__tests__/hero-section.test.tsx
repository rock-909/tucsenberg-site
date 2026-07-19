import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import catalogMessages from "../../../../messages/profiles/catalog/en/messages.json";
import { HeroSection } from "@/components/sections/hero-section";
import { SINGLE_SITE_HOME_LINK_TARGETS } from "@/config/single-site-links";

const heroMessageCases = [
  {
    locale: "en",
    hero: catalogMessages.home.hero,
    proof: {
      est: "Standard items",
      estLabel: "reply within 12 hours",
      countries: "3-year warranty",
      countriesLabel: "on all standard lines",
      range: "Factory pool",
      rangeLabel: "supplies established brands",
      production: "OEM",
      productionLabel: "private label ready",
    },
  },
] as const;

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("HeroSection", () => {
  it("renders without crashing", async () => {
    await renderAsyncComponent(HeroSection());
    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
  });

  it("renders the h1 heading with translation key", async () => {
    await renderAsyncComponent(HeroSection());
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("hero.title");
  });

  it("renders eyebrow text", async () => {
    await renderAsyncComponent(HeroSection());
    expect(screen.getByText("hero.eyebrow")).toBeInTheDocument();
  });

  it("renders subtitle", async () => {
    await renderAsyncComponent(HeroSection());
    expect(screen.getByText("hero.subtitle")).toBeInTheDocument();
  });

  it("renders the working-principle diagram instead of a product-line index", async () => {
    await renderAsyncComponent(HeroSection());

    const heroDiagram = screen.getByTestId("hero-diagram");
    const panel = within(heroDiagram).getByTestId("product-diagram");

    expect(within(panel).getByText("hero.diagram.panelLabel")).toBeVisible();
    expect(within(panel).getByText("hero.diagram.caption")).toBeVisible();
    // The five product cards below the hero own the line index; the hero
    // must not duplicate it (视觉翻译-自顶向下设计.md, home §1).
    expect(screen.queryByTestId("hero-preview-card")).not.toBeInTheDocument();
  });

  it("keeps hero diagram translation keys wired to real copy", () => {
    for (const { hero } of heroMessageCases) {
      expect("preview" in hero).toBe(false);

      const diagram = hero.diagram;
      for (const copy of [
        diagram.panelLabel,
        diagram.ariaLabel,
        diagram.caption,
      ]) {
        expect(copy.trim().length).toBeGreaterThan(0);
        expect(copy).not.toMatch(/^hero\.diagram\./);
      }
    }
  });

  it("does not hard-code English aria labels in the hero view", () => {
    const source = readFileSync(
      "src/components/sections/hero-section-view.tsx",
      "utf8",
    );

    expect(source).not.toContain('aria-label="Primary call to action"');
    expect(source).not.toContain('aria-label="Secondary call to action"');
    expect(source).not.toContain('ariaLabel="Homepage proof facts"');
  });

  it("renders Tucsenberg homepage CTAs with RFQ primary", async () => {
    await renderAsyncComponent(HeroSection());
    const primaryLink = screen.getByText("hero.cta.primary").closest("a");
    const secondaryLink = screen.getByText("hero.cta.secondary").closest("a");
    expect(primaryLink).toHaveAttribute(
      "href",
      SINGLE_SITE_HOME_LINK_TARGETS.primaryCta,
    );
    expect(primaryLink).toHaveAttribute("href", "/request-quote");
    expect(secondaryLink).toHaveAttribute(
      "href",
      SINGLE_SITE_HOME_LINK_TARGETS.secondaryCta,
    );
    expect(secondaryLink).toHaveAttribute("href", "/oem-wholesale");
  });

  it("user sees proof list showing product, application, delivery, and inquiry categories", async () => {
    await renderAsyncComponent(HeroSection());

    const proofList = screen.getByRole("list", {
      name: "hero.proofAriaLabel",
    });
    const proofItems = within(proofList).getAllByRole("listitem");

    expect(proofItems).toHaveLength(4);
    expect(within(proofList).getByText("hero.proof.est")).toBeInTheDocument();
    expect(
      within(proofList).getByText("hero.proof.estLabel"),
    ).toBeInTheDocument();
    expect(
      within(proofList).getByText("hero.proof.countries"),
    ).toBeInTheDocument();
    expect(
      within(proofList).getByText("hero.proof.countriesLabel"),
    ).toBeInTheDocument();
    expect(within(proofList).getByText("hero.proof.range")).toBeInTheDocument();
    expect(
      within(proofList).getByText("hero.proof.rangeLabel"),
    ).toBeInTheDocument();
    expect(
      within(proofList).getByText("hero.proof.production"),
    ).toBeInTheDocument();
    expect(
      within(proofList).getByText("hero.proof.productionLabel"),
    ).toBeInTheDocument();
  });

  it("uses a compact proof panel near the hero claims", async () => {
    await renderAsyncComponent(HeroSection());

    const proofList = screen.getByRole("list", {
      name: "hero.proofAriaLabel",
    });
    const [firstProofItem] = within(proofList).getAllByRole("listitem");
    const firstProofValue = within(firstProofItem).getByText("hero.proof.est");
    const firstProofLabel = within(firstProofItem).getByText(
      "hero.proof.estLabel",
    );

    expect(proofList).toHaveClass(
      "rounded-xl",
      "border",
      "bg-muted/40",
      "grid",
      "grid-cols-2",
    );
    expect(firstProofItem).toHaveClass("rounded-lg");
    expect(firstProofValue).toHaveClass("break-words");
    expect(firstProofValue).not.toHaveClass("truncate");
    expect(firstProofLabel).toHaveClass("break-words");
    expect(firstProofLabel).not.toHaveClass("truncate");
  });

  it("keeps default hero proof copy on B2B categories instead of fake operating numbers", () => {
    for (const { hero, proof: expectedProof } of heroMessageCases) {
      const proof = hero.proof;

      expect(proof.est).toBe(expectedProof.est);
      expect(proof.estLabel).toBe(expectedProof.estLabel);
      expect(proof.countries).toBe(expectedProof.countries);
      expect(proof.countriesLabel).toBe(expectedProof.countriesLabel);
      expect(proof.range).toBe(expectedProof.range);
      expect(proof.rangeLabel).toBe(expectedProof.rangeLabel);
      expect(proof.production).toBe(expectedProof.production);
      expect(proof.productionLabel).toBe(expectedProof.productionLabel);
    }
  });
});
