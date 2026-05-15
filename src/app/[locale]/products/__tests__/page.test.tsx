import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next-intl
const mockTranslations = {
  "overview.title": "Membrane compatibility paths",
  "overview.description":
    "Tucsenberg is preparing membrane family, OEM-family compatibility, material guidance, and RFQ intake surfaces for owner confirmation.",
  "overview.kicker": "What Tucsenberg is preparing",
  "overview.capabilitiesTitle": "Review capabilities",
  "overview.capabilitiesDescription":
    "This page explains what buyers can prepare before owner-confirmed product and compatibility data lands.",
  "starterCapabilities.siteFoundation.title": "Membrane site foundation",
  "starterCapabilities.siteFoundation.description":
    "Membranes, compatibility, materials, quote, legal, navigation, and responsive layout surfaces are already connected.",
  "starterCapabilities.replacementSurface.title":
    "Compatibility review surface",
  "starterCapabilities.replacementSurface.description":
    "OEM family, part number, page copy, SEO, images, and multilingual text have clear places to become Tucsenberg facts.",
  "starterCapabilities.inquiryPath.title": "RFQ path",
  "starterCapabilities.inquiryPath.description":
    "Contact and quote foundations are ready for a real Tucsenberg intake workflow.",
  "starterCapabilities.launchPath.title": "Launch path",
  "starterCapabilities.launchPath.description":
    "Cloudflare stays the deployment path while compatibility and lead proof become real launch surfaces.",
  technicalProofTitle: "Technical proof",
  technicalProofDescription:
    "The site keeps the technical baseline Tucsenberg needs without turning membrane pages into developer pages.",
  "technicalProof.next.title": "Next.js app foundation",
  "technicalProof.next.description":
    "App Router, Server Components first, metadata, localized routes, and production build checks.",
  "technicalProof.cloudflare.title": "Cloudflare/OpenNext deployment path",
  "technicalProof.cloudflare.description":
    "Cloudflare and OpenNext are the recommended deployment truth for this site.",
  "technicalProof.i18n.title": "Multilingual content",
  "technicalProof.i18n.description":
    "English, Spanish, and internal Chinese navigation, page copy, metadata, and article content stay aligned.",
  "technicalProof.quality.title": "Quality checks",
  "technicalProof.quality.description":
    "Type, lint, content, component, website, and build checks remain part of the launch path.",
  "technicalProof.security.title": "Form security basics",
  "technicalProof.security.description":
    "Contact and inquiry paths include validation, anti-abuse controls, and explicit runtime configuration.",
  "technicalProof.traffic.title": "Traffic visibility",
  "technicalProof.traffic.description":
    "Owner-facing traffic information is treated as a real protected surface, not marketing decoration.",
  "boundary.title":
    "Tucsenberg work-in-progress, not a finished product catalog",
  "boundary.description":
    "Real launch still requires owner-confirmed product data, images, contact details, legal copy, secrets, and deployment proof.",
  "boundary.items.content": "Replace with confirmed membrane content",
  "boundary.items.assets": "Replace with confirmed images and proof",
  "boundary.items.legal": "Review legal and contact details",
  "boundary.items.deployment": "Prove deployment and forms",
  "cta.title": "Ready to prepare a membrane review?",
  "cta.description":
    "Use the quote path or supporting content to decide what product evidence to collect first.",
  "cta.blog": "Learn how to prepare",
  "cta.contact": "Prepare quote inputs",
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
  it("renders Tucsenberg review capabilities and technical proof", async () => {
    const { default: ProductsPage } = await import("../page");
    const page = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
    });
    render(page);

    expect(screen.getByText("Membrane site foundation")).toBeInTheDocument();
    expect(
      screen.getByText("Compatibility review surface"),
    ).toBeInTheDocument();
    expect(screen.getByText("RFQ path")).toBeInTheDocument();
    expect(screen.getByText("Launch path")).toBeInTheDocument();
    expect(screen.getByText("Technical proof")).toBeInTheDocument();
    expect(
      screen.getByText("Cloudflare/OpenNext deployment path"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Tucsenberg work-in-progress, not a finished product catalog",
      ),
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
