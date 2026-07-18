import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildShellPageSchema,
  LegalPageShell,
} from "@/components/content/legal-page-shell";

const mockJsonLdGraphScript = vi.hoisted(() => vi.fn());

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

  it("Given privacy legal metadata, When the shell renders, Then JSON-LD uses WebPage", async () => {
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
    });

    expect(schema["@type"]).toBe("WebPage");
    expect(schema).not.toHaveProperty("additionalType");
  });

  it("Given terms legal metadata, When the shell renders, Then JSON-LD has no additionalType", async () => {
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
    });

    expect(schema["@type"]).toBe("WebPage");
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

  it("Given frontmatter FAQ items, When the shell renders, Then FAQPage is injected once", async () => {
    const page = await LegalPageShell({
      metadata: {
        title: "OEM & Wholesale",
        slug: "oem-wholesale",
        publishedAt: "2026-07-02",
        faq: [
          {
            id: "oem-faq-1",
            question: "Are you a factory or a trading company?",
            answer: "We are the product company.",
          },
        ],
      },
      content: "Trade landing body",
      headings: [],
      locale: "en",
      schemaType: "WebPage",
      pagePath: "/oem-wholesale",
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

    expect(types).toEqual(
      expect.arrayContaining(["WebPage", "FAQPage", "BreadcrumbList"]),
    );
    expect(screen.getByTestId("legal-content")).toHaveTextContent(
      "Trade landing body",
    );
  });
});
