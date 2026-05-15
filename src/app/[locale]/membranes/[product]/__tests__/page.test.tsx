/**
 * The product page imports `@/data/product-compatibility`, which runs Zod
 * `.parse()` at module load. The global test setup mocks zod, so we must
 * unmock it here for the catalog to initialize.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage, { generateStaticParams } from "../page";

vi.unmock("zod");

type MockLinkHref = string | { pathname: string };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

const notFoundError = new Error("NEXT_NOT_FOUND");

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundError;
  }),
}));

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es", "zh"], defaultLocale: "en" },
  Link: ({ children, href, ...props }: MockLinkProps) => (
    <a href={typeof href === "string" ? href : href.pathname} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(() => (key: string) => key),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
}));

// CompatibilitySection is its own async Server Component with dedicated
// coverage; stub it so this test stays focused on page orchestration
// (slug resolution, 404, spec bar, quote pre-fill).
vi.mock("@/app/[locale]/membranes/[product]/compatibility-section", () => ({
  CompatibilitySection: () => <section data-testid="compatibility-section" />,
}));

describe("Membrane product page", () => {
  it("generates a param for every variant slug across locales", () => {
    const params = generateStaticParams();
    expect(params).toContainEqual({
      locale: "en",
      product: "tuc-d9-epdm",
    });
    expect(
      params.filter((entry) => entry.locale === "en").length,
    ).toBeGreaterThan(1);
  });

  it("renders the spec bar and quote CTA for a known slug", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: "tuc-d9-epdm" }),
    });

    render(Page);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("EPDM")).toBeInTheDocument();
    expect(screen.getByText("TUC-D9-EPDM")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "cta.requestQuote" }),
    ).toHaveAttribute("href", "/quote?sku=TUC-D9-EPDM&product=tuc-d9-epdm");
  });

  it("calls notFound() for an unknown slug", async () => {
    await expect(
      ProductPage({
        params: Promise.resolve({ locale: "en", product: "not-a-real-part" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
