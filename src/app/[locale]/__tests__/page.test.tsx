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
  "hero.preview.label": "Buyer evaluation map",
  "hero.preview.title": "A clearer path from product fit to inquiry",
  "hero.preview.description":
    "The first screens help buyers understand what is offered, where it fits, what supports delivery, and how to prepare the next request.",
  "hero.preview.productSystem": "Product system",
  "hero.preview.applicationFit": "Application fit",
  "hero.preview.deliveryProof": "Delivery proof",
  "hero.preview.inquiryPath": "Inquiry path",
  "hero.preview.note": "Replace example content before launch",
  "hero.proof.est": "Product",
  "hero.proof.estLabel": "systems",
  "hero.proof.countries": "Application",
  "hero.proof.countriesLabel": "fit",
  "hero.proof.range": "Delivery",
  "hero.proof.rangeLabel": "proof",
  "hero.proof.production": "Inquiry",
  "hero.proof.productionLabel": "ready",
  "problems.title": "B2B buyers need proof close to each claim.",
  "problems.description":
    "The first screens should help a buyer judge product fit, application fit, and delivery confidence before they decide to contact the company.",
  "problems.items.structure.title": "Product fit",
  "problems.items.structure.description":
    "Show product families, service lines, and detail paths so visitors can see whether the offer covers their need.",
  "problems.items.content.title": "Application fit",
  "problems.items.content.description":
    "Connect the offer to use cases, operating constraints, and buyer questions instead of only showing generic cards.",
  "problems.items.deployment.title": "Delivery confidence",
  "problems.items.deployment.description":
    "Place response paths, standards, workflow, and proof slots near the claims they support.",
  "problems.items.inquiry.title": "Inquiry readiness",
  "problems.items.inquiry.description":
    "Make the next step clear so a buyer knows what to review before sending a request.",
  "problems.items.multilingual.title": "Multilingual review",
  "problems.items.multilingual.description":
    "Keep English and Chinese copy parallel so international buyers see the same decision path.",
  "answer.title":
    "The starter turns those buyer questions into reusable website sections.",
  "answer.description":
    "It keeps the first screens focused on products, applications, delivery proof, and inquiry next steps while leaving every example easy to replace.",
  "answer.items.pageStructure.title": "Product system sections",
  "answer.items.pageStructure.description":
    "Use categories, overview cards, detail pages, and resource links to explain the offer without building a product tile wall.",
  "answer.items.replacementSurface.title": "Application story sections",
  "answer.items.replacementSurface.description":
    "Use scenarios, constraints, and fit notes to show where the product or service belongs.",
  "answer.items.inquiryPath.title": "Delivery and quality proof",
  "answer.items.inquiryPath.description":
    "Use response paths, standards, workflow notes, and evidence slots without inventing fake customers or certifications.",
  "answer.items.cloudflareFoundation.title": "Inquiry path",
  "answer.items.cloudflareFoundation.description":
    "Keep contact and product routes connected so evaluation can turn into a prepared inquiry.",
  "startPath.title": "A practical path from starter to public launch.",
  "startPath.description":
    "Use this demo as the beginning of the site, then replace the parts that must belong to the real owner.",
  "startPath.items.brand.title": "Replace brand facts",
  "startPath.items.brand.description":
    "Company name, domain, logo, colors, contact details, and legal identity become real owner-confirmed facts.",
  "startPath.items.content.title": "Replace page content",
  "startPath.items.content.description":
    "Home, product or service copy, proof assets, blog guidance, images, and legal pages become real launch content.",
  "startPath.items.forms.title": "Connect forms",
  "startPath.items.forms.description":
    "Contact submissions, email delivery, anti-abuse checks, and response ownership point to real accounts.",
  "startPath.items.deploy.title": "Deploy and verify",
  "startPath.items.deploy.description":
    "Cloudflare preview, form canary, traffic visibility, and owner signoff prove readiness separately from local checks.",
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
  getTranslations: vi.fn(() => (key: string) => homeMessages[key] ?? key),
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
      <span>Product system</span>
      <span>Application fit</span>
      <span>Delivery proof</span>
      <span>Inquiry path</span>
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
        "Factory-direct flood barriers from China: ABS boxwall, aluminum flood gates, sandless flood bags and tube dams. OEM & private label. Quotes in 12 hours.",
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
      expect(screen.getByTestId("home-problem-section")).toBeInTheDocument();
      expect(screen.getByTestId("home-answer-section")).toBeInTheDocument();
      expect(screen.getByTestId("home-start-path-section")).toBeInTheDocument();
      expect(screen.getByTestId("home-final-action")).toBeInTheDocument();
      const problemSection = within(screen.getByTestId("home-problem-section"));
      expect(problemSection.getByText("Product fit")).toBeInTheDocument();
      expect(problemSection.getByText("Application fit")).toBeInTheDocument();
      expect(
        problemSection.getByText("Delivery confidence"),
      ).toBeInTheDocument();
      const answerSection = within(screen.getByTestId("home-answer-section"));
      expect(
        answerSection.getByText("Product system sections"),
      ).toBeInTheDocument();
      expect(
        answerSection.getByText("Application story sections"),
      ).toBeInTheDocument();
      expect(
        answerSection.getByText("Delivery and quality proof"),
      ).toBeInTheDocument();
      const heroSection = within(screen.getByTestId("hero-section"));
      expect(heroSection.getByText("Product system")).toBeInTheDocument();
      expect(heroSection.getByText("Application fit")).toBeInTheDocument();
      expect(heroSection.getByText("Delivery proof")).toBeInTheDocument();
      expect(heroSection.getByText("Inquiry path")).toBeInTheDocument();
    });

    it("renders homepage sections in the configured page-expression order", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      const { container } = render(HomeComponent);

      const sectionTestIds = {
        hero: "hero-section",
        problems: "home-problem-section",
        howToChoose: "home-how-to-choose-section",
        answer: "home-answer-section",
        startPath: "home-start-path-section",
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

      const problemSection = screen.getByTestId("home-problem-section");
      const answerSection = screen.getByTestId("home-answer-section");
      const startPathSection = screen.getByTestId("home-start-path-section");

      expect(problemSection).toHaveClass("section-divider");
      expect(answerSection).toHaveClass("section-divider");
      expect(startPathSection).toHaveClass("section-divider");

      const problemArticles = within(problemSection).getAllByRole("article");
      expect(problemArticles[0]).toHaveClass("surface-card");

      // Rhythm over uniformity: proof items are an open bordered grid (no
      // nested panel card), and the step list runs as an open divided list.
      const answerProofPanel = within(answerSection).getByTestId(
        "home-answer-proof-panel",
      );
      expect(answerProofPanel).not.toHaveClass("surface-card");
      expect(answerProofPanel).toHaveClass("grid");
      expect(
        within(answerProofPanel).getAllByTestId("home-answer-proof-item")[0],
      ).toHaveClass("rounded-xl");

      const startPathList = within(startPathSection).getByRole("list");
      expect(startPathList).toHaveClass("divide-y");
      expect(startPathList).not.toHaveClass("grid");
      expect(
        within(startPathList).getAllByTestId("home-start-path-step-badge")[0],
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
