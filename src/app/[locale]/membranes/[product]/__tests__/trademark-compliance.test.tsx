/**
 * CLAUDE.md #3 compliance: every OEM-compatibility page must carry a
 * page-level trademark disclaimer. The per-brand `brand-notice` disclaimers
 * inside `CompatibilitySection` are a separate, in-section concern and are
 * NOT the page-level one this test pins. We stub `CompatibilitySection`
 * away entirely so the only `TrademarkDisclaimer` that can render is the
 * page-level `variant="inline"` block, and assert it renders AFTER the
 * (stubbed) compatibility section.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductPage from "../page";

vi.unmock("zod");

type MockLinkHref = string | { pathname: string };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  permanentRedirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
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

import enCritical from "../../../../../../messages/en/critical.json";
import esCritical from "../../../../../../messages/es/critical.json";
import zhCritical from "../../../../../../messages/zh/critical.json";

const CRITICAL_BY_LOCALE: Record<string, Record<string, unknown>> = {
  en: enCritical as Record<string, unknown>,
  es: esCritical as Record<string, unknown>,
  zh: zhCritical as Record<string, unknown>,
};

function resolveMessage(
  locale: string,
  namespace: string,
  key: string,
): string {
  const path = `${namespace}.${key}`.split(".");
  let node: unknown = CRITICAL_BY_LOCALE[locale] ?? CRITICAL_BY_LOCALE.en;
  for (const segment of path) {
    if (typeof node !== "object" || node === null) return path.join(".");
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === "string" ? node : path.join(".");
}

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(
    ({ locale, namespace }: { locale: string; namespace: string }) =>
      (key: string) =>
        resolveMessage(locale, namespace, key),
  ),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/components/seo", () => ({
  JsonLdGraphScript: () => <script type="application/ld+json" />,
}));

// Stub the whole compatibility section away — any in-section per-brand
// disclaimer goes with it, so the only TrademarkDisclaimer rendered is the
// page-level one.
vi.mock("@/app/[locale]/membranes/[product]/compatibility-section", () => ({
  CompatibilitySection: () => <section data-testid="compatibility-section" />,
}));

vi.mock("@/components/trust", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/trust")>();
  return {
    ...actual,
    TrademarkDisclaimer: ({ variant }: { variant: string }) => (
      <div data-testid="trademark-disclaimer" data-variant={variant}>
        Brand and model names are trademarks of their respective owners.
      </div>
    ),
  };
});

const CANONICAL_D9_EPDM = "9-inch-epdm-disc-replacement";

describe("Membrane product page — trademark compliance", () => {
  it("renders a page-level inline trademark disclaimer after the compatibility section", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    const { container } = render(Page);

    const disclaimer = screen.getByTestId("trademark-disclaimer");
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer).toHaveAttribute("data-variant", "inline");

    const compat = screen.getByTestId("compatibility-section");

    // Document order: the page-level disclaimer must come AFTER the
    // compatibility section, proving it is the page-bottom one (not an
    // in-section per-brand notice, which is stubbed out anyway).
    const order = container.querySelectorAll(
      '[data-testid="compatibility-section"],[data-testid="trademark-disclaimer"]',
    );
    expect(order[0]).toBe(compat);
    expect(order[order.length - 1]).toBe(disclaimer);
  });
});
