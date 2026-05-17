/**
 * Phase-B regression proof: the home page must emit EXACTLY ONE
 * `application/ld+json` script whose `@graph` merges the site identity
 * (Organization + WebSite) with the home FAQPage schema — not two scattered
 * scripts.
 *
 * This renders the real `page.tsx`, the real `JsonLdGraphScript`, the real
 * `HomeFaqSection`/`FaqSection`, and the real `generateFaqSchemaFromItems`.
 * Only request/runtime boundaries are mocked. The home page imports
 * `@/data/product-compatibility`, which runs Zod `.parse()` at module load,
 * so zod is unmocked here.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import Home from "../page";
import { renderAsyncPage } from "@/test/render-async-page";

vi.unmock("zod");

type MockLinkHref = string | { pathname: string };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es", "zh"], defaultLocale: "en" },
  Link: ({ children, href, ...props }: MockLinkProps) => (
    <a href={typeof href === "string" ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => key),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/lib/page-structured-data", () => ({
  generatePageStructuredData: vi.fn(() =>
    Promise.resolve({
      organizationData: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Tucsenberg",
      },
      websiteData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Tucsenberg",
      },
    }),
  ),
}));

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: vi.fn(() =>
    Promise.resolve({
      home: {
        faq: {
          sectionTitle: "Replacement membrane questions",
          items: {
            q01: { question: "Q01 question?", answer: "Q01 answer." },
            q02: { question: "Q02 question?", answer: "Q02 answer." },
            q03: { question: "Q03 question?", answer: "Q03 answer." },
            q04: { question: "Q04 question?", answer: "Q04 answer." },
            q05: { question: "Q05 question?", answer: "Q05 answer." },
            q06: { question: "Q06 question?", answer: "Q06 answer." },
          },
        },
      },
    }),
  ),
}));

// Unrelated heavy sections are stubbed so this test stays focused on the
// JSON-LD contract. The FAQ path is intentionally left real.
vi.mock("@/components/search/home-hero-search", () => ({
  HomeHeroSearch: () => (
    <input type="search" aria-label="Compatibility search" />
  ),
}));
vi.mock("@/components/sections/home-confirm-section", () => ({
  HomeConfirmSection: () => <section data-testid="home-confirm-section" />,
}));
vi.mock("@/components/sections/home-membrane-type-section", () => ({
  HomeMembraneTypeSection: () => <section data-testid="home-membrane" />,
}));
vi.mock("@/components/sections/home-risks-section", () => ({
  HomeRisksSection: () => <section data-testid="home-risks" />,
}));
vi.mock("@/components/trust", () => ({
  SlaCommitments: () => <ul data-testid="sla" />,
  CompatibilityProofBox: () => <section data-testid="proof" />,
  MaterialDecisionCard: () => <section data-testid="material" />,
  BatchControlsBlock: () => <section data-testid="batch" />,
  TrademarkDisclaimer: () => <footer data-testid="trademark" />,
}));

describe("Home page JSON-LD single-graph contract", () => {
  it("emits exactly one ld+json script whose @graph merges Organization, WebSite, and FAQPage", async () => {
    const HomeComponent = await Home({
      params: Promise.resolve({ locale: "en" }),
    });

    const { container } = await renderAsyncPage(HomeComponent);

    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(scripts).toHaveLength(1);

    const parsed = JSON.parse(scripts[0]!.textContent ?? "{}") as {
      "@context"?: unknown;
      "@graph"?: Array<{ "@type"?: unknown }>;
    };

    expect(parsed["@context"]).toBe("https://schema.org");
    expect(Array.isArray(parsed["@graph"])).toBe(true);

    const graphTypes = new Set(
      (parsed["@graph"] ?? []).map((node) => node["@type"]),
    );
    expect(graphTypes).toContain("Organization");
    expect(graphTypes).toContain("WebSite");
    expect(graphTypes).toContain("FAQPage");

    // The FAQPage node must not carry a nested @context (collectGraphNodes
    // strips it); the single graph owns the one @context.
    const faqNode = (parsed["@graph"] ?? []).find(
      (node) => node["@type"] === "FAQPage",
    );
    expect(faqNode).toBeDefined();
    expect(faqNode && "@context" in faqNode).toBe(false);
  });
});
