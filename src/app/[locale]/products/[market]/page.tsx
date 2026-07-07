import type { Metadata } from "next";
import { Fragment } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  getAllMarketSlugs,
  getMarketBySlug,
  isValidMarketSlug,
} from "@/constants/product-catalog";
import {
  getProductMarketPath,
  LOCALES_CONFIG,
  SITE_CONFIG,
} from "@/config/paths";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";
import { CatalogBreadcrumb } from "@/components/products/catalog-breadcrumb";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/types/content.types";
import { buildMarketPageJsonLdData } from "@/app/[locale]/products/[market]/market-jsonld";
import { getMarketPageData } from "@/app/[locale]/products/[market]/market-page-data";
import { Button } from "@/components/ui/button";
import {
  getTucsenbergProductPage,
  type TucsenbergProductPage,
  type TucsenbergProductSection,
  type TucsenbergProductTable,
} from "@/constants/tucsenberg-product-pages";
import type {
  TucsenbergProductDiagramKind,
  TucsenbergProductScenes,
} from "@/constants/tucsenberg-product-page-types";
import { buildTucsenbergProductFaqSchema } from "@/constants/tucsenberg-product-faq-schema";
import {
  ProductDiagramPanel,
  ProductLineGlyph,
} from "@/components/products/product-diagrams";
import { ProductRunCalculator } from "@/components/products/product-run-calculator";
import { InlineMarkdown } from "@/lib/content/inline-markdown";

export function generateStaticParams() {
  const markets = getAllMarketSlugs();
  return LOCALES_CONFIG.locales.flatMap((locale) =>
    markets.map((market) => ({ locale, market })),
  );
}

interface MarketPageProps {
  params: Promise<{ locale: string; market: string }>;
}

