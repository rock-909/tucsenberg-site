/**
 * Shared membrane product-page test harness.
 *
 * Phase-C added eight `__tests__/*.test.tsx` files that each copied a
 * byte-identical ~110-line mock block (link/navigation/i18n/seo/trust
 * stubs + a real-message `resolveMessage`). Per the repo testing rule
 * ("use shared test utilities instead of duplicating mock systems"),
 * that block lives here once.
 *
 * `vi.mock` is hoisted and per-file, so this module exports *factory*
 * functions that each test file passes to its own `vi.mock(...)` call,
 * plus a `resolveMessage` that reads the real split critical bundles and
 * a `renderProductPage` helper. The factories are pure (no file-local
 * closure), so a file needing a per-test override (e.g. a
 * MaterialDecisionCard spy) passes overrides into `trustMockFactory`.
 */
import type { AnchorHTMLAttributes, JSX, ReactNode } from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import enCritical from "../../../../../../messages/en/critical.json";
import esCritical from "../../../../../../messages/es/critical.json";
import zhCritical from "../../../../../../messages/zh/critical.json";

export const CANONICAL_D9_EPDM = "9-inch-epdm-disc-replacement";
export const CANONICAL_D9_TPU = "9-inch-tpu-disc-replacement";

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
 * Resolve a real message from the split critical bundles. A pass-through
 * `(key) => key` mock could not catch a hardcoded-literal regression, so
 * the harness keeps the real-bundle resolution every Phase-C test relied
 * on. Both the (locale, namespace, key) and (namespace, key) call shapes
 * are supported; the 2-arg form defaults to the `en` bundle.
 */
export function resolveMessage(
  localeOrNamespace: string,
  namespaceOrKey: string,
  key?: string,
): string {
  const locale = key === undefined ? "en" : localeOrNamespace;
  const namespace = key === undefined ? localeOrNamespace : namespaceOrKey;
  const leaf = key === undefined ? namespaceOrKey : key;
  const path = `${namespace}.${leaf}`.split(".");
  let node: unknown = CRITICAL_BY_LOCALE[locale] ?? CRITICAL_BY_LOCALE.en;
  for (const segment of path) {
    if (typeof node !== "object" || node === null) return path.join(".");
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === "string" ? node : path.join(".");
}

/**
 * `next/navigation` factory. `permanentRedirect` accepts an optional
 * caller-supplied spy so the regression-fence file can assert the 308
 * target while every other file just needs the throw behavior.
 */
export function nextNavigationFactory(
  permanentRedirectSpy?: (url: string) => void,
) {
  return {
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    permanentRedirect: (url: string) => {
      permanentRedirectSpy?.(url);
      throw new Error("NEXT_REDIRECT");
    },
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
        (innerKey: string) =>
          resolveMessage(locale, namespace, innerKey),
    ),
    setRequestLocale: vi.fn(),
  };
}

export function seoFactory() {
  return {
    JsonLdGraphScript: () => <script type="application/ld+json" />,
  };
}

export function compatibilitySectionFactory() {
  return {
    CompatibilitySection: () => <section data-testid="compatibility-section" />,
  };
}

type TrustModule = typeof import("@/components/trust");

/**
 * `@/components/trust` factory. The Phase-C page composes async trust
 * Server Components that load i18n via `next/cache`; they have dedicated
 * coverage, so the page tests stub them. `overrides` lets a single file
 * swap one stub (e.g. a MaterialDecisionCard prop spy) without copying
 * the whole block. Must be called from inside the file's own
 * `vi.mock("@/components/trust", async (importOriginal) => ...)`.
 */
export async function trustMockFactory(
  importOriginal: () => Promise<TrustModule>,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const actual = await importOriginal();
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
    ...overrides,
  };
}

type ProductPageComponent = (props: {
  params: Promise<{ locale: string; product: string }>;
}) => Promise<JSX.Element>;

/**
 * Render the real `ProductPage` Server Component for a locale + slug. The
 * caller passes its own `ProductPage` import so this module never imports
 * `../page` — keeping it safe to dynamic-`import()` inside a hoisted
 * `vi.mock` factory without a circular load before mocks apply.
 */
export async function renderProductPage(
  ProductPage: ProductPageComponent,
  locale: string,
  product: string,
) {
  const Page = await ProductPage({
    params: Promise.resolve({ locale, product }),
  });
  return render(Page);
}
