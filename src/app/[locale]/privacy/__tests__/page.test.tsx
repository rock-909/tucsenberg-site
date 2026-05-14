import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrivacyPage, { generateMetadata } from "@/app/[locale]/privacy/page";
import type { Locale } from "@/types/content.types";

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
      headings,
      schemaType,
    }: {
      metadata: { title: string };
      headings: Array<{ id: string; text: string }>;
      schemaType: string;
    }) => (
      <div data-schema-type={schemaType}>
        <h1>{metadata.title}</h1>
        <nav aria-label="Table of Contents">
          {headings.map((heading) => (
            <a key={heading.id} href={`#${heading.id}`}>
              {heading.text}
            </a>
          ))}
        </nav>
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

const createParams = (locale: Locale) => ({
  locale,
});

const mockLegalPage = {
  metadata: {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your data.",
    slug: "privacy",
    publishedAt: "2024-01-01",
    updatedAt: "2024-02-01",
    layout: "legal" as const,
    showToc: true as const,
    lastReviewed: "2024-02-01",
    seo: {
      title: "Privacy Policy SEO",
      description: "Privacy SEO description",
    },
  },
  content: "## Information We Collect {#info-collect}\n\nWe collect data.",
  headings: [
    { level: 2 as const, text: "Information We Collect", id: "info-collect" },
  ],
};

describe("Privacy Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadLegalPage.mockResolvedValue(mockLegalPage);
    mockGenerateMetadataForPath.mockReturnValue({
      title: "Privacy Policy SEO",
      description: "Privacy SEO description",
    });
  });

  it("应该用 MDX frontmatter 生成 metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve(createParams("en")),
    });

    expect(metadata.title).toBe("Privacy Policy SEO");
    expect(metadata.description).toBe("Privacy SEO description");
    expect(mockLoadLegalPage).toHaveBeenCalledWith("privacy", "en");
    expect(mockGenerateMetadataForPath).toHaveBeenCalledWith({
      locale: "en",
      pageType: "privacy",
      path: "/privacy",
      config: {
        title: "Privacy Policy SEO",
        description: "Privacy SEO description",
      },
    });
  });

  it("应该返回带加载骨架的隐私页面入口", async () => {
    const PrivacyPageComponent = await PrivacyPage({
      params: Promise.resolve(createParams("en")),
    });

    const { container } = render(PrivacyPageComponent);

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(8);
  });
});
