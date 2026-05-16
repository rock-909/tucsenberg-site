import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBrandCompatibility, oemBrands } from "@/data/product-compatibility";
import { JsonLdGraphScript } from "@/components/seo";
import {
  CONFIDENCE_TONE,
  FIT_STATUS_TONE,
} from "@/components/compatibility/status-badge";
import {
  BrandCompatibilityFilter,
  type FilterLabels,
  type ModelVM,
} from "@/app/[locale]/compatible/[brand]/brand-compatibility-filter";
import { localizeText } from "@/lib/i18n/localize-text";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/seo-metadata";

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
    oemBrands.map((brand) => ({ locale, brand: brand.slug })),
  );
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { locale, brand } = await params;
  const entry = getBrandCompatibility(brand);

  if (!entry) return {};

  const t = await getTranslations({ locale, namespace: "compatibleBrand" });

  return {
    title: entry.brandName,
    description: t("hero.description", { brand: entry.brandName }),
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { locale, brand } = await params;
  setRequestLocale(locale);

  const entry = getBrandCompatibility(brand);
  if (!entry) {
    notFound();
  }

  const [t, tProduct] = await Promise.all([
    getTranslations({ locale, namespace: "compatibleBrand" }),
    getTranslations({ locale, namespace: "membraneProduct" }),
  ]);

  const vmContext: BrandVMContext = {
    brandSlug: entry.brandSlug,
    locale,
    tProduct,
  };
  const models: ModelVM[] = entry.models.map((model) =>
    buildModelVM(model, vmContext),
  );

  const labels: FilterLabels = {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLdGraphScript locale={locale as Locale} />

      <section className="px-6 pt-16 pb-4">
        <div className="mx-auto max-w-[1080px]">
          <p className="font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
            {t("hero.overline")}
          </p>
          <h1 className="mt-3 text-[32px] leading-[1.1] font-light tracking-[-0.01em] text-primary md:text-[48px]">
            {entry.brandName}
          </h1>
          <p className="mt-3 max-w-[60ch] text-muted-foreground">
            {t("hero.description", { brand: entry.brandName })}
          </p>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-[1080px] rounded-[8px] border border-border bg-card p-5">
          <p className="text-xs tracking-[0.4px] text-muted-foreground uppercase">
            {t("disclaimer")}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {localizeText(entry.trademarkDisclaimer, locale)}
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-[1080px]">
          <BrandCompatibilityFilter models={models} labels={labels} />
        </div>
      </section>
    </div>
  );
}
