import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next-intl
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
  getTranslations: vi.fn(
    async () => (key: string) =>
      mockTranslations[key as keyof typeof mockTranslations] || key,
  ),
  setRequestLocale: vi.fn(),
}));

// Mock i18n routing
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

// Mock SEO metadata
vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: vi.fn(async () => ({
    title: "Products",
    description: "Products page",
  })),
}));

// Mock CatalogBreadcrumb
vi.mock("@/components/products/catalog-breadcrumb", () => ({
  CatalogBreadcrumb: () => <nav aria-label="breadcrumb">Breadcrumb</nav>,
  buildCatalogBreadcrumbJsonLd: vi.fn(async () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [],
  })),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
  JsonLdScript: () => <script type="application/ld+json" />,
}));

describe("Products Overview Page", () => {
  it("renders starter result capabilities and technical proof", async () => {
    const { default: ProductsPage } = await import("../page");
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(screen.getByText("Showcase-site foundation")).toBeInTheDocument();
    expect(screen.getByText("Content replacement surface")).toBeInTheDocument();
    expect(screen.getByText("Inquiry path")).toBeInTheDocument();
    expect(screen.getByText("Launch path")).toBeInTheDocument();
    expect(screen.getByText("Technical proof")).toBeInTheDocument();
    expect(
      screen.getByText("Cloudflare/OpenNext deployment path"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Starter, not a finished client website"),
    ).toBeInTheDocument();
  });

  it("keeps contact and blog as the product page actions", async () => {
    const { default: ProductsPage } = await import("../page");
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));

    expect(hrefs).toContain("/blog");
    expect(hrefs).toContain("/contact");
    expect(hrefs).not.toContain("/products/north-america");
  });

  it("renders breadcrumb", async () => {
    const { default: ProductsPage } = await import("../page");
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
  });
});
