import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SINGLE_SITE_HOME_SECTION_ORDER } from "@/config/single-site-page-expression";
import Home, { generateMetadata, generateStaticParams } from "../page";

type MockLinkHref = string | { pathname: string };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

const homeMessages: Record<string, string> = {
  "hero.eyebrow": "Modern B2B showcase starter",
  "hero.title":
    "Present products, applications, and delivery proof in one clear B2B website.",
  "hero.subtitle":
    "Use this starter to organize product families, application fit, proof points, and inquiry paths before a real company replaces the example content.",
  "hero.cta.primary": "View product systems",
  "hero.cta.secondary": "Plan an inquiry",
  "hero.diagram.panelLabel": "Product principle",
  "hero.diagram.ariaLabel": "Working-principle line drawing",
  "hero.diagram.caption": "How the product works, in one drawing.",
  "hero.proof.quoteSla": "Standard items",
  "hero.proof.quoteSlaLabel": "reply within 12 hours",
  "hero.proof.warranty": "3-year warranty",
  "hero.proof.warrantyLabel": "on all standard lines",
  "hero.proof.factoryPool": "Factory pool",
  "hero.proof.factoryPoolLabel": "supplies established brands",
  "hero.proof.oem": "OEM",
  "hero.proof.oemLabel": "private label ready",
  "productLines.title": "Five product lines",
  "productLines.description": "Product-line sentinel description.",
  "productLines.items.absFloodBarriers.title":
    "ABS Interlocking Boxwall — TB-BW series",
  "productLines.items.absFloodBarriers.description": "ABS description",
  "productLines.items.absFloodBarriers.linkLabel": "Explore ABS barriers",
  "productLines.items.aluminumFloodGates.title":
    "Aluminum Flood Gates — TB-AG series",
  "productLines.items.aluminumFloodGates.description": "Gate description",
  "productLines.items.aluminumFloodGates.linkLabel": "Explore flood gates",
  "productLines.items.absorbentFloodBags.title":
    "Absorbent Flood Bags — TB-FB series",
  "productLines.items.absorbentFloodBags.description": "Bag description",
  "productLines.items.absorbentFloodBags.linkLabel": "Explore flood bags",
  "productLines.items.floodTubeDams.title":
    "Water & Air-Filled Tube Dams — TB-TD series",
  "productLines.items.floodTubeDams.description": "Tube description",
  "productLines.items.floodTubeDams.linkLabel": "Explore tube dams",
  "productLines.items.frpFloodBarriers.title":
    "FRP Composite Planks — TB-CP series",
  "productLines.items.frpFloodBarriers.description": "FRP description",
  "productLines.items.frpFloodBarriers.linkLabel": "Register interest",
  "productLines.items.frpFloodBarriers.badge": "New — register interest",
  "buyerSegments.title": "Who we supply",
  "buyerSegments.description": "Buyer segment sentinel description.",
  "buyerSegments.items.dealersDistributors.title": "Dealers & Distributors",
  "buyerSegments.items.dealersDistributors.description": "Dealer description",
  "buyerSegments.items.importersBrands.title": "Importers & Brands (OEM)",
  "buyerSegments.items.importersBrands.description": "Importer description",
  "buyerSegments.items.contractorsProjects.title": "Contractors & Projects",
  "buyerSegments.items.contractorsProjects.description":
    "Contractor description",
  "buyerSegments.items.smallBusinessBuyers.title": "Small Business Buyers",
  "buyerSegments.items.smallBusinessBuyers.description":
    "Small-business description",
  "buyingProcess.title": "How we work",
  "buyingProcess.description": "Buying process sentinel description.",
  "buyingProcess.items.sendRfq.title": "Send your RFQ",
  "buyingProcess.items.sendRfq.description": "RFQ description",
  "buyingProcess.items.quoteResponse.title": "Reply within 12 hours",
  "buyingProcess.items.quoteResponse.description": "Quote description",
  "buyingProcess.items.paidSample.title": "Paid sample",
  "buyingProcess.items.paidSample.description": "Sample description",
  "buyingProcess.items.productionQc.title": "Production & QC",
  "buyingProcess.items.productionQc.description": "Production description",
  "buyingProcess.items.shipment.title": "Ship carton to container",
  "buyingProcess.items.shipment.description": "Shipment description",
  "howToChoose.title": "How to choose",
  "howToChoose.description": "Three questions settle most cases:",
  "howToChoose.columns.situation": "Your situation",
  "howToChoose.columns.startWith": "Start with",
  "howToChoose.rows.openings.situation": "Garage doors",
  "howToChoose.rows.openings.startWith": "Aluminum flood gates",
  "howToChoose.rows.perimeters.situation": "Perimeters",
  "howToChoose.rows.perimeters.startWith": "ABS boxwall",
  "howToChoose.rows.emergency.situation": "Emergency stock",
  "howToChoose.rows.emergency.startWith": "Flood bags",
  "howToChoose.rows.longRuns.situation": "Long runs",
  "howToChoose.rows.longRuns.startWith": "Tube dams",
  "howToChoose.rows.coastal.situation": "Coastal sites",
  "howToChoose.rows.coastal.startWith": "FRP planks",
  "howToChoose.honestNote": "One honest note before you buy anything.",
  "howToChoose.guideLink": "Full comparison guide",
  "faq.title": "Frequently asked questions",
  "faq.items.minimumOrder.question": "What is your minimum order?",
  "faq.items.minimumOrder.answer": "It depends on the line.",
  "faq.items.quoteSpeed.question": "How fast will I get a price?",
  "faq.items.quoteSpeed.answer": "We reply within 12 hours.",
  "faq.items.paymentTerms.question": "What are your payment terms?",
  "faq.items.paymentTerms.answer": "30% deposit, 70% before shipment.",
  "faq.items.samples.question": "Can I get samples?",
  "faq.items.samples.answer": "Yes — paid samples plus freight.",
  "faq.items.oem.question": "Do you offer OEM / private label?",
  "faq.items.oem.answer": "On every line.",
  "faq.items.warranty.question": "What warranty do you give?",
  "faq.items.warranty.answer": "3 years on materials and workmanship.",
  "faq.items.leadTime.question": "What's the lead time?",
  "faq.items.leadTime.answer": "In-stock configurations ship in 2–7 days.",
  "faq.items.madeInChina.question": "You're made in China — how do I know?",
  "faq.items.madeInChina.answer": "Judge us by the sample and the spec sheet.",
  "faq.items.audit.question": "Can we audit the factories?",
  "faq.items.audit.answer": "Yes — factory audits are welcome.",
  "verify.title": "Check us before you trust us",
  "verify.description": "Three ways to verify this supplier before ordering.",
  "verify.items.audits.title": "Factory audits welcome",
  "verify.items.audits.description": "In person or live video walk-through.",
  "verify.items.samples.title": "Paid samples before volume",
  "verify.items.samples.description": "Judge the product, not the website.",
  "verify.items.inspection.title": "Third-party inspection accepted",
  "verify.items.inspection.description": "Appoint your own inspection agent.",
  "verify.aboutLink": "[Who you're actually buying from →](/about)",
  "finalCta.title":
    "Start from a real website foundation, then replace what must become yours.",
  "finalCta.description":
    "Review what the starter includes, or use the contact route as the quick path for the next real setup conversation.",
  "finalCta.primary": "Request a Quote",
  "finalCta.secondary": "Wholesale & OEM",
};

