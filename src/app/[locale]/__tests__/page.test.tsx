import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home, { generateStaticParams } from "../page";

type MockLinkHref = string | { pathname: string };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

const homeMessages: Record<string, string> = {
  "hero.eyebrow": "Aftermarket aeration membranes",
  "hero.title": "Replacement membrane paths for installed aeration systems.",
  "hero.subtitle":
    "Tucsenberg is preparing compatibility-led membrane pages for O&M teams that need OEM-family matching, material guidance, and RFQ-ready review inputs.",
  "hero.cta.primary": "Review membrane paths",
  "hero.cta.secondary": "Prepare a quote request",
  "hero.preview.label": "What Tucsenberg is building",
  "hero.preview.title": "Compatibility review first, broad catalog later",
  "hero.preview.description":
    "The site is intentionally in a safe work-in-progress state until product data, compatibility records, and RFQ routing are owner-confirmed.",
  "hero.preview.items.0":
    "Membranes, compatibility, materials, and quote paths",
  "hero.preview.items.1": "OEM-family and part-number review inputs",
  "hero.preview.items.2": "RFQ path with anti-abuse basics",
  "hero.preview.items.3": "Cloudflare-ready deployment direction",
  "problems.title":
    "Replacement membrane buyers usually arrive with partial evidence, not a clean catalog SKU.",
  "problems.description":
    "A maintenance team may have an OEM family, an old part number, a body photo, dimensions, wastewater conditions, or only a shutdown deadline.",
  "problems.items.structure.title": "No clean part path",
  "problems.items.structure.description":
    "A buyer needs membrane diameter, diffuser body fit, OEM family, and review caveats before a quote is responsible.",
  "problems.items.content.title": "Incomplete evidence",
  "problems.items.content.description":
    "Photos, old membranes, dimensions, wastewater conditions, and quantity bands often arrive in different formats.",
  "problems.items.deployment.title": "Unclear material risk",
  "problems.items.deployment.description":
    "EPDM, TPU/PU, and later PTFE-coated EPDM need condition-based guidance instead of vague quality claims.",
  "problems.items.inquiry.title": "RFQ friction",
  "problems.items.inquiry.description":
    "Quote review is slower when part numbers, installed model, quantity, and shutdown timing are not collected together.",
  "problems.items.multilingual.title": "Regional review path",
  "problems.items.multilingual.description":
    "English and Spanish public pages must keep the same review logic while Chinese stays internal preview only.",
  "answer.title": "Tucsenberg starts with compatibility review before quote.",
  "answer.description":
    "The site is being shaped around part-number matching, material decision support, RFQ intake, and clear OEM trademark boundaries.",
  "answer.items.pageStructure.title": "Membrane path structure",
  "answer.items.pageStructure.description":
    "Membranes, compatibility, materials, quote, quality, procurement, and legal boundaries each have a defined place.",
  "answer.items.replacementSurface.title": "Review input surface",
  "answer.items.replacementSurface.description":
    "Part numbers, photos, dimensions, wastewater conditions, quantity bands, and shutdown timing are treated as explicit RFQ inputs.",
  "answer.items.inquiryPath.title": "Quote review path",
  "answer.items.inquiryPath.description":
    "The quote flow will ask for enough evidence to return a responsible membrane recommendation, not a brand-name match alone.",
  "answer.items.cloudflareFoundation.title": "Cloudflare-ready foundation",
  "answer.items.cloudflareFoundation.description":
    "Cloudflare/OpenNext remains the deployment path while Tucsenberg content and lead routing are confirmed.",
  "startPath.title": "A practical path from membrane evidence to RFQ.",
  "startPath.description":
    "Use the current placeholder IA to lock the flow, then fill it with confirmed product, compatibility, material, and quote data.",
  "startPath.items.brand.title": "Confirm product facts",
  "startPath.items.brand.description":
    "Membrane families, materials, legal entity, domain, contact channels, and brand assets become owner-confirmed facts.",
  "startPath.items.content.title": "Replace page content",
  "startPath.items.content.description":
    "Membrane pages, compatibility guides, material guidance, quality proof, images, and legal pages become Tucsenberg launch content.",
  "startPath.items.forms.title": "Connect quote flow",
  "startPath.items.forms.description":
    "RFQ submissions, Turnstile, lead destinations, email delivery, and response ownership point to real accounts.",
  "startPath.items.deploy.title": "Deploy and verify",
  "startPath.items.deploy.description":
    "Cloudflare preview, form canary, content readiness, and owner signoff prove readiness separately from local checks.",
  "finalCta.title":
    "Prepare the membrane evidence, then request a responsible quote.",
  "finalCta.description":
    "Use the current placeholder path to understand what Tucsenberg will ask for before issuing a compatibility-led quote.",
  "finalCta.primary": "Review membrane paths",
  "finalCta.secondary": "Prepare a quote request",
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
  getTranslations: vi.fn(() => (key: string) => homeMessages[key] ?? key),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
  JsonLdScript: () => <script type="application/ld+json" />,
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
    it("should explain the Tucsenberg membrane review journey", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /Replacement membrane paths for installed aeration systems\./,
        }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("home-problem-section")).toBeInTheDocument();
      expect(screen.getByTestId("home-answer-section")).toBeInTheDocument();
      expect(screen.getByTestId("home-start-path-section")).toBeInTheDocument();
      expect(screen.getByTestId("home-final-action")).toBeInTheDocument();
      expect(
        screen.getByText("Cloudflare-ready foundation"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Membranes, compatibility, materials, and quote paths",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("OEM-family and part-number review inputs"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("RFQ path with anti-abuse basics"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Cloudflare-ready deployment direction"),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("link", { name: "Review membrane paths" })[0],
      ).toHaveAttribute("href", "#coming-soon");
      expect(
        screen.getAllByRole("link", { name: "Prepare a quote request" })[0],
      ).toHaveAttribute("href", "#coming-soon");
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
