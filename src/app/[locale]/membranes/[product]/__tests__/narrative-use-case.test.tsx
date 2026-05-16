/**
 * C4: the "What this product is for" narrative renders between the hero
 * spec strip and the compatibility section, sourced from
 * membraneProduct.useCase.* (resolved, not key passthrough).
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

describe("Membrane product page — use-case narrative", () => {
  it("renders the resolved use-case title between the hero spec strip and compatibility", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    const { container } = render(Page);

    const useCaseTitle = resolveMessage(
      "en",
      "membraneProduct",
      "useCase.title",
    );
    expect(useCaseTitle).toBe("A drop-in aeration membrane replacement");
    expect(screen.getByText(useCaseTitle)).toBeInTheDocument();

    // Document order: hero <dl> spec strip → use-case narrative →
    // compatibility section.
    const dl = container.querySelector("dl");
    const useCaseHeading = screen.getByRole("heading", {
      name: useCaseTitle,
    });
    const compat = screen.getByTestId("compatibility-section");

    expect(
      dl!.compareDocumentPosition(useCaseHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      useCaseHeading.compareDocumentPosition(compat) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
