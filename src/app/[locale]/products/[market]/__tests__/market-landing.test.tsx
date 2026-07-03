import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNotFound = vi.fn();
const mockGetTranslations = vi.fn();
const mockCatalogBreadcrumb = vi.hoisted(() => vi.fn());
const mockJsonLdGraphScript = vi.hoisted(() => vi.fn());

type MockHref =
  | string
  | {
      pathname: string;
      query?: Record<string, string>;
    };

function stringifyMockHref(href: MockHref) {
  if (typeof href === "string") {
    return href;
  }

  const query = href.query ? `?${new URLSearchParams(href.query)}` : "";
  return `${href.pathname}${query}`;
}

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
  setRequestLocale: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    className,
    prefetch,
  }: {
    href: MockHref;
    children: React.ReactNode;
    className?: string;
    prefetch?: boolean;
  }) => (
    <a
      href={stringifyMockHref(href)}
      className={className}
      data-prefetch={prefetch === undefined ? "default" : String(prefetch)}
    >
      {children}
    </a>
  ),
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
}));

vi.mock("@/config/paths", () => ({
  SITE_CONFIG: {
    name: "Example Showcase Company",
    baseUrl: "https://www.example.com",
    seo: {
      defaultTitle: "Example Showcase Company",
      defaultDescription: "Replaceable showcase catalog example",
      keywords: ["showcase catalog example"],
    },
  },
  LOCALES_CONFIG: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
  PATHS_CONFIG: {
    pages: {
      products: "/products",
    },
  },
  DYNAMIC_PATHS_CONFIG: {
    productMarket: {
      pattern: "/products/[market]",
      paramName: "market",
    },
  },
  getLocalizedPath: (pageType: string) =>
    pageType === "products" ? "/products" : "/",
  getProductMarketPath: (market: string) => `/products/${market}`,
}));

vi.mock("@/components/products/catalog-breadcrumb", () => ({
  CatalogBreadcrumb: mockCatalogBreadcrumb,
}));

