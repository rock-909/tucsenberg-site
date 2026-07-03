import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocaleParam } from "@/app/[locale]/generate-static-params";
import ProductsPage from "../page";
import {
  assertNoHeavyCatalogOrDeveloperDemoCopy,
  createCatalogTranslator,
  mockCatalogTranslationsEn,
} from "./mocks/products-test-fixtures";

const {
  mockBuildCatalogBreadcrumbJsonLd,
  mockGetTranslations,
  mockGetRuntimeMessageProfileId,
} = vi.hoisted(() => ({
  mockBuildCatalogBreadcrumbJsonLd: vi.fn(),
  mockGetTranslations: vi.fn(),
  mockGetRuntimeMessageProfileId: vi.fn(() => "showcase-full"),
}));

vi.mock("@/config/active-starter-profile", () => ({
  getRuntimeMessageProfileId: mockGetRuntimeMessageProfileId,
}));

vi.mock("@/config/single-site-seo", () => ({
  hasSingleSiteDynamicSurface: vi.fn(() => false),
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

vi.mock("@/components/products/catalog-breadcrumb", () => ({
  CatalogBreadcrumb: () => <nav data-testid="breadcrumb">Products</nav>,
}));

vi.mock("@/components/products/catalog-breadcrumb-jsonld", () => ({
  buildCatalogBreadcrumbJsonLd: mockBuildCatalogBreadcrumbJsonLd,
}));

vi.mock("@/components/seo/json-ld-script", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
  JsonLdScript: () => <script type="application/ld+json" />,
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    sizes: _sizes,
    className,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    className?: string;
  }) => (
    // img is acceptable in a test stub — next/image is not available in vitest jsdom
    <img src={src} alt={alt} className={className} />
  ),
}));

vi.mock("@/app/[locale]/generate-static-params", () => ({
  generateLocaleStaticParams: () => [{ locale: "en" }, { locale: "zh" }],
}));

async function renderAsyncComponent(
  component: Promise<React.JSX.Element> | React.JSX.Element,
) {
  const resolved = await Promise.resolve(component);
  return render(resolved);
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((settle) => {
    resolve = settle;
  });

  return { promise, resolve };
}

