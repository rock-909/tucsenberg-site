import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AboutPageShell } from "../about-page-shell";
import type { PageMetadata } from "@/types/content.types";

vi.mock("@/components/mdx/mdx-content", () => ({
  MDXContent: (props: { slug: string }) => (
    <div data-testid="mdx-content">{props.slug}</div>
  ),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: ({ data }: { data: unknown[] }) => (
    <script
      data-testid="about-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@graph": data }) }}
    />
  ),
}));

vi.mock("@/components/sections/faq-section", () => ({
  FaqSection: ({ faqItems }: { faqItems: unknown[] }) => (
    <div data-testid="faq-section">FAQ ({faqItems.length})</div>
  ),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const baseMetadata: PageMetadata = {
  title: "About this showcase website starter",
  description:
    "Learn why this starter exists, who it fits, who it does not fit, and what must be replaced before launch.",
  slug: "about",
  publishedAt: "2024-01-01",
  heroTitle:
    "A showcase website starter designed for real public launch preparation",
  heroSubtitle: "Not a fictional company profile",
  heroDescription:
    "This page explains what the starter is, who it fits, and what must still become real before a public launch.",
  aboutSections: {
    valuesTitle: "What this starter is designed to protect",
    values: {
      quality: {
        title: "Launch structure",
        description:
          "The starter keeps pages, navigation, inquiry paths, and replacement work in one clear public-site structure.",
      },
      innovation: {
        title: "Reusable foundation",
        description:
          "It provides a working foundation that can be adapted without rebuilding every route and component from zero.",
      },
      service: {
        title: "Owner clarity",
        description:
          "The site makes visible what a real owner must confirm before launch.",
      },
      integrity: {
        title: "Honest boundary",
        description:
          "It is not an empty shell, but it is also not a finished client website.",
      },
    },
    statLabels: {
      yearsExperience: "Starter baseline",
      countriesServed: "Locales",
      happyClients: "Replacement surfaces",
      productsDelivered: "Launch path",
    },
    cta: {
      title: "Review the starter capabilities",
      description:
        "See what the starter includes before replacing it with real business facts and assets.",
      button: "View products",
    },
  },
  faq: [
    {
      id: "starter-purpose",
      question: "Is this a finished client website?",
      answer:
        "No. This is a reusable starter demo with working structure and replaceable example content.",
    },
  ],
};

describe("AboutPageShell", () => {
  it("renders hero section with metadata", () => {
    render(
      <AboutPageShell
        metadata={baseMetadata}
        content="## Body"
        locale="en"
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A showcase website starter designed for real public launch preparation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Not a fictional company profile"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page explains what the starter is, who it fits, and what must still become real before a public launch.",
      ),
    ).toBeInTheDocument();
  });

  it("renders value cards and stat items", () => {
    render(
      <AboutPageShell
        metadata={baseMetadata}
        content="## Body"
        locale="en"
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "What this starter is designed to protect",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Launch structure")).toBeInTheDocument();
  });

  it("renders FAQ section when faq items present", () => {
    render(
      <AboutPageShell
        metadata={baseMetadata}
        content="## Body"
        locale="en"
      />,
    );

    expect(screen.getByTestId("faq-section")).toBeInTheDocument();
  });

  it("omits FAQ section when faq is empty", () => {
    const noFaqMetadata = { ...baseMetadata, faq: [] };
    render(
      <AboutPageShell
        metadata={noFaqMetadata}
        content="## Body"
        locale="en"
      />,
    );

    expect(screen.queryByTestId("faq-section")).not.toBeInTheDocument();
  });

  it("omits MDX article when content is empty", () => {
    render(
      <AboutPageShell metadata={baseMetadata} content="  " locale="en" />,
    );

    expect(screen.queryByTestId("mdx-content")).not.toBeInTheDocument();
  });

  it("renders the MDX slot for non-empty content instead of rendering raw content directly", () => {
    const rawContent = [
      "---",
      "locale: en",
      "publishedAt: 2024-01-01",
      "updatedAt: 2024-01-02",
      "aboutSections:",
      "statLabels:",
      "faq:",
      "---",
      "## Body",
    ].join("\n");

    render(
      <AboutPageShell
        metadata={baseMetadata}
        content={rawContent}
        locale="en"
      />,
    );

    expect(screen.getByTestId("mdx-content")).toHaveTextContent("about");
    // This component-level guard only proves the shell mounts the MDX slot.
    // The browser test verifies that compiled MDX strips real frontmatter.
    expect(screen.queryByText(/locale:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/publishedAt:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/updatedAt:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/aboutSections:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/statLabels:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/faq:/)).not.toBeInTheDocument();
  });

  it("renders CTA with link to products page", () => {
    render(
      <AboutPageShell
        metadata={baseMetadata}
        content="## Body"
        locale="en"
      />,
    );

    const ctaLink = screen.getByRole("link", { name: /view products/i });
    expect(ctaLink).toHaveAttribute("href", "/products");
  });

  it("falls back to title when heroTitle is absent", () => {
    const { heroTitle: _ht, heroSubtitle: _hs, heroDescription: _hd, ...rest } =
      baseMetadata;
    const noHeroMetadata: PageMetadata = rest;
    render(
      <AboutPageShell
        metadata={noHeroMetadata}
        content="## Body"
        locale="en"
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "About this showcase website starter",
      }),
    ).toBeInTheDocument();
  });

  it("renders structured data script", () => {
    render(
      <AboutPageShell
        metadata={baseMetadata}
        content="## Body"
        locale="en"
      />,
    );

    const script = screen.getByTestId("about-schema");
    const data = JSON.parse(script.innerHTML);
    const aboutNode = data["@graph"].find(
      (node: Record<string, unknown>) => node["@type"] === "AboutPage",
    );
    expect(aboutNode.name).toBe("About this showcase website starter");
  });
});
