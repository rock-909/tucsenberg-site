/**
 * The home page imports `@/data/product-compatibility`, which runs Zod
 * `.parse()` at module load. The global test setup mocks zod, so we must
 * unmock it here for the catalog to initialize.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home, { generateStaticParams } from "../page";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";

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
  "materials.overline": "MATERIAL SELECTION",
  "materials.title": "Choose the Material That Matches Your Conditions",
  "materials.epdm.name": "EPDM",
  "materials.epdm.description":
    "Municipal and light industrial wastewater conditions.",
  "materials.tpu.name": "TPU",
  "materials.tpu.description":
    "Oil, chemical, and high-grease wastewater conditions where EPDM degrades.",
  "trust.scope": "Aftermarket replacement membranes only",
  "trust.leadTime": "Lead time confirmed per quote",
  "trust.sla": "Quote response within 2 business days",
  "trust.noFit": "No-fit, no-charge review",
  "cta.title": "Have a part number ready?",
  "cta.description":
    "Send it over and we confirm the compatible Tucsenberg membrane and lead time.",
  "cta.requestQuote": "Request a Quote",
  "cta.viewMembranes": "Browse All Membranes",
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
    () => (key: string, values?: Record<string, string>) =>
      values?.brand
        ? `View ${values.brand} compatible parts`
        : (homeMessages[key] ?? key),
  ),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
  JsonLdScript: () => <script type="application/ld+json" />,
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

    it("presents condition-based material guidance without quality claims", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(screen.getByText("EPDM")).toBeInTheDocument();
      expect(screen.getByText("TPU")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Oil, chemical, and high-grease wastewater conditions where EPDM degrades.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/premium|high quality|better than/i),
      ).not.toBeInTheDocument();
    });

    it("routes the final CTAs to quote and the membrane catalog", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(
        screen.getByRole("link", { name: "Request a Quote" }),
      ).toHaveAttribute("href", SINGLE_SITE_ROUTE_HREFS.quote);
      expect(
        screen.getByRole("link", { name: "Browse All Membranes" }),
      ).toHaveAttribute("href", "/membranes/tuc-d9-epdm");
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
