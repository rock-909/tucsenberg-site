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
        name: "Move from No Website to a Launchable Foundation",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelector("ul")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getByText(
        "Check traffic and sign off: set up owner reporting visibility, review real traffic, and confirm the launch state with the owner.",
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
      "website setup process",
      "showcase website launch",
      "Cloudflare launch workflow",
      "B2B website starter",
    ]);
    expect(page.content).toContain("1. Replace the business facts");
  });

  it("uses real MDX frontmatter for page SEO", async () => {
    await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith(
      expect.objectContaining({
        pageType: "howItWorks",
        config: {
          title: "How It Works | Setup to Launch",
          description:
            "Use the starter as a complete demo, replace the business facts, connect the lead path, deploy on Cloudflare, and prove the result before calling it launch-ready.",
          keywords: [
            "website setup process",
            "showcase website launch",
            "Cloudflare launch workflow",
            "B2B website starter",
          ],
          image: "/images/og-image.jpg",
        },
      }),
    );
  });
});
