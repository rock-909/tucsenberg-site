import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import {
  generateMetadataForPath,
  type Locale as SeoLocale,
} from "@/lib/seo-metadata";
import {
  ProductLaunchBoundary,
  ProductLineCards,
  ProductOverviewPath,
  ProductsPageCta,
} from "@/app/[locale]/products/products-overview-sections";
import { getLocalizedPath } from "@/config/paths";
import { CatalogBreadcrumb } from "@/components/products/catalog-breadcrumb";
import { buildCatalogBreadcrumbJsonLd } from "@/components/products/catalog-breadcrumb-jsonld";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface ProductsPageProps {
  params: Promise<LocaleParam>;
}

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });

  return generateMetadataForPath({
    locale: locale as SeoLocale,
    pageType: "products",
    path: getLocalizedPath("products", locale as SeoLocale),
    config: {
      title: t("overview.title"),
      description: t("overview.description"),
    },
  });
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, breadcrumbSchema] = await Promise.all([
    getTranslations({ locale, namespace: "catalog" }),
    buildCatalogBreadcrumbJsonLd({}),
  ]);
  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-12">
      <JsonLdGraphScript
        locale={locale as SeoLocale}
        data={[breadcrumbSchema]}
      />
      <CatalogBreadcrumb renderJsonLd={false} homePrefetch={false} />

      <header className="mb-12 md:mb-16">
        <h1 className="text-heading mb-5">{t("overview.title")}</h1>
        <p className="text-body max-w-3xl text-muted-foreground">
          {t("overview.description")}
        </p>
      </header>

      <ProductLineCards translate={t} />
      <ProductOverviewPath translate={t} />
      <ProductLaunchBoundary translate={t} />
      <ProductsPageCta
        title={t("cta.title")}
        description={t("cta.description")}
        guideLabel={t("cta.resources")}
        requestQuoteLabel={t("cta.contact")}
      />
    </div>
  );
}
