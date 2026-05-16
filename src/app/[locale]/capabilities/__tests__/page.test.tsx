import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderAsyncPage } from "@/test/render-async-page";
import { getContentEntry } from "@/lib/content-manifest";
import { getPageBySlug } from "@/lib/content-query/queries";
import CapabilitiesPage, { generateMetadata } from "../page";

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

describe("CapabilitiesPage", () => {
  it("renders the public capabilities story from real MDX content", async () => {
    const page = await CapabilitiesPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await renderAsyncPage(page);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Tucsenberg Capabilities",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Membrane replacement paths in preparation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Unconfirmed product data, legal terms, delivery promises, warranty language, and quote behavior must not be presented as launch-ready facts.",
      ),
    ).toBeInTheDocument();
  });

  it("reads the real content entry and frontmatter for the capabilities slug", async () => {
    const manifestEntry = getContentEntry("pages", "en", "capabilities");
    const page = await getPageBySlug("capabilities", "en");

    expect(manifestEntry?.relativePath).toBe(
      "content/pages/en/capabilities.mdx",
    );
    expect(page.metadata.slug).toBe("capabilities");
    expect(page.metadata.seo?.keywords).toEqual([
      "Tucsenberg capabilities",
      "replacement membrane RFQ",
      "OEM family membrane matching",
    ]);
    expect(page.content).toContain(
      "## Membrane replacement paths in preparation",
    );
  });

  it("uses real MDX frontmatter for page SEO", async () => {
    await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith(
      expect.objectContaining({
        pageType: "capabilities",
        config: {
          title: "Tucsenberg Capabilities | Membrane Replacement RFQ Path",
          description:
            "See how Tucsenberg is preparing replacement membrane paths around OEM-family evidence, material fit, and RFQ input quality.",
          keywords: [
            "Tucsenberg capabilities",
            "replacement membrane RFQ",
            "OEM family membrane matching",
          ],
          image: "/images/og-image.jpg",
        },
      }),
    );
  });
});
