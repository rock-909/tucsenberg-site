/**
 * C8: the bare CTA section becomes a quote panel keeping the EXACT
 * existing quoteHref, plus quote.* eyebrow/title/body, a single
 * sales@tucsenberg.com mailto, the frozen CompatibilityProofBox, and the
 * frozen SlaCommitments with layout="stacked". The page-bottom inline
 * TrademarkDisclaimer stays the final element. No other contact mailbox,
 * no struck "tear-down".
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

vi.mock("@/app/[locale]/membranes/[product]/compatibility-section", () => ({
  CompatibilitySection: () => <section data-testid="compatibility-section" />,
}));

vi.mock("@/components/trust", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/trust")>();
  return {
    ...actual,
    TrademarkDisclaimer: ({ variant }: { variant: string }) => (
      <div data-testid="trademark-disclaimer" data-variant={variant} />
    ),
    NarrativeSection: ({
      title,
      body,
      children,
    }: {
      title: string;
      body?: string;
      children?: ReactNode;
    }) => (
      <section data-testid="narrative-section">
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
        {children}
      </section>
    ),
    MaterialDecisionCard: () => (
      <section data-testid="material-decision-card" />
    ),
    BatchControlsBlock: () => <section data-testid="batch-controls-block" />,
    SlaCommitments: ({ layout }: { layout: string }) => (
      <ul data-testid="sla-commitments" data-layout={layout} />
    ),
    CompatibilityProofBox: () => (
      <section data-testid="compatibility-proof-box" />
    ),
  };
});

const CANONICAL_D9_EPDM = "9-inch-epdm-disc-replacement";

describe("Membrane product page — quote CTA panel + proof", () => {
  it("keeps the exact quoteHref and mounts proof + stacked SLA + single sales email", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    const { container } = render(Page);

    // Regression fence: quote link href byte-unchanged.
    expect(
      screen.getByRole("link", { name: "Request Quote for This Part" }),
    ).toHaveAttribute(
      "href",
      `/quote?sku=TUC-D9-EPDM&product=${CANONICAL_D9_EPDM}`,
    );

    expect(screen.getByTestId("compatibility-proof-box")).toBeInTheDocument();
    const sla = screen.getByTestId("sla-commitments");
    expect(sla).toHaveAttribute("data-layout", "stacked");

    const pageText = container.textContent ?? "";
    expect(pageText).toContain("sales@tucsenberg.com");
    expect(pageText).not.toMatch(/quote@|quality@|legal@/i);
    expect(pageText).not.toMatch(/tear.?down/i);

    // Single sales email surfaced as a mailto.
    expect(
      container.querySelector('a[href="mailto:sales@tucsenberg.com"]'),
    ).not.toBeNull();

    // Page-bottom inline trademark disclaimer remains the final element.
    const disclaimer = screen.getByTestId("trademark-disclaimer");
    expect(disclaimer).toHaveAttribute("data-variant", "inline");
    expect(
      sla.compareDocumentPosition(disclaimer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
