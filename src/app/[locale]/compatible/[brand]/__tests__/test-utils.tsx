/**
 * Shared compatible/[brand] brand-page test harness (Step 4.1 Phase D).
 *
 * Mirrors the Phase-C membrane harness
 * (`src/app/[locale]/membranes/[product]/__tests__/test-utils.tsx`): a
 * `resolveMessage` that reads the real split critical bundles, a
 * dependency-inverted `renderBrandPage` (caller passes its own `BrandPage`
 * import so this module never imports `../page`), and per-module `vi.mock`
 * factory functions — including a trust-mock factory with an overrides
 * bag. Every Phase-D test file imports these and keeps only its unique
 * assertions; no per-file copied ~100-line mock block.
 *
 * The repo vitest config excludes
 * `**\/__tests__/**\/test-utils.{ts,tsx}` from collection, so this file is
 * a harness, not a spec.
 */
import type { AnchorHTMLAttributes, JSX, ReactNode } from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import enCritical from "../../../../../../messages/en/critical.json";
import esCritical from "../../../../../../messages/es/critical.json";
import zhCritical from "../../../../../../messages/zh/critical.json";

type MockLinkHref = string | { pathname: string };
type MockLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
  href: MockLinkHref;
};

const CRITICAL_BY_LOCALE: Record<string, Record<string, unknown>> = {
  en: enCritical as Record<string, unknown>,
  es: esCritical as Record<string, unknown>,
  zh: zhCritical as Record<string, unknown>,
};

/**
 * Resolve a real message from the split critical bundles, applying simple
 * `{token}` ICU interpolation when the caller passes values (the brand
 * page renders `{brand}`/`{paths}`/`{epdm}`/`{tpu}`). A pass-through
 * `(key) => key` mock could not catch a hardcoded-literal regression, so
 * the harness keeps real-bundle resolution. Both the (locale, namespace,
 * key) and (namespace, key) call shapes are supported; the 2-arg form
 * defaults to the `en` bundle.
 */
export function resolveMessage(
  localeOrNamespace: string,
  namespaceOrKey: string,
  keyOrValues?: string | Record<string, string | number>,
  values?: Record<string, string | number>,
): string {
  const threeArgKey = typeof keyOrValues === "string";
  const locale = threeArgKey ? localeOrNamespace : "en";
  const namespace = threeArgKey ? namespaceOrKey : localeOrNamespace;
  const leaf = threeArgKey ? (keyOrValues as string) : namespaceOrKey;
  const icuValues = threeArgKey
    ? values
    : (keyOrValues as Record<string, string | number> | undefined);

  const path = `${namespace}.${leaf}`.split(".");
  let node: unknown = CRITICAL_BY_LOCALE[locale] ?? CRITICAL_BY_LOCALE.en;
  for (const segment of path) {
    if (typeof node !== "object" || node === null) return path.join(".");
    node = (node as Record<string, unknown>)[segment];
  }
  if (typeof node !== "string") return path.join(".");
  if (!icuValues) return node;
  return node.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = icuValues[token];
    return value === undefined ? match : String(value);
  });
}

/**
 * `next/navigation` factory. `notFound` throws `NEXT_NOT_FOUND` so the
 * page's `notFound()` branch is observable.
 */
export function nextNavigationFactory() {
  return {
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  };
}

export function i18nRoutingFactory() {
  return {
    routing: { locales: ["en", "es", "zh"], defaultLocale: "en" },
    Link: ({ children, href, ...props }: MockLinkProps) => (
      <a href={typeof href === "string" ? href : href.pathname} {...props}>
        {children}
      </a>
    ),
  };
}

export function nextIntlServerFactory() {
  return {
    getTranslations: vi.fn(
      ({ locale, namespace }: { locale: string; namespace: string }) =>
        (innerKey: string, values?: Record<string, string | number>) =>
          resolveMessage(locale, namespace, innerKey, values),
    ),
    setRequestLocale: vi.fn(),
  };
}

export function seoFactory() {
  return {
    JsonLdGraphScript: () => <script type="application/ld+json" />,
  };
}

type TrustModule = typeof import("@/components/trust");

/**
 * `@/components/trust` factory. The brand page composes async trust
 * Server Components that load i18n via `next/cache`; they have dedicated
 * coverage, so the page tests stub them. The `TrademarkDisclaimer` stub
 * surfaces `data-variant` + `data-brand` so the brand-notice (top) and
 * footer disclaimers stay distinguishable. `overrides` lets a single
 * file swap one stub without copying the whole block.
 */
export async function trustMockFactory(
  importOriginal: () => Promise<TrustModule>,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const actual = await importOriginal();
  return {
    ...actual,
    TrademarkDisclaimer: ({
      variant,
      brandName,
    }: {
      variant: string;
      brandName?: string;
    }) => (
      <div
        data-testid="trademark-disclaimer"
        data-variant={variant}
        data-brand={brandName ?? ""}
      >
        {brandName ? `notice:${brandName}` : `disclaimer:${variant}`}
      </div>
    ),
    NarrativeSection: ({
      eyebrow,
      title,
      body,
      cta,
      children,
    }: {
      eyebrow?: string;
      title: string;
      body?: string;
      cta?: { label: string; href: string };
      children?: ReactNode;
    }) => (
      <section data-testid="narrative-section">
        {eyebrow ? <p>{eyebrow}</p> : null}
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
        {children}
        {cta ? <a href={cta.href}>{cta.label}</a> : null}
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
    ...overrides,
  };
}

type BrandPageComponent = (props: {
  params: Promise<{ locale: string; brand: string }>;
}) => Promise<JSX.Element>;

/**
 * Render the real `BrandPage` Server Component for a locale + slug. The
 * caller passes its own `BrandPage` import so this module never imports
 * `../page` — safe to dynamic-`import()` inside a hoisted `vi.mock`
 * factory without a circular load before mocks apply.
 */
export async function renderBrandPage(
  BrandPage: BrandPageComponent,
  locale: string,
  brand: string,
) {
  const Page = await BrandPage({
    params: Promise.resolve({ locale, brand }),
  });
  return render(Page);
}
