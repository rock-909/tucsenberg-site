import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  canonicalProductSlug,
  canonicalProductSlugForVariantId,
  getFeaturedProductFacts,
  getProductCompatibilityByCanonicalSlug,
  productVariants,
  resolveCanonicalProductSlugFromSku,
} from "@/data/product-compatibility";
import { getMembraneProductPath } from "@/config/paths/utils";
import { Button } from "@/components/ui/button";
import { JsonLdGraphScript } from "@/components/seo";
import {
  BatchControlsBlock,
  CompatibilityProofBox,
  MaterialDecisionCard,
  NarrativeSection,
  SlaCommitments,
  TrademarkDisclaimer,
} from "@/components/trust";
import { CompatibilitySection } from "@/app/[locale]/membranes/[product]/compatibility-section";
import { localizeText } from "@/lib/i18n/localize-text";
import { Link, routing } from "@/i18n/routing";
import {
  generateMetadataForDynamicPath,
  type Locale,
} from "@/lib/seo-metadata";

interface ProductPageProps {
  params: Promise<{ locale: string; product: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    productVariants.map((variant) => ({
      locale,
      product: canonicalProductSlug(variant),
    })),
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, product } = await params;
  const entry = getProductCompatibilityByCanonicalSlug(product);

  if (!entry) return {};

  const t = await getTranslations({ locale, namespace: "membraneProduct" });

  // Canonical/hreflang must point at the descriptive-slug URL (the 308
  // redirect target), never a SKU slug. Resolve from the variant id so the
  // canonical is correct even if the route param ever differs.
  const canonicalSlug =
    canonicalProductSlugForVariantId(entry.productVariantId) ?? product;

  return generateMetadataForDynamicPath({
    locale: locale as Locale,
    path: getMembraneProductPath(canonicalSlug),
    config: {
      title: localizeText(entry.name, locale),
      description: t("compatibility.description"),
    },
  });
}

function diameterFor(productVariantId: string): string | undefined {
  return productVariants.find((variant) => variant.id === productVariantId)
    ?.specs.diameter;
}

// Fixed confirm-fit input order. The MaterialDecisionCard owns the
// EPDM/TPU trigger copy (Phase-A trust.*); this page never re-lists it.
const CONFIRM_FIT_STEP_KEYS = [
  "partNumber",
  "dimensions",
  "mounting",
  "material",
  "perforation",
  "release",
] as const;

interface SpecField {
  label: string;
  value: string;
  mono?: boolean;
}