const mockGetSingleSiteHomeLinkTargets = vi.hoisted(() =>
  vi.fn(() => ({
    contact: "/contact",
    products: "/products",
    requestQuote: "/request-quote",
    oemWholesale: "/oem-wholesale",
    primaryCta: "/request-quote",
    secondaryCta: "/oem-wholesale",
  })),
);

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "zh"],
    defaultLocale: "en",
  },
  Link: ({ children, href, ...props }: MockLinkProps) => (
    <a href={typeof href === "string" ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/config/single-site-links", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/config/single-site-links")>()),
  getSingleSiteHomeLinkTargets: mockGetSingleSiteHomeLinkTargets,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => {
    const value = homeMessages[key];
    if (value === undefined) {
      throw new Error(`Missing home test message: ${key}`);
    }
    return value;
  }),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/components/seo/json-ld-script", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
  JsonLdScript: () => <script type="application/ld+json" />,
}));

vi.mock("@/components/sections/hero-section", () => ({
  HeroSection: () => (
    <section data-testid="hero-section">
      <h1>
        Present products, applications, and delivery proof in one clear B2B
        website.
      </h1>
      <figure data-testid="hero-diagram">
        <figcaption>How the product works, in one drawing.</figcaption>
      </figure>
    </section>
  ),
}));

