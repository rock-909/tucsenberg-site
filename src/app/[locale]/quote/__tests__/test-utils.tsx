/**
 * Shared quote (RFQ) page test harness — Phase 4.1 Phase E (R13).
 *
 * Phase E wraps the BYTE-FROZEN RFQ form with Phase-A narrative/trust
 * Server Components. Each new `__tests__/*.test.tsx` would otherwise copy
 * the same i18n/seo/turnstile/trust mock block, so per the repo testing
 * rule ("use shared test utilities instead of duplicating mock systems")
 * that block lives here once, mirroring the Phase-C/D
 * `membranes/[product]/__tests__/test-utils.tsx` template:
 *
 * - real-bundle `resolveMessage` (a pass-through `(k) => k` mock could not
 *   catch a hardcoded-literal regression; the real split-critical bundles
 *   are read so a missing/English-identical leaf is caught);
 * - dependency-inverted page-render helpers (the caller passes its own
 *   `QuotePage` / `QuoteFormSection` import so this module never imports
 *   `../page`, keeping it safe inside a hoisted `vi.mock` factory);
 * - per-module `vi.mock` factory functions (pure, no file-local closure);
 * - a `trustMockFactory` with an `overrides` bag that surfaces
 *   `data-variant` / `data-layout` so a single file can pin one stub
 *   without re-copying the whole block.
 *
 * The REAL trust components are exercised by Phase-A's
 * `src/components/trust/**` suite and the E10 production build; here they
 * are lightweight async stubs that echo a recognizable prop.
 */
import { useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import enCritical from "../../../../../messages/en/critical.json";
import esCritical from "../../../../../messages/es/critical.json";
import zhCritical from "../../../../../messages/zh/critical.json";

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
 * Resolve a real message from the split critical bundles. Supports both
 * the next-intl server `getTranslations({ locale, namespace })` and the
 * `next-intl` client `useTranslations(namespace)` call shapes. The 2-arg
 * form defaults to the `en` bundle. Returns the dotted path on a miss so
 * a dropped key is visibly wrong rather than silently empty.
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

type RichChunk = (chunks: ReactNode) => ReactNode;
type RichValues = Record<string, string | RichChunk>;

/**
 * Build a translator for a `quote.*` (or nested) namespace.
 *
 * - `t(key)` resolves the real EN leaf for that namespace.
 * - `t(key, { email })` appends `:email` (the frozen success/description
 *   ICU substitution the existing page test asserts).
 * - `t.rich(key, { privacyLink })` renders the real EN template, calling
 *   the supplied chunk function for the `<privacyLink>…</privacyLink>`
 *   slot so the consent line's link target can be asserted.
 */
export function makeQuoteTranslator(locale: string, namespace?: string) {
  const scope = namespace ?? "";
  const full = (k: string) => (scope ? `${scope}.${k}` : k);

  const translate = (key: string, values?: Record<string, string>) => {
    const resolved = resolveMessage(locale, full(key), "");
    const base = resolved || full(key);
    return values?.email ? `${base}:${values.email}` : base;
  };

  const rich = (key: string, values: RichValues) => {
    const template = resolveMessage(locale, full(key), "") || full(key);
    // Split on the rich tag pair, e.g. "<privacyLink>Label</privacyLink>".
    const parts: ReactNode[] = [];
    const re = /<(\w+)>(.*?)<\/\1>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let i = 0;
    while ((match = re.exec(template)) !== null) {
      if (match.index > lastIndex) {
        parts.push(template.slice(lastIndex, match.index));
      }
      const tag = match[1] as string;
      const inner = match[2] as string;
      const chunk = values[tag];
      parts.push(
        typeof chunk === "function" ? (
          <span key={`r${(i += 1)}`}>{chunk(inner)}</span>
        ) : (
          inner
        ),
      );
      lastIndex = re.lastIndex;
    }
    if (lastIndex < template.length) parts.push(template.slice(lastIndex));
    return <>{parts}</>;
  };

  return Object.assign(translate, { rich });
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
      ({ locale, namespace }: { locale: string; namespace?: string }) =>
        makeQuoteTranslator(locale, namespace),
    ),
    setRequestLocale: vi.fn(),
  };
}

