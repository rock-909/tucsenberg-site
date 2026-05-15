/**
 * The brand page imports `@/data/product-compatibility`, which runs Zod
 * `.parse()` at module load. The global test setup mocks zod, so we must
 * unmock it here for the catalog to initialize.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BrandPage, { generateStaticParams } from "../page";

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
  getTranslations: vi.fn(
    () => (key: string, values?: Record<string, string>) =>
      values?.brand ? `${key}:${values.brand}` : key,
  ),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
}));

describe("OEM compatibility brand page", () => {
  it("generates a param for every brand slug across locales", () => {
    const params = generateStaticParams();
    expect(params).toContainEqual({ locale: "en", brand: "sanitaire" });
    expect(params).toContainEqual({ locale: "es", brand: "edi" });
    expect(params).toContainEqual({ locale: "zh", brand: "ssi-aeration" });
  });

  it("renders the brand, trademark disclaimer, and quote pre-fill", async () => {
    const Page = await BrandPage({
      params: Promise.resolve({ locale: "en", brand: "sanitaire" }),
    });

    render(Page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Sanitaire" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Xylem/)).toBeInTheDocument();

    const quoteLink = screen.getAllByRole("link", {
      name: "results.requestQuote",
    })[0];
    expect(quoteLink.getAttribute("href")).toContain("/quote?brand=sanitaire");
  });

  it("filters models by the disc/tube category tab", async () => {
    const Page = await BrandPage({
      params: Promise.resolve({ locale: "en", brand: "sanitaire" }),
    });

    render(Page);

    const results = screen.getByTestId("model-results");
    const allCount = within(results).getAllByRole("heading", {
      level: 2,
    }).length;
    expect(allCount).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "filter.tube" }));

    const tubeCount = within(screen.getByTestId("model-results")).getAllByRole(
      "heading",
      { level: 2 },
    ).length;
    expect(tubeCount).toBeLessThan(allCount);
  });

  it("calls notFound() for an unknown brand", async () => {
    await expect(
      BrandPage({
        params: Promise.resolve({ locale: "en", brand: "not-a-brand" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
