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
  "hero.eyebrow": "Public demo starter site",
  "hero.title":
    "No website yet? Start with a deployable showcase-site foundation.",
  "hero.subtitle":
    "This starter gives a project the first real website structure: pages, content replacement surfaces, inquiry flow, multilingual copy, and a Cloudflare-ready launch path.",
  "hero.cta.primary": "View product capabilities",
  "hero.cta.secondary": "Contact",
  "hero.preview.label": "What this starter provides",
  "hero.preview.title": "A public site foundation, not a blank shell",
  "hero.preview.description":
    "The demo is intentionally complete enough to evaluate, while still making replacement boundaries visible before a real launch.",
  "hero.preview.items.0": "Home, Products, Blog, About, and Contact",
  "hero.preview.items.1": "Brand and content replacement surfaces",
  "hero.preview.items.2": "Inquiry path with anti-abuse basics",
  "hero.preview.items.3": "Cloudflare-ready deployment direction",
  "problems.title":
    "The first blocker is usually not design polish. It is that the website does not exist yet.",
  "problems.description":
    "A new project often has no public structure, no content plan, no deployment path, and no clear way for visitors to contact the owner.",
  "problems.items.structure.title": "No page structure",
  "problems.items.structure.description":
    "There is no agreed Home, Products, Blog, About, Contact, or legal page baseline.",
  "problems.items.content.title": "No content plan",
  "problems.items.content.description":
    "Brand facts, offer copy, proof assets, images, and launch boundaries are scattered or missing.",
  "problems.items.deployment.title": "No launch path",
  "problems.items.deployment.description":
    "A local build is not enough; the site still needs a preview and deployment path that can be proven.",
  "problems.items.inquiry.title": "No inquiry flow",
  "problems.items.inquiry.description":
    "Visitors need a simple contact route, and the owner needs a real destination for submissions.",
  "problems.items.multilingual.title": "No multilingual baseline",
  "problems.items.multilingual.description":
    "If the site needs English and Chinese, copy, routing, and switching must be built in from the start.",
  "answer.title": "The starter gives that missing foundation first.",
  "answer.description":
    "It is not a finished client website. It is a reusable public demo that shows the structure, replacement work, and launch proof a real site still needs.",
  "answer.items.pageStructure.title": "Clear page structure",
  "answer.items.pageStructure.description":
    "Home, Products, Blog, About, Contact, and supporting pages are already wired as a real public site shape.",
  "answer.items.replacementSurface.title": "Visible replacement surface",
  "answer.items.replacementSurface.description":
    "Brand, offers, page copy, SEO, images, legal text, and contact details are treated as explicit launch inputs.",
  "answer.items.inquiryPath.title": "Inquiry path",
  "answer.items.inquiryPath.description":
    "The site includes a contact route and form foundation, with basic anti-abuse and lead-handling boundaries.",
  "answer.items.cloudflareFoundation.title": "Cloudflare-ready foundation",
  "answer.items.cloudflareFoundation.description":
    "Cloudflare is the recommended deployment path. Optional compatibility can stay secondary without becoming the default promise.",
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
  "finalCta.primary": "View product capabilities",
  "finalCta.secondary": "Contact",
};

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
      expect(params).toEqual([{ locale: "en" }, { locale: "zh" }]);
    });
  });

  describe("Home Component", () => {
    it("should explain the no-website-to-launch starter journey", async () => {
      const HomeComponent = await Home({
        params: Promise.resolve({ locale: "en" }),
      });

      render(HomeComponent);

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /No website yet\? Start with a deployable showcase-site foundation\./,
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
        screen.getByText("Home, Products, Blog, About, and Contact"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Brand and content replacement surfaces"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Inquiry path with anti-abuse basics"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Cloudflare-ready deployment direction"),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("link", { name: "View product capabilities" })[0],
      ).toHaveAttribute("href", "/products");
      expect(
        screen.getAllByRole("link", { name: "Contact" })[0],
      ).toHaveAttribute("href", "/contact");
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