export function nextIntlClientFactory() {
  return {
    useTranslations: vi.fn((namespace?: string) =>
      makeQuoteTranslator("en", namespace),
    ),
  };
}

export function seoFactory() {
  return {
    JsonLdGraphScript: () => <script type="application/ld+json" />,
  };
}

/**
 * Stub the lazy Turnstile network island. Each mounted instance gets a
 * stable id (lazy `useState`), so a React `key` bump → remount → new
 * token, letting the freeze-sensitive token-preservation behavior be
 * asserted exactly as the original page test did.
 */
let turnstileMountCount = 0;
export function resetTurnstileMountCount() {
  turnstileMountCount = 0;
}
function MockTurnstile({ onSuccess }: { onSuccess?: (token: string) => void }) {
  const [mountId] = useState(() => (turnstileMountCount += 1));
  return (
    <button
      type="button"
      data-testid="mock-turnstile"
      onClick={() => onSuccess?.(`test-turnstile-token-${mountId}`)}
    >
      verify
    </button>
  );
}
export function lazyTurnstileFactory() {
  return {
    LazyTurnstile: (props: { onSuccess?: (token: string) => void }) => (
      <MockTurnstile {...props} />
    ),
  };
}

type TrustModule = typeof import("@/components/trust");

/**
 * `@/components/trust` factory. The Phase-E page composes the six async
 * trust Server Components; they have dedicated Phase-A coverage and are
 * re-proven by the E10 build, so the page tests stub them to lightweight
 * markers that echo a recognizable prop (`data-variant` / `data-layout`,
 * title text). `overrides` swaps a single stub without copying the block.
 * Must be called from inside the file's own
 * `vi.mock("@/components/trust", async (importOriginal) => ...)`.
 */
export async function trustMockFactory(
  importOriginal: () => Promise<TrustModule>,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const actual = await importOriginal();
  return {
    ...actual,
    NarrativeSection: ({
      eyebrow,
      title,
      body,
      children,
    }: {
      eyebrow?: string;
      title: string;
      body?: string;
      children?: ReactNode;
    }) => (
      <section data-testid="narrative-section" data-eyebrow={eyebrow}>
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
        {children}
      </section>
    ),
    MaterialDecisionCard: ({
      defaultMaterial,
    }: {
      defaultMaterial?: string;
    }) => (
      <section
        data-testid="material-decision-card"
        data-default-material={defaultMaterial}
      />
    ),
    SlaCommitments: ({ layout }: { layout: string }) => (
      <ul data-testid="sla-commitments" data-layout={layout} />
    ),
    CompatibilityProofBox: () => (
      <section data-testid="compatibility-proof-box" />
    ),
    BatchControlsBlock: () => <section data-testid="batch-controls-block" />,
    TrademarkDisclaimer: ({ variant }: { variant: string }) => (
      <div data-testid="trademark-disclaimer" data-variant={variant} />
    ),
    ...overrides,
  };
}

type QuotePageComponent = (props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string>>;
}) => Promise<React.JSX.Element>;

type QuoteFormSectionComponent = (props: {
  searchParams: Promise<Record<string, string>>;
}) => Promise<React.JSX.Element>;

/**
 * Render the real `QuotePage` Server Component for a locale. The caller
 * passes its own `QuotePage` import so this module never imports
 * `../page` directly.
 */
export async function renderQuotePage(
  QuotePage: QuotePageComponent,
  locale = "en",
  searchParams: Record<string, string> = {},
) {
  const ui = await QuotePage({
    params: Promise.resolve({ locale }),
    searchParams: Promise.resolve(searchParams),
  });
  return render(ui);
}

/**
 * The page wraps the searchParams-consuming form in `<Suspense>`. RTL
 * cannot resolve an async Server Component inside Suspense, so form
 * behaviors render the resolved `QuoteFormSection` directly while the
 * static narrative/trust composition is checked via the page.
 */
export async function renderQuoteForm(
  QuoteFormSection: QuoteFormSectionComponent,
  searchParams: Record<string, string> = {},
) {
  const section = await QuoteFormSection({
    searchParams: Promise.resolve(searchParams),
  });
  return render(section);
}
