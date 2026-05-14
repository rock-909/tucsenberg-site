import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import enCriticalMessages from "../../../../messages/en/critical.json";
import { HeroSection } from "@/components/sections/hero-section";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

const homeMessages = enCriticalMessages.home;

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

  it("renders starter preview content", async () => {
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
    expect(within(preview).getByText("hero.preview.pages")).toBeInTheDocument();
    expect(
      within(preview).getByText("hero.preview.components"),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText("hero.preview.storybook"),
    ).toBeInTheDocument();
    expect(
      within(preview).getByText("hero.preview.workflow"),
    ).toBeInTheDocument();
    expect(within(preview).getByText("hero.preview.note")).toBeInTheDocument();
  });

  it("keeps starter preview translation keys wired to real copy", () => {
    const preview = homeMessages.hero.preview;

    for (const copy of [
      preview.label,
      preview.title,
      preview.description,
      preview.pages,
      preview.components,
      preview.storybook,
      preview.workflow,
      preview.note,
    ]) {
      expect(copy.trim().length).toBeGreaterThan(0);
      expect(copy).not.toMatch(/^hero\.preview\./);
    }
  });

  it("renders primary CTA as a link to /contact", async () => {
    await renderAsyncComponent(HeroSection());
    const primaryLink = screen.getByText("hero.cta.primary").closest("a");
    expect(primaryLink).toHaveAttribute("href", HOMEPAGE_SECTION_LINKS.contact);
  });

  it("renders secondary CTA as a link to /products", async () => {
    await renderAsyncComponent(HeroSection());
    const secondaryLink = screen.getByText("hero.cta.secondary").closest("a");
    expect(secondaryLink).toHaveAttribute(
      "href",
      HOMEPAGE_SECTION_LINKS.products,
    );
  });

  it("user sees proof list showing establishment, countries, range, and production data", async () => {
    await renderAsyncComponent(HeroSection());

    const proofList = screen.getByRole("list", {
      name: "Homepage proof facts",
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
});
