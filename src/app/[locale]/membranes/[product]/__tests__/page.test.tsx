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
const permanentRedirectError = new Error("NEXT_REDIRECT");

const permanentRedirectMock = vi.fn((_url: string) => {
  throw permanentRedirectError;
});

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw notFoundError;
  }),
  permanentRedirect: (url: string) => permanentRedirectMock(url),
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

const CANONICAL_D9_EPDM = "9-inch-epdm-disc-replacement";

describe("Membrane product page", () => {
  it("generates a canonical descriptive param for every variant across locales", () => {
    const params = generateStaticParams();
    expect(params).toContainEqual({
      locale: "en",
      product: CANONICAL_D9_EPDM,
    });
    // The legacy SKU slug is a redirect source, never a generated param.
    expect(params).not.toContainEqual({
      locale: "en",
      product: "tuc-d9-epdm",
    });
    expect(
      params.filter((entry) => entry.locale === "en").length,
    ).toBeGreaterThan(1);
  });

  it("renders the spec bar and quote CTA for the canonical descriptive slug", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    render(Page);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("EPDM")).toBeInTheDocument();
    expect(screen.getByText("TUC-D9-EPDM")).toBeInTheDocument();
    // `?sku=` keeps the real SKU for the RFQ; `?product=` uses the canonical slug.
    expect(
      screen.getByRole("link", { name: "cta.requestQuote" }),
    ).toHaveAttribute(
      "href",
      `/quote?sku=TUC-D9-EPDM&product=${CANONICAL_D9_EPDM}`,
    );
  });

  it("permanently redirects the legacy SKU slug to the canonical descriptive URL", async () => {
    permanentRedirectMock.mockClear();
    await expect(
      ProductPage({
        params: Promise.resolve({ locale: "en", product: "tuc-d9-epdm" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(permanentRedirectMock).toHaveBeenCalledWith(
      `/en/membranes/${CANONICAL_D9_EPDM}`,
    );
  });

  it("preserves the locale prefix on the SKU redirect", async () => {
    permanentRedirectMock.mockClear();
    await expect(
      ProductPage({
        params: Promise.resolve({ locale: "es", product: "tuc-t62-tpu" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(permanentRedirectMock).toHaveBeenCalledWith(
      "/es/membranes/62-mm-tpu-tube-replacement",
    );
  });

  it("calls notFound() for an unknown slug", async () => {
    await expect(
      ProductPage({
        params: Promise.resolve({ locale: "en", product: "not-a-real-part" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
