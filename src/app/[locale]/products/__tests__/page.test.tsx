import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductsPage from "../page";
import {
  assertNoHeavyCatalogOrDeveloperDemoCopy,
  createCatalogTranslator,
} from "./mocks/products-test-fixtures";

const {
  mockBuildCatalogBreadcrumbJsonLd,
  mockCatalogBreadcrumb,
  mockGetTranslations,
} = vi.hoisted(() => ({
  mockBuildCatalogBreadcrumbJsonLd: vi.fn(),
  mockCatalogBreadcrumb: vi.fn(() => (
    <nav aria-label="breadcrumb">Breadcrumb</nav>
  )),
  mockGetTranslations: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
  setRequestLocale: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
}));

vi.mock("@/config/paths", () => ({
  getProductMarketPath: (slug: string) => `/products/${slug}`,
  SITE_CONFIG: {
    baseUrl: "https://www.example.com",
  },
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: vi.fn(async () => ({
    title: "Products",
    description: "Products page",
  })),
}));

vi.mock("@/components/products/catalog-breadcrumb", () => ({
  CatalogBreadcrumb: mockCatalogBreadcrumb,
}));

vi.mock("@/components/products/catalog-breadcrumb-jsonld", () => ({
  buildCatalogBreadcrumbJsonLd: mockBuildCatalogBreadcrumbJsonLd,
}));

vi.mock("@/components/seo/json-ld-script", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
  JsonLdScript: () => <script type="application/ld+json" />,
}));

vi.mock("@/config/single-site-seo", () => ({
  hasSingleSiteDynamicSurface: vi.fn(() => false),
}));

describe("Products Overview Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCatalogBreadcrumb.mockClear();
    mockGetTranslations.mockImplementation(
      async ({ locale }: { locale: string }) => createCatalogTranslator(locale),
    );
    mockBuildCatalogBreadcrumbJsonLd.mockResolvedValue({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    });
  });

  it("renders the Tucsenberg product-line hub with guide and RFQ CTAs", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Flood Barrier Product Lines",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View guides" })).toHaveAttribute(
      "href",
      "/guides/flood-barrier-materials-guide",
    );
    expect(
      screen.getByRole("link", { name: "Request a Quote" }),
    ).toHaveAttribute("href", "/request-quote");

    const productLineLinks = [
      [
        "ABS Interlocking Boxwall Flood Barriers",
        "/products/abs-flood-barriers",
      ],
      [
        "Aluminum Flood Gates & Demountable Barrier Systems",
        "/products/aluminum-flood-gates",
      ],
      [
        "Absorbent Flood Bags (Sandless Sandbags)",
        "/products/absorbent-flood-bags",
      ],
      ["Water & Air-Filled Tube Dams", "/products/flood-tube-dams"],
      ["FRP Composite Planks", "/products/frp-flood-barriers"],
    ] as const;

    for (const [label, href] of productLineLinks) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }

    assertNoHeavyCatalogOrDeveloperDemoCopy();
  });

  it("does not render a duplicate header kicker below the breadcrumb", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(screen.queryByText("Products")).not.toBeInTheDocument();
  });

  it("exposes only current product-line routes and no retired blog/resources CTA", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/request-quote");
    expect(hrefs).toContain("/guides/flood-barrier-materials-guide");
    expect(hrefs).toContain("/products/abs-flood-barriers");
    expect(hrefs).toContain("/products/aluminum-flood-gates");
    expect(hrefs).toContain("/products/absorbent-flood-bags");
    expect(hrefs).toContain("/products/flood-tube-dams");
    expect(hrefs).toContain("/products/frp-flood-barriers");
    expect(hrefs).not.toContain("/resources");
    expect(hrefs).not.toContain("/contact");
    expect(hrefs).not.toContain("/blog");
    expect(hrefs).not.toContain("/products/north-america");

    assertNoHeavyCatalogOrDeveloperDemoCopy();
  });

  it("renders breadcrumb", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
  });

  it("opts only the products listing breadcrumb home link out of prefetch", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(mockCatalogBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        homePrefetch: false,
        renderJsonLd: false,
      }),
      undefined,
    );
  });
});
