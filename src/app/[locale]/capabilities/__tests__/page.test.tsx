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
        name: "Starter Capabilities",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Credible Public Pages" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Docs and checks keep sample identity, proof, legal copy, and deployment values from being treated as real launch truth.",
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
      "showcase website starter",
      "B2B website capabilities",
      "lead foundation",
      "Cloudflare website starter",
    ]);
    expect(page.content).toContain("## Credible Public Pages");
  });

  it("uses real MDX frontmatter for page SEO", async () => {
    await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith(
      expect.objectContaining({
        pageType: "capabilities",
        config: {
          title: "Starter Capabilities | Website and Lead Foundation",
          description:
            "See the replaceable public pages, offer story, lead path, Cloudflare deployment proof, owner reporting visibility, and replacement guardrails included in this showcase website starter.",
          keywords: [
            "showcase website starter",
            "B2B website capabilities",
            "lead foundation",
            "Cloudflare website starter",
          ],
          image: "/images/og-image.jpg",
        },
      }),
    );
  });
});