async function flushPendingMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("Feature: Product Overview Page", () => {
  const mockParams: LocaleParam = { locale: "en" };
  const RETIRED_BENDING_MACHINES_PATH = "/capabilities/bending-machines";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRuntimeMessageProfileId.mockReturnValue("showcase-full");
    mockGetTranslations.mockImplementation(
      async ({ locale }: { locale: string }) => createCatalogTranslator(locale),
    );
    mockBuildCatalogBreadcrumbJsonLd.mockResolvedValue({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    });
  });

  describe("Scenario 2.1: Visitor sees light product overview cards", () => {
    it("renders the overview cards section heading", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByText("What visitors should learn here"),
      ).toBeInTheDocument();
    });

    it("renders all three product overview cards", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(screen.getByText("Product groups")).toBeInTheDocument();
      expect(screen.getByText("Proof materials")).toBeInTheDocument();
      expect(screen.getByText("Buying next step")).toBeInTheDocument();
    });

    it("does not render market overview cards or heavy catalog demo copy", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        document.querySelector('[data-testid^="market-card-"]'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Primary Offer Example"),
      ).not.toBeInTheDocument();

      assertNoHeavyCatalogOrDeveloperDemoCopy();
    });
  });

  describe("Scenario 2.1b: Prioritized product-system composition leads to inquiry", () => {
    it("renders one lead product-system card ahead of supporting proof and next-step cards", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      const leadHeading = screen.getByRole("heading", {
        level: 3,
        name: "Product groups",
      });
      const proofHeading = screen.getByRole("heading", {
        level: 3,
        name: "Proof materials",
      });
      const nextStepHeading = screen.getByRole("heading", {
        level: 3,
        name: "Buying next step",
      });

      // Lead explanation comes first, then supporting proof/next-step cards.
      expect(
        leadHeading.compareDocumentPosition(proofHeading) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(
        proofHeading.compareDocumentPosition(nextStepHeading) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("shows application and fit supporting text near the products before the inquiry CTA", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      // Application/proof routing guidance sits between the products and the CTA.
      expect(
        screen.getByText(
          "Help visitors understand the offer families before they ask for specifics.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Ask for fit")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Move visitors to contact when they need pricing, availability, or project fit.",
        ),
      ).toBeInTheDocument();

      // The path ends at an inquiry CTA whose href resolves to the contact route.
      const contactLink = screen.getByRole("link", { name: "Contact" });
      expect(contactLink.getAttribute("href")).toBe("/contact");
      expect(contactLink.getAttribute("href")).toMatch(/\/contact$/);
    });
  });

  describe("Scenario 2.2: Visitor sees replacement boundary", () => {
    it("renders the honest launch boundary", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(screen.getByText("Replace before launch")).toBeInTheDocument();
      expect(
        screen.getByText("Replace product names and descriptions"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Add real availability, pricing, or quote rules"),
      ).toBeInTheDocument();

      assertNoHeavyCatalogOrDeveloperDemoCopy();
    });

    it("does not render the retired equipment card", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.queryByText("overview.equipmentTitle"),
      ).not.toBeInTheDocument();
      expect(
        document.querySelector(`a[href="${RETIRED_BENDING_MACHINES_PATH}"]`),
      ).not.toBeInTheDocument();
    });
  });

  describe("Scenario 2.2b: Visitor sees product overview routing guidance", () => {
    it("renders the reusable product overview path and detail-page upgrade guidance", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "How this overview should work",
        }),
      ).toBeInTheDocument();
      expect(screen.getByText("Scan product groups")).toBeInTheDocument();
      expect(screen.getByText("Check proof materials")).toBeInTheDocument();
      expect(screen.getByText("Ask for fit")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Use detail pages only when needed",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Real product families and priorities are confirmed"),
      ).toBeInTheDocument();
    });

    it("keeps the overview guidance lightweight without detail links or downloads", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      const hrefs = screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"));

      expect(hrefs).toEqual(expect.arrayContaining(["/resources", "/contact"]));
      expect(hrefs.some((href) => href?.startsWith("/products/"))).toBe(false);
      expect(hrefs.some((href) => href?.includes("download"))).toBe(false);
      expect(hrefs.some((href) => href?.endsWith(".pdf"))).toBe(false);
      expect(hrefs.some((href) => href?.startsWith("/api/"))).toBe(false);
      expect(hrefs.some((href) => href?.includes("login"))).toBe(false);
    });
  });

  describe("Scenario 2.3: Breadcrumb shows root level (no market)", () => {
    it("renders breadcrumb without a market argument", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      const breadcrumb = screen.getByTestId("breadcrumb");
      expect(breadcrumb).toBeInTheDocument();
      expect(breadcrumb).toHaveTextContent("Products");
    });
  });

  describe("Scenario 2.4: Page header and CTAs", () => {
    it("renders the h1 page title", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByRole("heading", { level: 1, name: "Product overview" }),
      ).toBeInTheDocument();
    });

    it("does not repeat the product label as a header kicker below the breadcrumb", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(screen.getAllByText("Products")).toHaveLength(1);
    });

    it("renders the page description", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByText(
          "Use this page to introduce the main product lines or offer groups visitors should understand before they contact you.",
        ),
      ).toBeInTheDocument();
    });

    it("renders resources and contact CTAs without blog cross-link", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByRole("link", { name: "View resources" }),
      ).toHaveAttribute("href", "/resources");
      expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
        "href",
        "/contact",
      );

      const hrefs = screen
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"));

      expect(hrefs).not.toContain("/blog");
      expect(hrefs).not.toContain("/products/north-america");
      expect(hrefs.some((href) => href?.startsWith("/products/"))).toBe(false);
    });

    it("renders contact only when the active profile excludes resources", async () => {
      mockGetRuntimeMessageProfileId.mockReturnValueOnce("catalog");

      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.queryByRole("link", { name: "View resources" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
        "href",
        "/contact",
      );
    });
  });

  describe("Scenario 2.5: Async Server Component contract", () => {
    it("is an async server component (returns a Promise)", () => {
      const result = ProductsPage({ params: Promise.resolve(mockParams) });
      expect(result).toBeInstanceOf(Promise);
    });

    it("handles zh locale", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve({ locale: "zh" }) }),
      );

      expect(
        screen.getByRole("heading", { level: 1, name: "产品概览" }),
      ).toBeInTheDocument();

      assertNoHeavyCatalogOrDeveloperDemoCopy();
    });
  });

  describe("Scenario 2.6: Independent server work starts together", () => {
    it("starts translations and breadcrumb schema generation before either result resolves", async () => {
      const translations = createDeferred<(key: string) => string>();
      const breadcrumbSchema = createDeferred<Record<string, unknown>>();
      mockGetTranslations.mockReturnValueOnce(translations.promise);
      mockBuildCatalogBreadcrumbJsonLd.mockReturnValueOnce(
        breadcrumbSchema.promise,
      );

      const page = ProductsPage({ params: Promise.resolve(mockParams) });

      await flushPendingMicrotasks();

      expect(mockGetTranslations).toHaveBeenCalledWith({
        locale: "en",
        namespace: "catalog",
      });
      expect(mockBuildCatalogBreadcrumbJsonLd).toHaveBeenCalledWith({});

      translations.resolve(
        (key: string) =>
          mockCatalogTranslationsEn[
            key as keyof typeof mockCatalogTranslationsEn
          ] || key,
      );
      breadcrumbSchema.resolve({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [],
      });
      await page;
    });
  });
});