// Hero presenter: overline + product name + the data-only spec strip. Kept
// as a local component so the page function stays route orchestration.
function HeroSpecStrip({
  overline,
  productName,
  specs,
}: {
  overline: string;
  productName: string;
  specs: SpecField[];
}) {
  return (
    <section className="px-6 pt-20 pb-14 md:pt-24">
      <div className="mx-auto max-w-[1080px]">
        <p className="font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
          {overline}
        </p>
        <h1 className="mt-3 text-[32px] leading-[1.1] font-light tracking-[-0.01em] text-primary md:text-[48px]">
          {productName}
        </h1>

        <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-border bg-border md:grid-cols-4">
          {specs.map((spec) => (
            <div key={spec.label} className="bg-card p-5">
              <dt className="text-xs tracking-[0.4px] text-muted-foreground uppercase">
                {spec.label}
              </dt>
              <dd
                className={
                  spec.mono
                    ? "mt-2 font-mono text-[14px] tabular-nums text-foreground"
                    : "mt-2 text-sm font-medium text-foreground"
                }
              >
                {spec.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, product } = await params;
  setRequestLocale(locale);

  const entry = getProductCompatibilityByCanonicalSlug(product);
  if (!entry) {
    // Legacy SKU slug (datasheet / QR / already-shared link): permanently
    // redirect to the canonical descriptive URL so it never 404s and link
    // equity consolidates. 308 in this server context; ships in the static
    // build (no next.config redirects() needed for OpenNext Cloudflare).
    const canonicalSlug = resolveCanonicalProductSlugFromSku(product);
    if (canonicalSlug) {
      permanentRedirect(`/${locale}${getMembraneProductPath(canonicalSlug)}`);
    }
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "membraneProduct" });
  const productName = localizeText(entry.name, locale);

  // The featured variant's diameter is owned by the frozen
  // `getFeaturedProductFacts()` accessor (single source of truth for the
  // launch hero spec). Other variants keep the variant-spec lookup.
  const featured = getFeaturedProductFacts();
  const diameter =
    entry.sku === featured.sku
      ? featured.diameter
      : diameterFor(entry.productVariantId);

  const specs: SpecField[] = [
    ...(diameter
      ? [{ label: t("hero.specBar.diameter"), value: diameter }]
      : []),
    { label: t("hero.specBar.material"), value: entry.material.toUpperCase() },
    {
      label: t("hero.specBar.category"),
      value:
        entry.category === "disc"
          ? t("hero.specBar.categoryValues.disc")
          : t("hero.specBar.categoryValues.tube"),
    },
    { label: t("hero.specBar.sku"), value: entry.sku, mono: true },
  ];

  // `?sku=` carries the real SKU for the RFQ (quote form reads `sku`).
  // `?product=` carries the canonical descriptive slug for display/context.
  const quoteHref =
    `/quote?sku=${encodeURIComponent(entry.sku)}` +
    `&product=${encodeURIComponent(product)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLdGraphScript locale={locale as Locale} />

      <HeroSpecStrip
        overline={t("hero.overline")}
        productName={productName}
        specs={specs}
      />

      <NarrativeSection
        eyebrow={t("useCase.eyebrow")}
        title={t("useCase.title")}
        body={t("useCase.body")}
      />

      <NarrativeSection
        eyebrow={t("materialFit.eyebrow")}
        title={t("materialFit.title")}
        body={t("materialFit.body")}
      >
        <MaterialDecisionCard
          locale={locale as Locale}
          defaultMaterial="epdm"
        />
      </NarrativeSection>

      <NarrativeSection
        eyebrow={t("confirmFit.eyebrow")}
        title={t("confirmFit.title")}
        body={t("confirmFit.body")}
      >
        <ol className="space-y-3 text-muted-foreground">
          {CONFIRM_FIT_STEP_KEYS.map((key) => (
            <li key={key}>{t(`confirmFit.steps.${key}`)}</li>
          ))}
        </ol>
      </NarrativeSection>

      <CompatibilitySection entry={entry} locale={locale} />

      <NarrativeSection
        eyebrow={t("leadTime.eyebrow")}
        title={t("leadTime.title")}
        body={t("leadTime.body")}
      />

      <NarrativeSection eyebrow={t("qc.eyebrow")} title={t("qc.title")}>
        <BatchControlsBlock locale={locale as Locale} />
        <p className="mt-6 text-muted-foreground">{t("qc.sampleNote")}</p>
      </NarrativeSection>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[1080px] rounded-[12px] border border-border bg-card p-8 md:p-10">
          <span className="block text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {t("quote.eyebrow")}
          </span>
          <h2 className="type-heading-02 mt-2">{t("quote.title")}</h2>
          <p className="mt-4 max-w-[640px] text-muted-foreground">
            {t("quote.body")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <Link href={quoteHref as "/"}>{t("cta.requestQuote")}</Link>
            </Button>
            <a
              href={`mailto:${t("quote.email")}`}
              className="text-sm font-medium text-[var(--color-brand-accent)]"
            >
              {t("quote.email")}
            </a>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <CompatibilityProofBox locale={locale as Locale} />
            <SlaCommitments locale={locale as Locale} layout="stacked" />
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[1080px]">
          <TrademarkDisclaimer locale={locale as Locale} variant="inline" />
        </div>
      </section>
    </div>
  );
}
