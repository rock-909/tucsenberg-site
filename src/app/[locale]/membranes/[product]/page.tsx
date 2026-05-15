import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  canonicalProductSlug,
  getProductCompatibilityByCanonicalSlug,
  productVariants,
  resolveCanonicalProductSlugFromSku,
} from "@/data/product-compatibility";
import { getMembraneProductPath } from "@/config/paths/utils";
import { Button } from "@/components/ui/button";
import { JsonLdGraphScript } from "@/components/seo";
import { CompatibilitySection } from "@/app/[locale]/membranes/[product]/compatibility-section";
import { localizeText } from "@/lib/i18n/localize-text";
import { Link, routing } from "@/i18n/routing";
import type { Locale } from "@/lib/seo-metadata";

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

  return {
    title: localizeText(entry.name, locale),
    description: t("compatibility.description"),
  };
}

function diameterFor(productVariantId: string): string | undefined {
  return productVariants.find((variant) => variant.id === productVariantId)
    ?.specs.diameter;
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
  const diameter = diameterFor(entry.productVariantId);

  const specs: { label: string; value: string; mono?: boolean }[] = [
    ...(diameter
      ? [{ label: t("hero.specBar.diameter"), value: diameter }]
      : []),
    { label: t("hero.specBar.material"), value: entry.material.toUpperCase() },
    {
      label: t("hero.specBar.category"),
      value: entry.category === "disc" ? "Disc" : "Tube",
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

      <section className="px-6 pt-20 pb-14 md:pt-24">
        <div className="mx-auto max-w-[1080px]">
          <p className="font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
            {t("hero.overline")}
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

      <CompatibilitySection entry={entry} locale={locale} />

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-4">
          <Button size="lg" asChild>
            <Link href={quoteHref as "/"}>{t("cta.requestQuote")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
