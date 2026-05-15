import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderAsyncPage } from "@/test/render-async-page";
import { getContentEntry } from "@/lib/content-manifest";
import { getPageBySlug } from "@/lib/content-query/queries";
import HowItWorksPage, { generateMetadata } from "../page";

const { mockGenerateMetadataForPath } = vi.hoisted(() => ({
  mockGenerateMetadataForPath: vi.fn(() => ({
    title: "MDX SEO Title",
    description: "MDX SEO description",
  })),
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: mockGenerateMetadataForPath,
}));

describe("HowItWorksPage", () => {
  it("renders the real MDX setup flow with ordered-list semantics", async () => {
    const page = await HowItWorksPage({
      params: Promise.resolve({ locale: "en" }),
    });

    const { container } = await renderAsyncPage(page);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How It Works",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Prepare the evidence before asking for a replacement membrane",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelector("ul")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getByText(
        "Let the review connect the evidence to a replacement path.",
      ),
    ).toBeInTheDocument();
  });

  it("reads the real content entry and frontmatter for the how-it-works slug", async () => {
    const manifestEntry = getContentEntry("pages", "en", "how-it-works");
    const page = await getPageBySlug("how-it-works", "en");

    expect(manifestEntry?.relativePath).toBe(
      "content/pages/en/how-it-works.mdx",
    );
    expect(page.metadata.slug).toBe("how-it-works");
    expect(page.metadata.seo?.keywords).toEqual([
      "replacement membrane RFQ",
      "aeration membrane part number",
      "OEM diffuser membrane replacement",
    ]);
    expect(page.content).toContain(
      "1. Identify the OEM family, installed model, diffuser body, or old part number if available.",
    );
  });

  it("uses real MDX frontmatter for page SEO", async () => {
    await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith(
      expect.objectContaining({
        pageType: "howItWorks",
        config: {
          title: "How It Works | Replacement Membrane RFQ Preparation",
          description:
            "Learn what information helps Tucsenberg review an aftermarket aeration replacement membrane inquiry.",
          keywords: [
            "replacement membrane RFQ",
            "aeration membrane part number",
            "OEM diffuser membrane replacement",
          ],
          image: "/images/og-image.jpg",
        },
      }),
    );
  });
});
