import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocaleParam } from "@/app/[locale]/generate-static-params";
import TermsPage, { generateMetadata, generateStaticParams } from "../page";

const { mockLoadLegalPage, mockGenerateMetadataForPath } = vi.hoisted(() => ({
  mockLoadLegalPage: vi.fn(),
  mockGenerateMetadataForPath: vi.fn(),
}));

vi.mock("@/lib/content/legal-page", () => ({
  loadLegalPage: mockLoadLegalPage,
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: mockGenerateMetadataForPath,
}));

vi.mock("@/components/content/legal-page-shell", () => ({
  LegalPageShell: vi.fn(
    ({
      metadata,
      schemaType,
    }: {
      metadata: { title: string };
      schemaType: string;
    }) => (
      <div data-schema-type={schemaType}>
        <h1>{metadata.title}</h1>
      </div>
    ),
  ),
}));

vi.mock("@/app/[locale]/generate-static-params", () => ({
  generateLocaleStaticParams: () => [{ locale: "en" }, { locale: "zh" }],
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}));

const mockParams = { locale: "en" } as const satisfies LocaleParam;

const mockLegalPage = {
  metadata: {
    title: "Terms of Service",
    description: "Please read our terms carefully",
    slug: "terms",
    publishedAt: "2024-01-01",
    updatedAt: "2024-06-01",
    layout: "legal" as const,
    showToc: true as const,
    lastReviewed: "2024-06-01",
    seo: {
      title: "Terms SEO",
      description: "Terms SEO description",
    },
  },
  content: "## Introduction {#introduction}\n\nWelcome.",
  headings: [{ level: 2 as const, text: "Introduction", id: "introduction" }],
};

describe("TermsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadLegalPage.mockResolvedValue(mockLegalPage);
    mockGenerateMetadataForPath.mockReturnValue({
      title: "Terms SEO",
      description: "Terms SEO description",
    });
  });

  describe("generateStaticParams", () => {
    it("should return params for all locales", () => {
      const params = generateStaticParams();

      expect(params).toEqual([{ locale: "en" }, { locale: "zh" }]);
    });
  });

  describe("generateMetadata", () => {
    it("should return metadata from MDX frontmatter", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve(mockParams),
      });

      expect(metadata).toMatchObject({
        title: "Terms SEO",
        description: "Terms SEO description",
      });
      expect(mockLoadLegalPage).toHaveBeenCalledWith("terms", "en");
      expect(mockGenerateMetadataForPath).toHaveBeenCalledWith({
        locale: "en",
        pageType: "terms",
        path: "/terms",
        config: {
          title: "Terms SEO",
          description: "Terms SEO description",
        },
      });
    });
  });

  describe("TermsPage", () => {
    it("should render loading skeleton entry", async () => {
      const component = await TermsPage({
        params: Promise.resolve(mockParams),
      });

      const { container } = render(component);

      expect(container.querySelectorAll(".animate-pulse")).toHaveLength(8);
    });
  });
});
