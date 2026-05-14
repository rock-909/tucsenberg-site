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
import { getLocalizedPath } from "@/config/paths";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import {
  CatalogBreadcrumb,
  buildCatalogBreadcrumbJsonLd,
} from "@/components/products/catalog-breadcrumb";
import { JsonLdGraphScript } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const RESULT_CAPABILITY_KEYS = [
  "siteFoundation",
  "replacementSurface",
  "inquiryPath",
  "launchPath",
] as const;

const TECHNICAL_PROOF_KEYS = [
  "next",
  "cloudflare",
  "i18n",
  "quality",
  "security",
  "traffic",
] as const;

const BOUNDARY_KEYS = ["content", "assets", "legal", "deployment"] as const;

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
      <CatalogBreadcrumb renderJsonLd={false} />

      <header className="mb-12 md:mb-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t("overview.kicker")}
        </p>
        <h1 className="text-heading mb-5">{t("overview.title")}</h1>
        <p className="text-body max-w-3xl text-muted-foreground">
          {t("overview.description")}
        </p>
      </header>

      <section data-section="product-starter-capabilities" className="mb-16">
        <div className="max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-[-0.03em]">
            {t("overview.capabilitiesTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("overview.capabilitiesDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {RESULT_CAPABILITY_KEYS.map((key) => (
            <article
              key={key}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="mb-3 text-xl font-semibold">
                {t(`starterCapabilities.${key}.title`)}
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {t(`starterCapabilities.${key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        data-section="product-technical-proof"
        className="mb-16 rounded-2xl border border-border bg-muted/40 p-6 md:p-8"
      >
        <div className="max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-[-0.03em]">
            {t("technicalProofTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("technicalProofDescription")}
          </p>
        </div>

        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TECHNICAL_PROOF_KEYS.map((key) => (
            <li
              key={key}
              className="rounded-xl border border-border bg-background p-4"
            >
              <h3 className="font-semibold">
                {t(`technicalProof.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t(`technicalProof.${key}.description`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section
        data-section="product-launch-boundary"
        className="mb-16 rounded-2xl border border-border bg-card p-6 md:p-8"
      >
        <h2 className="text-2xl font-bold tracking-[-0.03em]">
          {t("boundary.title")}
        </h2>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {t("boundary.description")}
        </p>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {BOUNDARY_KEYS.map((key) => (
            <li
              key={key}
              className="rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium"
            >
              {t(`boundary.items.${key}`)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-primary px-6 py-12 text-primary-foreground md:px-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-[-0.03em]">
            {t("cta.title")}
          </h2>
          <p className="mt-3 text-primary-foreground/90">
            {t("cta.description")}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="on-dark" size="lg" asChild>
            <Link href={SINGLE_SITE_ROUTE_HREFS.blog}>{t("cta.blog")}</Link>
          </Button>
          <Button variant="ghost-dark" size="lg" asChild>
            <Link href={SINGLE_SITE_ROUTE_HREFS.contact}>
              {t("cta.contact")}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
