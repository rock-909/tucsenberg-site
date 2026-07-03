import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getAllMarketSlugs,
  getMarketBySlug,
  isValidMarketSlug,
} from "@/constants/product-catalog";
import { getProductMarketPath, SITE_CONFIG } from "@/config/paths";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";
import { CatalogBreadcrumb } from "@/components/products/catalog-breadcrumb";
import { Link, routing } from "@/i18n/routing";
import type { Locale } from "@/types/content.types";
import { buildMarketPageJsonLdData } from "@/app/[locale]/products/[market]/market-jsonld";
import { getMarketPageData } from "@/app/[locale]/products/[market]/market-page-data";
import { Button } from "@/components/ui/button";
import { generateFaqSchemaFromItems } from "@/lib/content/mdx-faq";
import {
  getTucsenbergProductPage,
  type TucsenbergProductPage,
  type TucsenbergProductSection,
  type TucsenbergProductTable,
} from "@/constants/tucsenberg-product-pages";

export function generateStaticParams() {
  const markets = getAllMarketSlugs();
  return routing.locales.flatMap((locale) =>
    markets.map((market) => ({ locale, market })),
  );
}

interface MarketPageProps {
  params: Promise<{ locale: string; market: string }>;
}

type CatalogTranslator = (
  key: string,
  values?: Record<string, string>,
) => string;

function ProductContentTable({ table }: { table: TucsenbergProductTable }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-muted/60 text-foreground">
          <tr>
            {table.columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {table.rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, index) => (
                <td
                  key={`${cell}-${index}`}
                  className="px-4 py-3 align-top text-muted-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductContentSection({
  section,
}: {
  section: TucsenbergProductSection;
}) {
  return (
    <section className="surface-card p-6 md:p-8">
      <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
      {section.paragraphs?.map((paragraph) => (
        <p
          key={paragraph}
          className="mb-4 text-base leading-7 text-muted-foreground last:mb-0"
        >
          {paragraph}
        </p>
      ))}
      {section.bullets ? (
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span
                aria-hidden
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.table ? <ProductContentTable table={section.table} /> : null}
    </section>
  );
}

function ProductFaqSection({ page }: { page: TucsenbergProductPage }) {
  return (
    <section className="surface-card p-6 md:p-8">
      <h2 className="mb-6 text-2xl font-semibold">FAQ</h2>
      <div className="space-y-6">
        {page.faqs.map((faq) => (
          <article key={faq.question}>
            <h3 className="text-lg font-semibold">{faq.question}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {faq.answer}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductFinalCta({ page }: { page: TucsenbergProductPage }) {
  return (
    <section className="surface-card p-6 md:p-8">
      <h2 className="text-2xl font-semibold">Request a quote</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
        Tell us the opening or perimeter, ground type, quantity, market and
        timeline. Photos and drawings help us give a cleaner answer.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={page.cta.href}>{page.cta.label}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={page.downloadHref}>Download spec sheet</a>
        </Button>
      </div>
    </section>
  );
}

export async function generateMetadata({
  params,
}: MarketPageProps): Promise<Metadata> {
  const { locale, market: marketSlug } = await params;
  const market = getMarketBySlug(marketSlug);
  const productPage = getTucsenbergProductPage(marketSlug);

  if (!market) return {};

  const title = productPage?.title ?? market.label;
  const description = productPage?.lead ?? market.description;

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "products",
    path: getProductMarketPath(market.slug),
    config: {
      title: `${title} | ${SITE_CONFIG.name}`,
      description,
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
  const productPage = getTucsenbergProductPage(marketSlug);

  if (!productPage) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "catalog" });
  const translateCatalog = t as unknown as CatalogTranslator;
  const marketLabel = translateCatalog(`markets.${marketSlug}.label`);
  const marketDescription = translateCatalog(
    `markets.${marketSlug}.description`,
  );
  const marketUrl = `${SITE_CONFIG.baseUrl}${getProductMarketPath(
    pageData.market.slug,
  )}`;
  const faqSchema = generateFaqSchemaFromItems(
    productPage.faqs.map((faq, index) => ({
      id: `${productPage.slug}-faq-${index + 1}`,
      question: faq.question,
      answer: faq.answer,
    })),
    locale,
  );
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
    t: translateCatalog,
  });

  return (
    <div
      className="mx-auto max-w-[1080px] px-6 py-8 md:py-12"
      data-testid="market-page-content"
    >
      <CatalogBreadcrumb
        homePrefetch={false}
        market={pageData.market}
        marketLabel={productPage.title}
        productsPrefetch={false}
        renderJsonLd={false}
      />

      <JsonLdGraphScript
        locale={locale as Locale}
        data={[...jsonLdData, faqSchema]}
      />

      <header className="mb-10">
        <span className="mb-2 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {productPage.eyebrow}
        </span>
        <h1 className="text-heading mb-4">{productPage.title}</h1>
        <p className="text-body max-w-3xl font-medium text-foreground">
          {productPage.subtitle}
        </p>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          {productPage.lead}
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href={productPage.cta.href}>{productPage.cta.label}</Link>
          </Button>
        </div>
      </header>

      <div className="space-y-8">
        {productPage.sections.map((section) => (
          <ProductContentSection key={section.title} section={section} />
        ))}
        <ProductFaqSection page={productPage} />
        <ProductFinalCta page={productPage} />
      </div>
    </div>
  );
}
