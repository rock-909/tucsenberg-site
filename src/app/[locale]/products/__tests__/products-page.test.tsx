import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocaleParam } from "@/app/[locale]/generate-static-params";
import ProductsPage from "../page";

const { mockBuildCatalogBreadcrumbJsonLd, mockGetTranslations } = vi.hoisted(
  () => ({
    mockBuildCatalogBreadcrumbJsonLd: vi.fn(),
    mockGetTranslations: vi.fn(),
  }),
);

const mockTranslations = {
  "overview.title": "Starter product capabilities",
  "overview.description":
    "A showcase-site starter covering site structure, content replacement, inquiry flow, and launch foundation.",
  "overview.kicker": "What the starter includes",
  "overview.capabilitiesTitle": "Result capabilities",
  "overview.capabilitiesDescription":
    "The page explains what a project can start from before real content is replaced.",
  "starterCapabilities.siteFoundation.title": "Showcase-site foundation",
  "starterCapabilities.siteFoundation.description":
    "Home, Products, Blog, About, Contact, legal pages, navigation, and responsive layout are already connected.",
  "starterCapabilities.replacementSurface.title": "Content replacement surface",
  "starterCapabilities.replacementSurface.description":
    "Brand facts, page copy, product or service entries, SEO, images, and multilingual text have clear places to replace.",
  "starterCapabilities.inquiryPath.title": "Inquiry path",
  "starterCapabilities.inquiryPath.description":
    "The contact page, form flow, basic anti-abuse controls, and lead handling path are ready for a real owner.",
  "starterCapabilities.launchPath.title": "Launch path",
  "starterCapabilities.launchPath.description":
    "Cloudflare is the recommended deployment route, with optional compatibility kept secondary and traffic visibility treated as a real surface.",
  technicalProofTitle: "Technical proof",
  technicalProofDescription:
    "The starter includes the technical baseline a public demo needs without making the product page a developer manual.",
  "technicalProof.next.title": "Next.js app foundation",
  "technicalProof.next.description":
    "App Router, Server Components first, metadata, localized routes, and production build checks.",
  "technicalProof.cloudflare.title": "Cloudflare/OpenNext deployment path",
  "technicalProof.cloudflare.description":
    "Cloudflare and OpenNext stay the recommended deployment truth for this starter.",
  "technicalProof.i18n.title": "Multilingual content",
  "technicalProof.i18n.description":
    "English and Chinese navigation, page copy, metadata, and article content stay aligned.",
  "technicalProof.quality.title": "Quality checks",
  "technicalProof.quality.description":
    "Type, lint, content, component, website, and build checks remain part of the launch path.",
  "technicalProof.security.title": "Form security basics",
  "technicalProof.security.description":
    "Contact and inquiry paths include validation, anti-abuse controls, and explicit runtime configuration.",
  "technicalProof.traffic.title": "Traffic visibility",
  "technicalProof.traffic.description":
    "Owner-facing traffic information is treated as a real protected surface, not marketing decoration.",
  "boundary.title": "Starter, not a finished client website",
  "boundary.description":
    "Real launch still requires real content, images, contact details, legal copy, secrets, and deployment proof.",
  "boundary.items.content": "Replace real business content",
  "boundary.items.assets": "Replace real images and proof",
  "boundary.items.legal": "Review legal and contact details",
  "boundary.items.deployment": "Prove deployment and forms",
  "cta.title": "Ready to turn the starter into a public site?",
  "cta.description":
    "Use the launch articles or contact path to decide what must be replaced first.",
  "cta.blog": "Learn how to start",
  "cta.contact": "Contact",
} as const;

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
  buildCatalogBreadcrumbJsonLd: mockBuildCatalogBreadcrumbJsonLd,
}));

vi.mock("@/components/seo", () => ({
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

// Render helper for async Server Components
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
    mockGetTranslations.mockImplementation(
      async () => (key: string) =>
        mockTranslations[key as keyof typeof mockTranslations] || key,
    );
    mockBuildCatalogBreadcrumbJsonLd.mockResolvedValue({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    });
  });

  describe("Scenario 2.1: Visitor sees starter result capabilities", () => {
    it("renders the result capabilities section heading", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(screen.getByText("Result capabilities")).toBeInTheDocument();
    });

    it("renders all four starter capability cards", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(screen.getByText("Showcase-site foundation")).toBeInTheDocument();
      expect(
        screen.getByText("Content replacement surface"),
      ).toBeInTheDocument();
      expect(screen.getByText("Inquiry path")).toBeInTheDocument();
      expect(screen.getByText("Launch path")).toBeInTheDocument();
    });

    it("does not render market overview cards on the starter capabilities page", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        document.querySelector('[data-testid^="market-card-"]'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Primary Offer Example"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Scenario 2.2: Visitor sees technical proof and launch boundary", () => {
    it("renders the technical proof section", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(screen.getByText("Technical proof")).toBeInTheDocument();
      expect(
        screen.getByText("Cloudflare/OpenNext deployment path"),
      ).toBeInTheDocument();
      expect(screen.getByText("Quality checks")).toBeInTheDocument();
      expect(screen.getByText("Traffic visibility")).toBeInTheDocument();
    });

    it("renders the honest launch boundary", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByText("Starter, not a finished client website"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Replace real business content"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Prove deployment and forms"),
      ).toBeInTheDocument();
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

  describe("Scenario 2.3: Breadcrumb shows root level (no market)", () => {
    it("renders breadcrumb without a market argument", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      // The mocked CatalogBreadcrumb renders with data-testid="breadcrumb"
      const breadcrumb = screen.getByTestId("breadcrumb");
      expect(breadcrumb).toBeInTheDocument();
      expect(breadcrumb).toHaveTextContent("Products");
    });
  });

  describe("Scenario 2.4: Page header", () => {
    it("renders the h1 page title", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Starter product capabilities");
    });

    it("renders the page description", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByText(
          "A showcase-site starter covering site structure, content replacement, inquiry flow, and launch foundation.",
        ),
      ).toBeInTheDocument();
    });

    it("renders links to blog education and contact", async () => {
      await renderAsyncComponent(
        ProductsPage({ params: Promise.resolve(mockParams) }),
      );

      expect(
        screen.getByRole("link", { name: "Learn how to start" }),
      ).toHaveAttribute("href", "/blog");
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

      expect(screen.getByText("Showcase-site foundation")).toBeInTheDocument();
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
          mockTranslations[key as keyof typeof mockTranslations] || key,
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
