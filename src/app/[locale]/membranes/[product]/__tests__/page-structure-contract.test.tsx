/**
 * C9 consolidated structure contract: with real data + real messages and
 * the full trust mock, the product page renders the Phase-4.1 sections in
 * this exact document order:
 *
 *   hero spec strip → use-case → MaterialDecisionCard → 6 confirm-fit
 *   steps → CompatibilitySection → lead-time → BatchControlsBlock →
 *   quote CTA (exact href) → stacked SLA → page-bottom inline
 *   TrademarkDisclaimer
 *
 * plus the global strike audit (no degC / \d+ day / 500 / tear-down /
 * quote@|quality@|legal@).
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
const CONFIRM_FIT_KEYS = [
  "partNumber",
  "dimensions",
  "mounting",
  "material",
  "perforation",
  "release",
] as const;

describe("Membrane product page — Phase 4.1 structure contract", () => {
  it("renders every section in the locked document order", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    const { container } = render(Page);

    const m = (key: string) => resolveMessage("en", "membraneProduct", key);

    const dl = container.querySelector("dl")!;
    const useCase = screen.getByRole("heading", { name: m("useCase.title") });
    const card = screen.getByTestId("material-decision-card");
    const compat = screen.getByTestId("compatibility-section");
    const leadTime = screen.getByRole("heading", {
      name: m("leadTime.title"),
    });
    const batch = screen.getByTestId("batch-controls-block");
    const quoteLink = screen.getByRole("link", {
      name: m("cta.requestQuote"),
    });
    const sla = screen.getByTestId("sla-commitments");
    const proof = screen.getByTestId("compatibility-proof-box");
    const disclaimer = screen.getByTestId("trademark-disclaimer");

    const ordered = [
      dl,
      useCase,
      card,
      compat,
      leadTime,
      batch,
      quoteLink,
      sla,
      disclaimer,
    ];
    for (let i = 0; i < ordered.length - 1; i++) {
      expect(
        ordered[i]!.compareDocumentPosition(ordered[i + 1]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    // Six confirm-fit steps between MaterialDecisionCard and
    // CompatibilitySection, in fixed order.
    const stepTexts = CONFIRM_FIT_KEYS.map((k) => m(`confirmFit.steps.${k}`));
    const lis = Array.from(
      container.querySelectorAll("ol li"),
      (n) => n.textContent ?? "",
    );
    expect(stepTexts.every((s) => lis.includes(s))).toBe(true);
    const idx = stepTexts.map((s) => lis.indexOf(s));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));

    expect(quoteLink).toHaveAttribute(
      "href",
      `/quote?sku=TUC-D9-EPDM&product=${CANONICAL_D9_EPDM}`,
    );
    expect(sla).toHaveAttribute("data-layout", "stacked");
    expect(disclaimer).toHaveAttribute("data-variant", "inline");
    expect(proof).toBeInTheDocument();

    // Global strike audit.
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/°C/);
    expect(text).not.toMatch(/\d+\s*day/i);
    expect(text).not.toMatch(/500/);
    expect(text).not.toMatch(/tear.?down/i);
    expect(text).not.toMatch(/quote@|quality@|legal@/i);
  });
});
