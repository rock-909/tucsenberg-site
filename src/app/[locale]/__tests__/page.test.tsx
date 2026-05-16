/**
 * The home page imports `@/data/product-compatibility`, which runs Zod
 * `.parse()` at module load. The global test setup mocks zod, so we must
 * unmock it here for the catalog to initialize.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home, { generateStaticParams } from "../page";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import {
  getBrandPathStats,
  getOemBrandFacts,
} from "@/data/product-compatibility";

vi.unmock("zod");

type MockLinkHref = string | { pathname: string };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

const homeMessages: Record<string, string> = {
  "hero.title": "Find Your Replacement Membrane",
  "hero.subtitle":
    "Enter a part number, OEM model, or diffuser brand to check compatibility.",
  "oemGrid.overline": "OEM COMPATIBILITY",
  "oemGrid.title": "Replacement Membranes for Major Brands",
  "cta.title": "Have a part number ready?",
  "cta.description":
    "Send it over and we confirm the compatible Tucsenberg membrane and lead time.",
  "cta.requestQuote": "Request a Quote",
};

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "es", "zh"],
    defaultLocale: "en",
  },
  Link: ({ children, href, ...props }: MockLinkProps) => (
    <a href={typeof href === "string" ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(
    () => (key: string, values?: Record<string, string | number>) => {
      if (values?.brand) {
        return `View ${values.brand} compatible parts`;
      }
      if (key === "oemGrid.pathCount" && values?.count !== undefined) {
        return `${values.count} documented compatibility paths`;
      }
      return homeMessages[key] ?? key;
    },
  ),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
  JsonLdScript: () => <script type="application/ld+json" />,
}));

const SLA_RIBBON_ITEMS = [
  "Compatibility review — within 24 business hours.",
  "Standard RFQ — quote or missing-info request within 48 business hours.",
  "Urgent shutdown cases — acknowledged the same business day.",
] as const;

vi.mock("@/components/trust", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/trust")>();
  return {
    ...actual,
    SlaCommitments: ({ layout }: { layout: string }) => (
      <ul data-testid="sla-commitments" data-layout={layout}>
        {SLA_RIBBON_ITEMS.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    ),
    CompatibilityProofBox: () => (
      <section data-testid="compatibility-proof-box" />
    ),
    MaterialDecisionCard: () => (
      <section data-testid="material-decision-card" />
    ),
    BatchControlsBlock: () => <section data-testid="batch-controls-block" />,
    TrademarkDisclaimer: ({ variant }: { variant: string }) => (
      <footer data-testid="trademark-disclaimer" data-variant={variant}>
        Tucsenberg manufactures aftermarket aeration replacement membranes.
      </footer>
    ),
  };
});

vi.mock("@/components/sections/home-confirm-section", () => ({
  HomeConfirmSection: () => (
    <section data-testid="home-confirm-section">
      <h2>What we help you confirm</h2>
    </section>
  ),
}));

vi.mock("@/components/sections/home-membrane-type-section", () => ({
  HomeMembraneTypeSection: () => (
    <section data-testid="home-membrane-type-section">
      <h2>Start from the membrane format you run</h2>
    </section>
  ),
}));

vi.mock("@/components/sections/home-risks-section", () => ({
  HomeRisksSection: () => (
    <section data-testid="home-risks-section">
      <h2>The four risks buyers avoid</h2>
    </section>
  ),
}));

vi.mock("@/components/sections/home-faq-section", () => ({
  HomeFaqSection: () => (
    <section data-testid="home-faq-section">
      <h2>Replacement membrane questions</h2>
      <h3>How fast do you respond to a compatibility request?</h3>
      <script
        type="application/ld+json"
        data-testid="home-faq-jsonld"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [],
          }),
        }}
      />
    </section>
  ),
}));

vi.mock("@/components/search/home-hero-search", () => ({
  HomeHeroSearch: () => (
    <input
      type="search"
      role="combobox"
      aria-label="Compatibility search"
      aria-controls="home-search-results"
      aria-expanded={false}
    />
  ),
}));

describe("Home Page", () => {
  describe("generateStaticParams", () => {
    it("should return params for all locales", () => {
      const params = generateStaticParams();
      expect(params).toEqual([
        { locale: "en" },
        { locale: "es" },
        { locale: "zh" },
      ]);
    });
  });

  describe("Home Component", () => {
    it("leads with the compatibility-first hero and search", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Find Your Replacement Membrane",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("combobox", { name: "Compatibility search" }),
      ).toBeInTheDocument();
    });

    it("links each OEM brand card to its compatibility page", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(
        screen.getByRole("link", { name: /Sanitaire compatible parts/ }),
      ).toHaveAttribute("href", "/compatible/sanitaire");
      expect(
        screen.getByRole("link", { name: /EDI compatible parts/ }),
      ).toHaveAttribute("href", "/compatible/edi");
      expect(
        screen.getByRole("link", { name: /SSI Aeration compatible parts/ }),
      ).toHaveAttribute("href", "/compatible/ssi-aeration");
    });

    it("drives the OEM grid from frozen brand facts with documented-path counts", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      const brands = getOemBrandFacts();
      expect(brands.map((b) => b.id)).toEqual([
        "sanitaire",
        "edi",
        "ssi-aeration",
      ]);

      for (const brand of brands) {
        const link = screen
          .getAllByRole("link")
          .find(
            (el) => el.getAttribute("href") === `/compatible/${brand.slug}`,
          );
        expect(link).toBeDefined();
        expect(link?.textContent).toContain(brand.displayName);
        expect(link?.textContent).toContain("compatible parts");

        const paths = getBrandPathStats(brand.id).paths;
        expect(
          within(link as HTMLElement).getByText(
            `${paths} documented compatibility paths`,
          ),
        ).toBeInTheDocument();
      }
    });

    it("renders the what-we-confirm narrative section after the hero", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(screen.getByTestId("home-confirm-section")).toBeInTheDocument();
      expect(
        screen.getByTestId("home-membrane-type-section"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("home-risks-section")).toBeInTheDocument();
    });

    it("renders the shared SLA commitments ribbon, not the old trust strip", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      const ribbon = screen.getByTestId("sla-commitments");
      expect(ribbon).toHaveAttribute("data-layout", "ribbon");
      expect(ribbon.querySelectorAll("li")).toHaveLength(3);
      expect(
        screen.getByText("Compatibility review — within 24 business hours."),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Aftermarket replacement membranes only"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Quote response within 2 business days"),
      ).not.toBeInTheDocument();
    });

    it("mounts the frozen proof, material, and batch blocks in order", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      const { container } = render(HomeComponent);

      const proof = screen.getByTestId("compatibility-proof-box");
      const material = screen.getByTestId("material-decision-card");
      const batch = screen.getByTestId("batch-controls-block");

      expect(proof).toBeInTheDocument();
      expect(material).toBeInTheDocument();
      expect(batch).toBeInTheDocument();

      const order = Array.from(
        container.querySelectorAll(
          "[data-testid='compatibility-proof-box'], [data-testid='material-decision-card'], [data-testid='batch-controls-block']",
        ),
      ).map((el) => el.getAttribute("data-testid"));
      expect(order).toEqual([
        "compatibility-proof-box",
        "material-decision-card",
        "batch-controls-block",
      ]);

      // The legacy home-local materials section is gone.
      expect(
        screen.queryByText(
          "Oil, chemical, and high-grease wastewater conditions where EPDM degrades.",
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Choose the Material That Matches Your Conditions"),
      ).not.toBeInTheDocument();
    });

    it("renders the home FAQ with Q01 and FAQPage structured data", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      const { container } = render(HomeComponent);

      expect(screen.getByTestId("home-faq-section")).toBeInTheDocument();
      expect(
        screen.getByText("How fast do you respond to a compatibility request?"),
      ).toBeInTheDocument();

      const jsonLd = container.querySelector('[data-testid="home-faq-jsonld"]');
      expect(jsonLd).not.toBeNull();
      expect(jsonLd?.textContent ?? "").toContain('"@type":"FAQPage"');
    });

    it("ends with a single quote CTA and a footer trademark disclaimer", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      const { container } = render(HomeComponent);

      expect(
        screen.getByRole("link", { name: "Request a Quote" }),
      ).toHaveAttribute("href", SINGLE_SITE_ROUTE_HREFS.quote);
      expect(
        screen.queryByRole("link", { name: "Browse All Membranes" }),
      ).not.toBeInTheDocument();

      const disclaimer = screen.getByTestId("trademark-disclaimer");
      expect(disclaimer).toHaveAttribute("data-variant", "footer");

      // The trademark disclaimer is the last child of the page root.
      const root = container.firstChild as HTMLElement;
      expect(root.lastElementChild).toBe(disclaimer);
    });

    it("should have correct container classes", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      const { container } = render(HomeComponent);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass(
        "min-h-screen",
        "bg-background",
        "text-foreground",
      );
    });

    it("should be an async server component", async () => {
      const result = Home({ params: Promise.resolve({ locale: "en" }) });
      expect(result).toBeInstanceOf(Promise);
    });

    it("should handle delayed params resolution", async () => {
      const delayedParams = new Promise<{ locale: "en" | "es" | "zh" }>(
        (resolve) => setTimeout(() => resolve({ locale: "en" }), 10),
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