function ProductContentTable({
  table,
  fade,
}: {
  table: TucsenbergProductTable;
  fade: "background" | "card";
}) {
  return (
    <div className="relative">
      <div className="border-border [scrollbar-width:thin] overflow-x-auto rounded-2xl border">
        <table className="divide-border min-w-full divide-y text-left text-sm">
          <thead className="bg-muted/60 text-foreground">
            <tr>
              {table.columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {table.rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, index) => (
                  <td
                    key={`${cell}-${index}`}
                    className="text-muted-foreground px-4 py-3 align-top tabular-nums"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cue that the table scrolls; wide tables clip silently otherwise. */}
      <div
        aria-hidden
        className={
          fade === "card"
            ? "from-card pointer-events-none absolute inset-y-px right-px w-8 rounded-r-2xl bg-gradient-to-l to-transparent md:hidden"
            : "from-background pointer-events-none absolute inset-y-px right-px w-8 rounded-r-2xl bg-gradient-to-l to-transparent md:hidden"
        }
      />
    </div>
  );
}

function ProductSectionBody({
  section,
}: {
  section: TucsenbergProductSection;
}) {
  return (
    <>
      {section.paragraphs?.map((paragraph) => (
        <p
          key={paragraph}
          className="text-muted-foreground mb-4 text-base leading-7 last:mb-0"
        >
          <InlineMarkdown text={paragraph} />
        </p>
      ))}
      {section.bullets ? (
        <ul className="text-muted-foreground space-y-3 text-base leading-7">
          {section.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span
                aria-hidden
                className="bg-primary mt-2.5 size-1.5 shrink-0 rounded-full"
              />
              <span>
                <InlineMarkdown text={bullet} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.footer ? (
        <p className="text-muted-foreground mt-5 text-sm leading-6">
          <InlineMarkdown text={section.footer} />
        </p>
      ) : null}
    </>
  );
}

/**
 * Rhythm over uniformity: data tables run open and full-width, argument
 * tables (table + framing paragraphs) keep a card, narrative sections run as
 * open two-column text capped at a readable measure. Only the final CTA gets
 * the accent band — one visual focus per page.
 */
function ProductContentSection({
  section,
}: {
  section: TucsenbergProductSection;
}) {
  const { table } = section;

  if (table && !section.paragraphs) {
    return (
      <section>
        <h2 className="text-section mb-5">{section.title}</h2>
        <ProductContentTable table={table} fade="background" />
        {section.footer ? (
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            <InlineMarkdown text={section.footer} />
          </p>
        ) : null}
      </section>
    );
  }

  if (table) {
    return (
      <section className="surface-card p-6 md:p-8">
        <h2 className="text-section mb-4">{section.title}</h2>
        {section.paragraphs?.map((paragraph) => (
          <p
            key={paragraph}
            className="text-muted-foreground mb-5 max-w-[75ch] text-base leading-7"
          >
            <InlineMarkdown text={paragraph} />
          </p>
        ))}
        <ProductContentTable table={table} fade="card" />
        {section.footer ? (
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            <InlineMarkdown text={section.footer} />
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
      <h2 className="text-section mb-4 md:mb-0">{section.title}</h2>
      <div className="max-w-[75ch] min-w-0">
        <ProductSectionBody section={section} />
      </div>
    </section>
  );
}

/** Scannable verifiable facts under the hero — never invented numbers. */
function ProductProofStrip({ items }: { items: readonly string[] }) {
  return (
    <ul className="border-border text-muted-foreground mb-12 flex flex-wrap items-center gap-x-8 gap-y-2 border-y py-3 font-mono text-[11.5px] md:mb-16">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * "Can I use it on my site?" answered by showing: real photos when delivered,
 * honest schematic bases until then (spec: docs/design/视觉翻译-旗舰页样板.md).
 */
function ProductSceneWall({
  scenes,
  glyphKind,
}: {
  scenes: TucsenbergProductScenes;
  glyphKind: TucsenbergProductDiagramKind | undefined;
}) {
  return (
    <section>
      <h2 className="text-section mb-3">{scenes.title}</h2>
      {scenes.intro ? (
        <p className="text-muted-foreground mb-6 max-w-[75ch] text-sm leading-6">
          {scenes.intro}
        </p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scenes.items.map((scene) => (
          <li
            key={scene.title}
            className="border-border overflow-hidden rounded-xl border"
          >
            <div className="bg-muted/40 relative aspect-[4/3]">
              {scene.image ? (
                <Image
                  src={scene.image.src}
                  alt={scene.image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="text-muted-foreground/50 flex h-full items-center justify-center"
                >
                  {glyphKind ? (
                    <ProductLineGlyph kind={glyphKind} className="size-14" />
                  ) : null}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold">{scene.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {scene.note}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductFaqSection({ page }: { page: TucsenbergProductPage }) {
  return (
    <section className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
      <h2 className="text-section mb-4 md:mb-0">FAQ</h2>
      <div className="divide-border max-w-[75ch] min-w-0 divide-y">
        {page.faqs.map((faq) => (
          <article key={faq.question} className="py-5 first:pt-0 last:pb-0">
            <h3 className="text-lg font-semibold">{faq.question}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              <InlineMarkdown text={faq.answer} />
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductFinalCta({ page }: { page: TucsenbergProductPage }) {
  return (
    <section className="bg-accent rounded-2xl px-6 py-10 md:px-10 md:py-12">
      <h2 className="text-section">Request a quote</h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
        {page.rfqNote ??
          "Tell us the opening or perimeter, ground type, quantity, market and timeline. Photos and drawings help us give a cleaner answer."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href={page.cta.href}>{page.cta.label}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={page.downloadHref}>Download spec sheet</a>
        </Button>
      </div>
      {page.cta.note ? (
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {page.cta.note}
        </p>
      ) : null}
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

  const title = productPage?.meta.title ?? market.label;
  const description = productPage?.meta.description ?? market.description;

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "products",
    path: getProductMarketPath(market.slug),
    config: {
      title,
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

  const marketUrl = `${SITE_CONFIG.baseUrl}${getProductMarketPath(
    pageData.market.slug,
  )}`;
  const faqSchema = buildTucsenbergProductFaqSchema(productPage, locale);
  const jsonLdData = await buildMarketPageJsonLdData({
    market: pageData.market,
    marketUrl,
    productPage,
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

      <header className="mb-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="min-w-0">
          <span className="bg-muted text-muted-foreground mb-2 inline-block rounded px-2 py-0.5 font-mono text-xs">
            {productPage.eyebrow}
          </span>
          <h1 className="text-heading mb-4">{productPage.title}</h1>
          <p className="text-body text-foreground max-w-3xl font-medium">
            {productPage.subtitle}
          </p>
          <p className="text-muted-foreground mt-4 max-w-3xl text-base leading-7">
            {productPage.lead}
          </p>
          {productPage.leadNote ? (
            <p className="border-border text-foreground bg-muted/40 mt-4 max-w-3xl rounded-lg border p-4 text-sm leading-6">
              <InlineMarkdown text={productPage.leadNote} />
            </p>
          ) : null}
          <div className="mt-6">
            <Button asChild>
              <Link href={productPage.cta.href}>{productPage.cta.label}</Link>
            </Button>
            {productPage.cta.note ? (
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {productPage.cta.note}
              </p>
            ) : null}
          </div>
        </div>
        {productPage.diagram ? (
          <ProductDiagramPanel diagram={productPage.diagram} />
        ) : null}
      </header>

      {productPage.proofStrip ? (
        <ProductProofStrip items={productPage.proofStrip} />
      ) : null}

      <div className="space-y-12 md:space-y-16">
        {productPage.sections.map((section) => (
          <Fragment key={section.title}>
            <ProductContentSection section={section} />
            {productPage.scenes?.afterSection === section.title ? (
              <ProductSceneWall
                scenes={productPage.scenes}
                glyphKind={productPage.diagram?.kind}
              />
            ) : null}
          </Fragment>
        ))}
        {productPage.calculator ? (
          <ProductRunCalculator calculator={productPage.calculator} />
        ) : null}
        <ProductFaqSection page={productPage} />
        <ProductFinalCta page={productPage} />
      </div>
    </div>
  );
}
