import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildShellPageSchema,
  LegalPageShell,
} from "@/components/content/legal-page-shell";
import {
  organizationStructuredDataId,
  websiteStructuredDataId,
} from "@/lib/structured-data-generators";
import { SITE_CONFIG } from "@/config/paths";

const mockJsonLdGraphScript = vi.hoisted(() => vi.fn());

vi.mock("@/config/paths", () => ({
  SITE_CONFIG: {
    baseUrl: "https://www.example.com",
  },
}));

vi.mock("@/config/paths/site-config", () => ({
  SITE_CONFIG: {
    baseUrl: "https://www.example.com",
  },
}));

vi.mock("@/components/seo/json-ld-script", () => ({
  JsonLdGraphScript: ({
    locale,
    data = [],
  }: {
    locale: string;
    data?: readonly unknown[];
  }) => {
    mockJsonLdGraphScript({ locale, data });
    return <script type="application/ld+json" data-testid="json-ld-graph" />;
  },
}));

vi.mock("@/components/content/legal-content-renderer", () => ({
  LegalContentRenderer: ({ content }: { content: string }) => (
    <div data-testid="legal-content">{content}</div>
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ namespace }: { namespace: string }) => {
    const values: Record<string, Record<string, string>> = {
      legal: {
        effectiveDate: "Effective",
        lastUpdated: "Updated",
        tableOfContents: "Contents",
      },
      navigation: {
        home: "Home",
      },
      "structured-data": {
        "organization.name": "Tucsenberg",
        "article.defaultAuthor": "Tucsenberg",
      },
    };

    return (key: string) => values[namespace]?.[key] ?? key;
  }),
}));

describe("LegalPageShell structured data", () => {
  beforeEach(() => {
    mockJsonLdGraphScript.mockClear();
  });

  it("Given privacy legal metadata, When the shell renders, Then WebPage JSON-LD uses the page URL graph", async () => {
    const pageUrl = "https://www.example.com/privacy";
    const schema = await buildShellPageSchema({
      metadata: {
        title: "Privacy Policy",
        slug: "privacy",
        publishedAt: "2024-01-01",
        seo: {
          title: "Privacy Policy",
          description: "Privacy description",
        },
      },
      locale: "en",
      schemaType: "WebPage",
      pageUrl,
    });

    expect(schema).toMatchObject({
      "@type": "WebPage",
      "@id": pageUrl,
      url: pageUrl,
      isPartOf: { "@id": websiteStructuredDataId(SITE_CONFIG.baseUrl) },
      about: {
        "@id": organizationStructuredDataId(SITE_CONFIG.baseUrl),
      },
    });
    expect(schema).not.toHaveProperty("additionalType");
  });

  it("Given terms legal metadata, When the shell renders, Then WebPage JSON-LD has no additionalType", async () => {
    const pageUrl = "https://www.example.com/terms";
    const schema = await buildShellPageSchema({
      metadata: {
        title: "Terms of Service",
        slug: "terms",
        publishedAt: "2024-01-01",
        seo: {
          title: "Terms of Service",
          description: "Terms description",
        },
      },
      locale: "en",
      schemaType: "WebPage",
      pageUrl,
    });

    expect(schema).toMatchObject({
      "@type": "WebPage",
      "@id": pageUrl,
      url: pageUrl,
    });
    expect(schema).not.toHaveProperty("additionalType");
  });

  it("Given article metadata, When the shell renders, Then author is Organization", async () => {
    const schema = await buildShellPageSchema({
      metadata: {
        title: "Materials Guide",
        slug: "materials-guide",
        publishedAt: "2026-01-01",
        author: "Tucsenberg",
        seo: {
          title: "Materials Guide",
          description: "Guide description",
        },
      },
      locale: "en",
      schemaType: "Article",
      pageUrl: "https://www.example.com/materials-guide",
    });

    expect(schema.author).toMatchObject({
      "@type": "Organization",
    });
  });

  it("Given legal metadata with FAQ frontmatter, When the shell renders, Then FAQPage is not injected", async () => {
    const page = await LegalPageShell({
      metadata: {
        title: "Privacy Policy",
        slug: "privacy",
        publishedAt: "2024-01-01",
        faq: [
          {
            id: "privacy-faq-1",
            question: "Do you sell data?",
            answer: "No.",
          },
        ],
      },
      content: "Privacy body",
      headings: [],
      locale: "en",
      schemaType: "WebPage",
      pagePath: "/privacy",
    });

    render(page);

    const graphCall = mockJsonLdGraphScript.mock.calls.at(-1)?.[0] as
      | { data: readonly unknown[] }
      | undefined;
    const types = graphCall?.data.map(
      (node) =>
        typeof node === "object" && node !== null
          ? (node as { "@type"?: string })["@type"]
          : undefined,
    );

    expect(types).toEqual(expect.arrayContaining(["WebPage", "BreadcrumbList"]));
    expect(types).not.toContain("FAQPage");
    expect(screen.getByTestId("legal-content")).toHaveTextContent("Privacy body");
  });
});
