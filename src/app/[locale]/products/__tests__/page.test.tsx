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

  it("renders company-site product overview with resources and contact CTAs", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Product overview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View resources" }),
    ).toHaveAttribute("href", "/resources");
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );

    expect(screen.getByText("Product groups")).toBeInTheDocument();
    expect(screen.getByText("Proof materials")).toBeInTheDocument();
    expect(screen.getByText("Buying next step")).toBeInTheDocument();
    expect(screen.getByText("Replace before launch")).toBeInTheDocument();

    assertNoHeavyCatalogOrDeveloperDemoCopy();
  });

  it("does not render a duplicate header kicker below the breadcrumb", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(screen.queryByText("Products")).not.toBeInTheDocument();
  });

  it("does not expose market detail routes or blog CTA on the overview page", async () => {
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/resources");
    expect(hrefs).toContain("/contact");
    expect(hrefs).not.toContain("/blog");
    expect(hrefs).not.toContain("/products/north-america");
    expect(hrefs.some((href) => href?.startsWith("/products/"))).toBe(false);

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
