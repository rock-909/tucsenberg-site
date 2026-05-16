/**
 * Spec-strip data contract: the hero `<dl>` exposes only real data fields
 * (Diameter / Material / Type / SKU), the featured variant's diameter is
 * sourced from the frozen `getFeaturedProductFacts()` accessor, and no
 * struck non-data tokens (temperature band, mounting style) leak in.
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

describe("Membrane product page — spec strip data contract", () => {
  it("exposes only Diameter/Material/Type/SKU sourced from real data", async () => {
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    const { container } = render(Page);

    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    const labels = Array.from(
      dl!.querySelectorAll("dt"),
      (n) => n.textContent ?? "",
    );
    expect(labels).toEqual([
      resolveMessage("en", "membraneProduct", "hero.specBar.diameter"),
      resolveMessage("en", "membraneProduct", "hero.specBar.material"),
      resolveMessage("en", "membraneProduct", "hero.specBar.category"),
      resolveMessage("en", "membraneProduct", "hero.specBar.sku"),
    ]);

    // Real data values.
    expect(screen.getByText("TUC-D9-EPDM")).toBeInTheDocument();
    const dlText = dl!.textContent ?? "";
    expect(dlText).toMatch(/9"|228\.6\s*mm/);

    // Struck non-data tokens must not leak into the spec strip.
    expect(dlText).not.toMatch(/°C/);
    expect(dlText).not.toMatch(/\bthreaded\b|\bring\b|\bbayonet\b/i);
    expect(dlText).not.toMatch(/5\s*[–-]\s*45/);
  });
});
