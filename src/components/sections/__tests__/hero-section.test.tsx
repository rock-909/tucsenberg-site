import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import enCriticalMessages from "../../../../messages/en/critical.json";
import zhCriticalMessages from "../../../../messages/zh/critical.json";
import { HeroSection } from "@/components/sections/hero-section";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

const obsoleteHeroPreviewKeys = [
  "items",
  "pages",
  "components",
  "storybook",
  "workflow",
] as const;
const heroMessageCases = [
  {
    locale: "en",
    hero: enCriticalMessages.home.hero,
    proof: {
      est: "Product",
      estLabel: "systems",
      countries: "Application",
      countriesLabel: "fit",
      range: "Delivery",
      rangeLabel: "proof",
      production: "Inquiry",
      productionLabel: "ready",
    },
    preview: {
      productSystem: "Product system",
      applicationFit: "Application fit",
      deliveryProof: "Delivery proof",
      inquiryPath: "Inquiry path",
    },
  },
  {
    locale: "zh",
    hero: zhCriticalMessages.home.hero,
    proof: {
      est: "产品",
      estLabel: "体系",
      countries: "应用",
      countriesLabel: "场景",
      range: "交付",
      rangeLabel: "证明",
      production: "询盘",
      productionLabel: "就绪",
    },
    preview: {
      productSystem: "产品体系",
      applicationFit: "应用适配",
      deliveryProof: "交付证据",
      inquiryPath: "询盘路径",
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

  it("renders starter preview as a B2B evaluation map", async () => {
    await renderAsyncComponent(HeroSection());

    const preview = screen.getByTestId("hero-preview-card");
    const previewList = within(preview).getByRole("list");
    const previewItems = within(previewList).getAllByRole("listitem");

    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute("aria-labelledby", "hero-preview-title");
    expect(
      within(preview).getByRole("heading", {
        level: 2,
        name: "hero.preview.title",
      }),
    ).toBeInTheDocument();
    expect(previewItems).toHaveLength(4);
    expect(
      within(preview).getByText("hero.preview.productSystem"),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText("hero.preview.applicationFit"),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText("hero.preview.deliveryProof"),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText("hero.preview.inquiryPath"),
    ).toBeInTheDocument();
    expect(
      within(preview).queryByText("hero.preview.note"),
    ).not.toBeInTheDocument();
  });

  it("keeps starter preview translation keys wired to real copy", () => {
    for (const { hero, preview: expectedPreview } of heroMessageCases) {
      const preview = hero.preview;

      for (const copy of [
        preview.label,
        preview.title,
        preview.description,
        preview.productSystem,
        preview.applicationFit,
        preview.deliveryProof,
        preview.inquiryPath,
        preview.note,
      ]) {
        expect(copy.trim().length).toBeGreaterThan(0);
        expect(copy).not.toMatch(/^hero\.preview\./);
      }

      expect(preview.productSystem).toBe(expectedPreview.productSystem);
      expect(preview.applicationFit).toBe(expectedPreview.applicationFit);
      expect(preview.deliveryProof).toBe(expectedPreview.deliveryProof);
      expect(preview.inquiryPath).toBe(expectedPreview.inquiryPath);

      for (const obsoleteKey of obsoleteHeroPreviewKeys) {
        expect(obsoleteKey in preview).toBe(false);
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

  it("renders default company-site homepage CTAs with /products primary", async () => {
    await renderAsyncComponent(HeroSection());
    const primaryLink = screen.getByText("hero.cta.primary").closest("a");
    const secondaryLink = screen.getByText("hero.cta.secondary").closest("a");
    expect(primaryLink).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.primaryCta,
    );
    expect(primaryLink).toHaveAttribute("href", "/products");
    expect(secondaryLink).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.secondaryCta,
    );
    expect(secondaryLink).toHaveAttribute("href", "/contact");
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

    const preview = screen.getByTestId("hero-preview-card");
    const previewList = within(preview).getByRole("list");
    const proofList = screen.getByRole("list", {
      name: "hero.proofAriaLabel",
    });
    const [firstProofItem] = within(proofList).getAllByRole("listitem");
    const firstProofValue = within(firstProofItem).getByText("hero.proof.est");
    const firstProofLabel = within(firstProofItem).getByText(
      "hero.proof.estLabel",
    );

    expect(preview).toHaveClass("surface-card", "md:p-6", "shadow-none");
    expect(previewList).toHaveClass("gap-2");
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
