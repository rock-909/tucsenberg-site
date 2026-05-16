import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getBrandCompatibility,
  getBrandPathStats,
  getOemBrandFacts,
} from "@/data/product-compatibility";
import { JsonLdGraphScript } from "@/components/seo";
import {
  CONFIDENCE_TONE,
  FIT_STATUS_TONE,
} from "@/components/compatibility/status-badge";
import {
  BatchControlsBlock,
  CompatibilityProofBox,
  MaterialDecisionCard,
  NarrativeSection,
  SlaCommitments,
  TrademarkDisclaimer,
} from "@/components/trust";
import {
  BrandCompatibilityFilter,
  type FilterLabels,
  type ModelVM,
} from "@/app/[locale]/compatible/[brand]/brand-compatibility-filter";
import { getCompatibleBrandPath } from "@/config/paths/utils";
import { localizeText } from "@/lib/i18n/localize-text";
import { Link, routing } from "@/i18n/routing";
import {
  generateMetadataForDynamicPath,
  type Locale,
} from "@/lib/seo-metadata";

interface BrandPageProps {
  params: Promise<{ locale: string; brand: string }>;
}

type BrandEntry = NonNullable<ReturnType<typeof getBrandCompatibility>>;
type BrandModel = BrandEntry["models"][number];
type CompatibleProduct = BrandModel["compatibleProducts"][number];
type ProductTranslator = Awaited<ReturnType<typeof getTranslations>>;

interface BrandVMContext {
  brandSlug: string;
  locale: string;
  tProduct: ProductTranslator;
}

function buildProductVM(
  product: CompatibleProduct,
  model: BrandModel,
  ctx: BrandVMContext,
): ModelVM["products"][number] {
  const { brandSlug, locale, tProduct } = ctx;
  return {
    id: product.id,
    name: localizeText(product.name, locale),
    sku: product.sku,
    material: product.material,
    fitStatusLabel: tProduct(`compatibility.fitStatus.${product.fitStatus}`),
    fitStatusTone: FIT_STATUS_TONE[product.fitStatus] ?? "neutral",
    confidenceLabel: tProduct(`compatibility.confidence.${product.confidence}`),
    confidenceTone: CONFIDENCE_TONE[product.confidence] ?? "neutral",
    checks: product.requiredChecks.map((check) => localizeText(check, locale)),
    disclaimer: localizeText(product.disclaimer, locale),
    quoteHref:
      `/quote?brand=${encodeURIComponent(brandSlug)}` +
      `&model=${encodeURIComponent(model.modelSlug)}` +
      `&product=${encodeURIComponent(localizeText(product.name, locale))}` +
      `&partNumber=${encodeURIComponent(
        model.oemPartNumbers[0] ?? model.modelSlug,
      )}`,
  };
}

function buildFilterLabels(
  t: ProductTranslator,
  tProduct: ProductTranslator,
): FilterLabels {
  return {
    all: t("filter.all"),
    disc: t("filter.disc"),
    tube: t("filter.tube"),
    materialLabel: t("filter.material"),
    materialAll: t("filter.materialAll"),
    materialEpdm: "EPDM",
    materialTpu: "TPU",
    partNumbers: t("results.partNumbers"),
    crossRefNote: tProduct("compatibility.crossRefNote"),
    compatibleProduct: t("results.compatibleProduct"),
    requiredChecks: t("results.requiredChecks"),
    noChecksRequired: t("results.noChecksRequired"),
    requestQuote: t("results.requestQuote"),
    empty: t("results.empty"),
  };
}