vi.mock("@/components/products/catalog-breadcrumb-jsonld", () => ({
  buildCatalogBreadcrumbJsonLd: vi.fn(async () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [],
  })),
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

vi.mock("@/components/products/family-section", () => ({
  FamilySection: ({
    family,
    familyLabel,
    inquiry,
  }: {
    family: { slug: string; label: string };
    familyLabel: string;
    inquiry?: { href: MockHref; label: string; prefetch?: boolean };
  }) => (
    <section data-testid={`family-${family.slug}`}>
      <h2>{familyLabel}</h2>
      {inquiry ? (
        <a
          href={stringifyMockHref(inquiry.href)}
          data-prefetch={
            inquiry.prefetch === undefined
              ? "default"
              : String(inquiry.prefetch)
          }
        >
          {inquiry.label}
        </a>
      ) : null}
    </section>
  ),
}));

vi.mock("@/components/products/sticky-family-nav", () => ({
  StickyFamilyNav: () => <nav data-testid="sticky-nav">nav</nav>,
}));

vi.mock("@/components/sections/faq-section", () => ({
  FaqSection: () => <section data-testid="faq-section">FAQ</section>,
}));

vi.mock("@/lib/content-query/queries", () => ({
  getPageBySlug: vi.fn(async () => ({
    metadata: {
      faq: [
        {
          id: "market-faq",
          question: "Market FAQ?",
          answer: "Market FAQ answer.",
        },
      ],
    },
  })),
}));

vi.mock("@/components/products/product-specs", () => ({
  ProductSpecs: ({ title }: { title?: string }) => (
    <div data-testid="product-specs">{title}</div>
  ),
  ProductCertifications: ({ title }: { title?: string }) => (
    <div data-testid="product-certifications">{title}</div>
  ),
  ProductTradeInfo: ({ title }: { title?: string }) => (
    <div data-testid="product-trade-info">{title}</div>
  ),
}));

const MOCK_TRANSLATIONS: Record<string, string> = {
  "markets.north-america.label": "Primary Offer Example",
  "markets.north-america.description":
    "Replaceable catalog example for a standards-based product or service group.",
  "markets.australia-new-zealand.label": "Secondary Offer Example",
  "markets.australia-new-zealand.description":
    "Replaceable catalog example for a second market, service tier, or regional offer.",
  "markets.mexico.label": "Regional Offer Example",
  "markets.mexico.description":
    "Replaceable catalog example for a regional or compliance-based offer.",
  "markets.europe.label": "Platform Offer Example",
  "markets.europe.description":
    "Replaceable catalog example for another market, platform, or standards group.",
  "markets.specialty-product-systems.label": "Specialty Examples",
  "markets.specialty-product-systems.description":
    "High-performance specialty products designed for configured transfer systems.",
  "market.technical.title": "Technical Properties",
  "market.certifications.title": "Certifications & Compliance",
  "market.trade.title": "Trade Information",
  "market.trade.moq": "Minimum Order",
  "market.trade.leadTime": "Lead Time",
  "market.trade.supplyCapacity": "Supply Capacity",
  "market.trade.packaging": "Packaging",
  "market.trade.portOfLoading": "Port of Loading",
  "market.cta.heading": "Need {marketLabel} products?",
  "market.cta.description":
    "Request a quote or ask about specifications, MOQ, and lead times.",
  "market.cta.button": "Request a Quote",
  "market.familyInquiry.cta": "Request quote for {familyLabel}",
  "families.north-america.sample-product-shapes.label": "Sample Product Shapes",
  "families.north-america.sample-product-shapes.description":
    "Replaceable item examples for versions, shapes, packages, or service variants.",
};

describe("Market Landing Page", () => {
  beforeEach(() => {
    vi.resetModules();
    mockNotFound.mockClear();
    mockJsonLdGraphScript.mockClear();
    mockCatalogBreadcrumb.mockReset();
    mockCatalogBreadcrumb.mockImplementation(() => (
      <nav aria-label="breadcrumb">Breadcrumb</nav>
    ));
    mockGetTranslations.mockReset();
    mockGetTranslations.mockResolvedValue(
      (key: string, params?: Record<string, string>) => {
        let value = MOCK_TRANSLATIONS[key] ?? key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            value = value.replace(`{${k}}`, v);
          }
        }
        return value;
      },
    );
  });

  async function renderPage(market: string, locale = "en") {
    const { default: MarketPage } = await import("../page");
    const page = await MarketPage({
      params: Promise.resolve({ locale, market }),
    });
    return render(page);
  }

  async function generatePageMetadata(market: string, locale = "en") {
    const { generateMetadata } = await import("../page");
    return generateMetadata({
      params: Promise.resolve({ locale, market }),
    });
  }

  describe("Scenario 1.1: Page renders with title and standard label", () => {
    it("renders the market title as h1 and standard label badge", async () => {
      await renderPage("north-america");

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Primary Offer Example");
      expect(screen.getByText("Example Standard A")).toBeInTheDocument();
    });

    it("renders the market description", async () => {
      await renderPage("north-america");

      expect(
        screen.getByText(/Replaceable catalog example for a standards-based/),
      ).toBeInTheDocument();
    });

    it("renders server links from each family to Contact with context", async () => {
      await renderPage("north-america");

      const sweepsLink = screen.getByRole("link", {
        name: /request quote for sample product shapes/i,
      });

      expect(sweepsLink).toHaveAttribute(
        "href",
        expect.stringContaining("/contact"),
      );
      expect(sweepsLink).toHaveAttribute(
        "href",
        expect.stringContaining("intent=product-family"),
      );
      expect(sweepsLink).toHaveAttribute(
        "href",
        expect.stringContaining("market=north-america"),
      );
      expect(sweepsLink).toHaveAttribute(
        "href",
        expect.stringContaining("family=sample-product-shapes"),
      );
    });

    it("does not render shared FAQ on market landing pages", async () => {
      await renderPage("north-america");

      expect(screen.queryByTestId("faq-section")).not.toBeInTheDocument();
    });

    it("adds ProductGroup and BreadcrumbList JSON-LD through the shared graph script", async () => {
      await renderPage("north-america");

      const graphCall = mockJsonLdGraphScript.mock.calls.at(-1)?.[0] as
        | { readonly locale: string; readonly data: readonly unknown[] }
        | undefined;

      expect(graphCall?.locale).toBe("en");
      expect(graphCall?.data).toEqual([
        expect.objectContaining({ "@type": "ProductGroup" }),
        expect.objectContaining({ "@type": "BreadcrumbList" }),
      ]);
    });
  });

  describe("metadata", () => {
    it("uses central path-aware metadata with x-default alternates", async () => {
      const metadata = await generatePageMetadata("north-america");

      expect(metadata).toMatchObject({
        title: "Primary Offer Example | Example Showcase Company",
        description:
          "Replaceable catalog example for a standards-based product or service group.",
        alternates: {
          canonical: "https://www.example.com/en/products/north-america",
          languages: {
            en: "https://www.example.com/en/products/north-america",
            zh: "https://www.example.com/zh/products/north-america",
            "x-default": "https://www.example.com/en/products/north-america",
          },
        },
      });
    });
  });

  describe("Scenario 1.2: Family sections rendered", () => {
    it("renders 3 family sections for north-america", async () => {
      await renderPage("north-america");

      expect(
        screen.getByTestId("family-sample-product-shapes"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("family-couplings")).toBeInTheDocument();
      expect(
        screen.getByTestId("family-sample-product-runs"),
      ).toBeInTheDocument();
    });

    it("renders sticky family nav", async () => {
      await renderPage("north-america");
      expect(screen.getByTestId("sticky-nav")).toBeInTheDocument();
    });
  });

  describe("Scenario 1.6: Trust signals are present", () => {
    it("renders technical specs section for market with spec data", async () => {
      await renderPage("north-america");
      expect(screen.getByTestId("product-specs")).toHaveTextContent(
        "Technical Properties",
      );
    });

    it("renders certifications section for market with spec data", async () => {
      await renderPage("north-america");
      expect(screen.getByTestId("product-certifications")).toHaveTextContent(
        "Certifications & Compliance",
      );
    });

    it("renders trade info section for market with spec data", async () => {
      await renderPage("north-america");
      expect(screen.getByTestId("product-trade-info")).toHaveTextContent(
        "Trade Information",
      );
    });

    it("renders trust signals for mexico market", async () => {
      await renderPage("mexico");

      expect(screen.getByTestId("product-specs")).toBeInTheDocument();
      expect(screen.getByTestId("product-certifications")).toBeInTheDocument();
      expect(screen.getByTestId("product-trade-info")).toBeInTheDocument();
    });
  });

  describe("Scenario 1.7: CTA links to /contact", () => {
    it("renders CTA section with link to /contact", async () => {
      await renderPage("north-america");

      const ctaLink = screen.getByRole("link", { name: /request a quote/i });
      expect(ctaLink).toHaveAttribute("href", "/contact");
    });

    it("opts product detail contact links out of automatic prefetch", async () => {
      await renderPage("north-america");

      const familyLink = screen.getByRole("link", {
        name: /request quote for sample product shapes/i,
      });
      expect(familyLink).toHaveAttribute(
        "href",
        "/contact?intent=product-family&market=north-america&family=sample-product-shapes",
      );
      expect(familyLink).toHaveAttribute("data-prefetch", "false");

      const ctaLink = screen.getByRole("link", { name: /request a quote/i });
      expect(ctaLink).toHaveAttribute("href", "/contact");
      expect(ctaLink).toHaveAttribute("data-prefetch", "false");
    });

    it("renders CTA heading with market label", async () => {
      await renderPage("north-america");

      expect(
        screen.getByText("Need Primary Offer Example products?"),
      ).toBeInTheDocument();
    });
  });

  describe("Scenario: Product market FAQ is not mounted", () => {
    it("does not render a shared FAQ section on market pages", async () => {
      await renderPage("north-america");

      expect(screen.queryByTestId("faq-section")).not.toBeInTheDocument();
    });
  });

  describe("Scenario 1.10: Invalid market slug calls notFound", () => {
    it("calls notFound for invalid market slug", async () => {
      await expect(renderPage("invalid-market")).rejects.toThrow(
        "NEXT_NOT_FOUND",
      );
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  describe("Breadcrumb", () => {
    it("renders breadcrumb navigation", async () => {
      await renderPage("north-america");
      expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
    });

    it("opts product detail breadcrumb route links out of automatic prefetch", async () => {
      await renderPage("north-america");

      expect(mockCatalogBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          homePrefetch: false,
          market: expect.objectContaining({ slug: "north-america" }),
          marketLabel: "Primary Offer Example",
          productsPrefetch: false,
          renderJsonLd: false,
        }),
        undefined,
      );
    });
  });

  describe("Scenario: AU/NZ market renders with spec data", () => {
    it("renders family sections for AU/NZ", async () => {
      await renderPage("australia-new-zealand");

      expect(
        screen.getByTestId("family-sample-product-shapes"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("family-bellmouths")).toBeInTheDocument();
    });

    it("renders trust signals for AU/NZ", async () => {
      await renderPage("australia-new-zealand");

      expect(screen.getByTestId("product-specs")).toBeInTheDocument();
      expect(screen.getByTestId("product-certifications")).toBeInTheDocument();
      expect(screen.getByTestId("product-trade-info")).toBeInTheDocument();
    });

    it("renders sticky family navigation when spec data exists", async () => {
      await renderPage("australia-new-zealand");

      expect(screen.getByTestId("sticky-nav")).toBeInTheDocument();
    });
  });
});