describe("Home Page", () => {
  beforeEach(() => {
    mockGetSingleSiteHomeLinkTargets.mockReturnValue({
      contact: "/contact",
      products: "/products",
      requestQuote: "/request-quote",
      oemWholesale: "/oem-wholesale",
      primaryCta: "/request-quote",
      secondaryCta: "/oem-wholesale",
    });
  });

  describe("generateStaticParams", () => {
    it("should return params for all locales", () => {
      const params = generateStaticParams();
      expect(params).toEqual([{ locale: "en" }, { locale: "zh" }]);
    });
  });

  describe("generateMetadata", () => {
    it("uses the owner-approved source meta description, not the hero subtitle", async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: "en" }),
      });

      expect(metadata.title).toBe(
        "Flood Barrier Manufacturer & Supplier from China | Tucsenberg",
      );
      expect(metadata.description).toBe(
        "Factory-direct flood barriers from China: ABS boxwall, aluminum flood gates, sandless flood bags and tube dams. OEM & private label. Reply within 12 hours.",
      );
      expect(metadata.description).not.toBe(homeMessages["hero.subtitle"]);
    });
  });

  describe("Home Component", () => {
    it("should explain the B2B evaluation copy across the homepage sections", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /products, applications, and delivery proof/,
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("home-product-lines-section"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("home-buyer-segments-section"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("home-buying-process-section"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("home-final-action")).toBeInTheDocument();
      const productLinesSection = within(
        screen.getByTestId("home-product-lines-section"),
      );
      expect(
        productLinesSection.getByText(
          "ABS Interlocking Boxwall — TB-BW series",
        ),
      ).toBeInTheDocument();
      expect(
        productLinesSection.getByText("Aluminum Flood Gates — TB-AG series"),
      ).toBeInTheDocument();
      expect(
        productLinesSection.getByText("Absorbent Flood Bags — TB-FB series"),
      ).toBeInTheDocument();
      const buyerSegmentsSection = within(
        screen.getByTestId("home-buyer-segments-section"),
      );
      expect(
        buyerSegmentsSection.getByText("Dealers & Distributors"),
      ).toBeInTheDocument();
      expect(
        buyerSegmentsSection.getByText("Importers & Brands (OEM)"),
      ).toBeInTheDocument();
      expect(
        buyerSegmentsSection.getByText("Contractors & Projects"),
      ).toBeInTheDocument();
      const heroSection = within(screen.getByTestId("hero-section"));
      expect(heroSection.getByTestId("hero-diagram")).toBeInTheDocument();
      expect(
        heroSection.getByText("How the product works, in one drawing."),
      ).toBeInTheDocument();
      expect(
        heroSection.queryByTestId("hero-preview-card"),
      ).not.toBeInTheDocument();
      const verifySection = within(screen.getByTestId("home-verify-section"));
      expect(
        verifySection.getByText("Factory audits welcome"),
      ).toBeInTheDocument();
    });

    it("renders homepage sections in the configured page-expression order", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      const { container } = render(HomeComponent);

      const sectionTestIds = {
        hero: "hero-section",
        productLines: "home-product-lines-section",
        howToChoose: "home-how-to-choose-section",
        buyingProcess: "home-buying-process-section",
        buyerSegments: "home-buyer-segments-section",
        verify: "home-verify-section",
        faq: "home-faq-section",
        finalCta: "home-final-action",
      } as const;
      const expectedOrder = SINGLE_SITE_HOME_SECTION_ORDER.map(
        (section) => sectionTestIds[section],
      );
      const sectionSelector = expectedOrder
        .map((testId) => `[data-testid="${testId}"]`)
        .join(",");
      const renderedOrder = Array.from(
        container.querySelectorAll<HTMLElement>(sectionSelector),
      ).map((section) => section.dataset.testid);

      expect(renderedOrder).toEqual(expectedOrder);
    });

    it("keeps final CTA labels attached to matching route meanings", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      const finalAction = within(screen.getByTestId("home-final-action"));
      expect(
        finalAction.getByRole("link", { name: "Request a Quote" }),
      ).toHaveAttribute("href", "/request-quote");
      expect(
        finalAction.getByRole("link", { name: "Wholesale & OEM" }),
      ).toHaveAttribute("href", "/oem-wholesale");
    });

    it("does not reuse product or about labels when a thin profile only has contact", async () => {
      mockGetSingleSiteHomeLinkTargets.mockReturnValue({
        contact: "/contact",
        about: "/about",
        primaryCta: "/contact",
        secondaryCta: "/about",
      });
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      const finalAction = within(screen.getByTestId("home-final-action"));
      expect(
        finalAction.getByRole("link", { name: "Request a Quote" }),
      ).toHaveAttribute("href", "/contact");
      expect(
        finalAction.queryByRole("link", { name: "Wholesale & OEM" }),
      ).not.toBeInTheDocument();
      expect(
        finalAction.queryByRole("link", { name: "About" }),
      ).not.toBeInTheDocument();
    });

    it("keeps the first supporting sections structured as B2B proof panels", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      const productLinesSection = screen.getByTestId(
        "home-product-lines-section",
      );
      const buyerSegmentsSection = screen.getByTestId(
        "home-buyer-segments-section",
      );
      const buyingProcessSection = screen.getByTestId(
        "home-buying-process-section",
      );

      expect(productLinesSection).toHaveClass("section-divider");
      expect(buyerSegmentsSection).toHaveClass("section-divider");
      expect(buyingProcessSection).toHaveClass("section-divider");

      const productLineArticles =
        within(productLinesSection).getAllByRole("article");
      expect(productLineArticles[0]).toHaveClass("surface-card");

      const buyerSegmentsProofPanel = within(buyerSegmentsSection).getByTestId(
        "home-buyer-segments-proof-panel",
      );
      expect(buyerSegmentsProofPanel).not.toHaveClass("surface-card");
      expect(buyerSegmentsProofPanel).toHaveClass("grid");
      expect(
        within(buyerSegmentsProofPanel).getAllByTestId(
          "home-buyer-segments-proof-item",
        )[0],
      ).toHaveClass("rounded-xl");

      const buyingProcessList = within(buyingProcessSection).getByRole("list");
      expect(buyingProcessList).toHaveClass("divide-y");
      expect(buyingProcessList).not.toHaveClass("grid");
      expect(
        within(buyingProcessList).getAllByTestId(
          "home-buying-process-step-badge",
        )[0],
      ).toHaveClass("rounded-full");
    });

    it("should have correct container classes", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      const { container } = render(HomeComponent);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass(
        "min-h-dvh",
        "bg-background",
        "text-foreground",
      );
    });

    it("should be an async server component", async () => {
      const result = Home({ params: Promise.resolve({ locale: "en" }) });
      expect(result).toBeInstanceOf(Promise);
    });

    it("should handle delayed params resolution", async () => {
      const delayedParams = new Promise<{ locale: "en" | "zh" }>((resolve) =>
        setTimeout(() => resolve({ locale: "en" }), 10),
      );

      const HomeComponent = await Home({ params: delayedParams });
      expect(HomeComponent).toBeDefined();
    });

    it("should handle params rejection", async () => {
      const rejectedParams = Promise.reject(new Error("Params error"));

      await expect(Home({ params: rejectedParams })).rejects.toThrow(
        "Params error",
      );
    });
  });
});