function buildModelVM(model: BrandModel, ctx: BrandVMContext): ModelVM {
  return {
    modelId: model.modelId,
    modelName: model.modelName,
    category: model.category,
    oemPartNumbers: model.oemPartNumbers,
    products: model.compatibleProducts.map((product) =>
      buildProductVM(product, model, ctx),
    ),
  };
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getOemBrandFacts().map((brand) => ({ locale, brand: brand.slug })),
  );
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { locale, brand } = await params;
  const entry = getBrandCompatibility(brand);

  if (!entry) return {};

  const t = await getTranslations({ locale, namespace: "compatibleBrand" });

  return generateMetadataForDynamicPath({
    locale: locale as Locale,
    path: getCompatibleBrandPath(entry.brandSlug),
    config: {
      title: entry.brandName,
      description: t("hero.description", { brand: entry.brandName }),
    },
  });
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale, brand } = await params;
  setRequestLocale(locale);

  // Resolve the frozen brand fact first: it owns the display name and the
  // documented compatibility-path counts (single source of truth). The
  // per-mapping `getBrandCompatibility` view still drives the model rows.
  const brandFact = getOemBrandFacts().find((b) => b.slug === brand);
  if (!brandFact) {
    notFound();
  }

  const entry = getBrandCompatibility(brand);
  if (!entry) {
    notFound();
  }

  const stats = getBrandPathStats(brandFact.id);

  const [t, tProduct] = await Promise.all([
    getTranslations({ locale, namespace: "compatibleBrand" }),
    getTranslations({ locale, namespace: "membraneProduct" }),
  ]);

  const vmContext: BrandVMContext = {
    brandSlug: brandFact.slug,
    locale,
    tProduct,
  };
  const models: ModelVM[] = entry.models.map((model) =>
    buildModelVM(model, vmContext),
  );

  const labels = buildFilterLabels(t, tProduct);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLdGraphScript locale={locale as Locale} />

      <section className="px-6 pt-10">
        <div className="mx-auto max-w-[1080px]">
          <TrademarkDisclaimer
            locale={locale as Locale}
            variant="brand-notice"
            brandName={brandFact.displayName}
          />
        </div>
      </section>

      <section className="px-6 pt-16 pb-4">
        <div className="mx-auto max-w-[1080px]">
          <p className="font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
            {t("hero.overline")}
          </p>
          <h1 className="mt-3 text-[32px] leading-[1.1] font-light tracking-[-0.01em] text-primary md:text-[48px]">
            {brandFact.displayName}
          </h1>
          <p className="mt-3 max-w-[60ch] text-muted-foreground">
            {t("hero.description", { brand: brandFact.displayName })}
          </p>
        </div>
      </section>

      <NarrativeSection
        eyebrow={t("boundary.eyebrow")}
        title={t("boundary.title", { brand: brandFact.displayName })}
        body={t("boundary.body", { brand: brandFact.displayName })}
      />

      <NarrativeSection
        eyebrow={t("intake.eyebrow")}
        title={t("intake.title")}
        body={t("intake.body", { brand: brandFact.displayName })}
      />

      <section className="px-6 py-14 md:py-[72px]">
        <div className="mx-auto max-w-[1080px]">
          <p
            data-testid="brand-stats"
            className="font-mono text-[13px] tabular-nums text-muted-foreground"
          >
            {t("stats.summary", { paths: stats.paths })} ·{" "}
            {t("stats.epdm", { epdm: stats.epdm })} ·{" "}
            {t("stats.tpu", { tpu: stats.tpu })}
          </p>
          <div className="mt-9">
            <BrandCompatibilityFilter models={models} labels={labels} />
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-[72px]">
        <div className="mx-auto max-w-[1080px]">
          <MaterialDecisionCard locale={locale as Locale} />
        </div>
      </section>

      <section className="px-6 py-14 md:py-[72px]">
        <div className="mx-auto grid max-w-[1080px] gap-6 md:grid-cols-2">
          <CompatibilityProofBox locale={locale as Locale} />
          <BatchControlsBlock locale={locale as Locale} />
        </div>
      </section>

      <NarrativeSection
        eyebrow={t("cta.eyebrow")}
        title={t("cta.title")}
        body={t("cta.body", { brand: brandFact.displayName })}
      >
        <div className="flex flex-col gap-8">
          <Link
            href={`/quote?brand=${encodeURIComponent(brandFact.slug)}` as "/"}
            className="inline-block w-fit text-sm font-semibold text-[var(--color-brand-accent)] hover:underline"
          >
            {t("cta.action")}
          </Link>
          <SlaCommitments locale={locale as Locale} layout="stacked" />
        </div>
      </NarrativeSection>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[1080px]">
          <TrademarkDisclaimer
            locale={locale as Locale}
            variant="footer"
            brandName={brandFact.displayName}
          />
        </div>
      </section>
    </div>
  );
}
