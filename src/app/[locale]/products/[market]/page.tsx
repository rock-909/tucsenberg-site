import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getAllMarketSlugs,
  getMarketBySlug,
  isValidMarketSlug,
} from "@/constants/product-catalog";
import { SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION } from "@/config/single-site-page-expression";
import { SITE_CONFIG } from "@/config/paths";
import { getProductMarketPath } from "@/config/paths/utils";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import { JsonLdGraphScript } from "@/components/seo";
import { CatalogBreadcrumb } from "@/components/products/catalog-breadcrumb";
import { StickyFamilyNav } from "@/components/products/sticky-family-nav";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/types/content.types";
import { buildMarketPageJsonLdData } from "@/app/[locale]/products/[market]/market-jsonld";
import { getMarketPageData } from "@/app/[locale]/products/[market]/market-page-data";
import {
  CtaSection,
  FamilySections,
  MarketHero,
  TrustSignalsSection,
} from "@/app/[locale]/products/[market]/market-page-sections";
import { buildTrustSignalsViewModel } from "@/app/[locale]/products/[market]/market-spec-presenter";

export function generateStaticParams() {
  const markets = getAllMarketSlugs();
  return routing.locales.flatMap((locale) =>
    markets.map((market) => ({ locale, market })),
  );
}

interface MarketPageProps {
  params: Promise<{ locale: string; market: string }>;
}

export async function generateMetadata({
  params,
}: MarketPageProps): Promise<Metadata> {
  const { locale, market: marketSlug } = await params;
  const market = getMarketBySlug(marketSlug);

  if (!market) return {};

  const t = await getTranslations({ locale, namespace: "catalog" });
  const marketLabel = t(`markets.${marketSlug}.label`);
  const marketDescription = t(`markets.${marketSlug}.description`);

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "products",
    path: getProductMarketPath(market.slug),
    config: {
      title: `${marketLabel} | ${SITE_CONFIG.name}`,
      description: marketDescription,
    },
  });
}

export default async function MarketPage({ params }: MarketPageProps) {
  const { locale, market: marketSlug } = await params;
  setRequestLocale(locale);

  if (!isValidMarketSlug(marketSlug)) {
    notFound();
  }

  const pageData = getMarketPageData(marketSlug);
  const t = await getTranslations({ locale, namespace: "catalog" });
  const marketLabel = t(`markets.${marketSlug}.label`);
  const marketDescription = t(`markets.${marketSlug}.description`);
  const marketUrl = `${SITE_CONFIG.baseUrl}/${locale}${getProductMarketPath(
    pageData.market.slug,
  )}`;
  const jsonLdData = await buildMarketPageJsonLdData({
    data: {
      families: pageData.families,
      familySpecsMap: pageData.familySpecsMap,
      market: pageData.market,
    },
    labels: {
      marketLabel,
      marketDescription,
    },
    marketUrl,
    t,
  });

  return (
    <div
      className="mx-auto max-w-[1080px] px-6 py-8 md:py-12"
      data-testid="market-page-content"
    >
      <JsonLdGraphScript locale={locale as Locale} data={jsonLdData} />
      <CatalogBreadcrumb
        market={pageData.market}
        marketLabel={marketLabel}
        renderJsonLd={false}
      />

      <MarketHero
        standardLabel={pageData.market.standardLabel}
        marketLabel={marketLabel}
        marketDescription={marketDescription}
      />

      {pageData.marketSpecs ? (
        <StickyFamilyNav
          families={pageData.families.flatMap((family) =>
            pageData.familySpecsMap.has(family.slug)
              ? [
                  {
                    slug: family.slug,
                    label: t(`families.${marketSlug}.${family.slug}.label`),
                  },
                ]
              : [],
          )}
          ariaLabel={t("market.familyNav.jumpTo")}
        />
      ) : null}

      <div className="space-y-16">
        <FamilySections
          families={pageData.families}
          familySpecsMap={pageData.familySpecsMap}
          marketSlug={marketSlug}
          t={t}
        />
      </div>

      {!pageData.marketSpecs ? (
        <section className="mb-12 rounded-lg border border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">{t("market.cta.description")}</p>
        </section>
      ) : null}

      {pageData.marketSpecs ? (
        <TrustSignalsSection
          {...buildTrustSignalsViewModel(pageData.marketSpecs, marketSlug, t)}
        />
      ) : null}

      <CtaSection
        heading={t("market.cta.heading", { marketLabel })}
        description={t("market.cta.description")}
        buttonText={t("market.cta.button")}
        href={SINGLE_SITE_PRODUCTS_PAGE_EXPRESSION.marketLanding.ctaHref}
      />
    </div>
  );
}
