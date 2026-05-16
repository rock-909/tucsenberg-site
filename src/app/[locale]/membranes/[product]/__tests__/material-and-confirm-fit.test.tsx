/**
 * C5: a material-fit section mounts the frozen MaterialDecisionCard
 * (defaultMaterial="epdm"), followed by a confirm-fit process section that
 * lists all six membraneProduct.confirmFit.steps.* in fixed order. The
 * confirm-fit copy carries no lead-time/quantity/temperature numbers
 * (those belong to dedicated later sections / are struck).
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

const materialDecisionSpy = vi.fn();

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
    MaterialDecisionCard: (props: { defaultMaterial?: string }) => {
      materialDecisionSpy(props);
      return (
        <section
          data-testid="material-decision-card"
          data-default-material={props.defaultMaterial}
        />
      );
    },
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

describe("Membrane product page — material fit + confirm fit", () => {
  it("mounts MaterialDecisionCard(epdm) and the six confirm-fit steps in order", async () => {
    materialDecisionSpy.mockClear();
    const Page = await ProductPage({
      params: Promise.resolve({ locale: "en", product: CANONICAL_D9_EPDM }),
    });

    const { container } = render(Page);

    const card = screen.getByTestId("material-decision-card");
    expect(card).toHaveAttribute("data-default-material", "epdm");
    expect(materialDecisionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ defaultMaterial: "epdm" }),
    );

    const steps = CONFIRM_FIT_KEYS.map((k) =>
      resolveMessage("en", "membraneProduct", `confirmFit.steps.${k}`),
    );
    const listItems = Array.from(
      container.querySelectorAll("ol li"),
      (n) => n.textContent ?? "",
    );
    for (const step of steps) {
      expect(listItems).toContain(step);
    }
    // Fixed order.
    const indexes = steps.map((s) => listItems.indexOf(s));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));

    // Confirm-fit copy must not carry lead-time / quantity / temperature.
    const confirmRegion = steps.join(" ");
    expect(confirmRegion).not.toMatch(
      /\d+\s*(day|days|business day|week|weeks)\b/i,
    );
    expect(confirmRegion).not.toMatch(/500/);
    expect(confirmRegion).not.toMatch(/°C/);
  });
});
