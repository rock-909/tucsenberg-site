import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";
import { LegalContentRenderer } from "@/components/content/legal-content-renderer";
import { buildShellPageSchema } from "@/components/content/legal-page-shell";
import { Button } from "@/components/ui/button";
import {
  extractFaqFromMetadata,
  generateFaqSchemaFromItems,
} from "@/lib/content/mdx-faq";
import { buildBreadcrumbListSchema } from "@/lib/structured-data-generators";
import { SITE_CONFIG } from "@/config/paths";
import { FactoryPoolDiagram } from "@/components/products/factory-pool-diagram";
import { Link } from "@/i18n/routing";
import type { LegalPageMetadata, Locale } from "@/types/content.types";

interface TradeLandingShellProps {
  metadata: LegalPageMetadata;
  content: string;
  locale: string;
  /** Site-relative path (e.g. "/oem-wholesale"); enables BreadcrumbList output. */
  pagePath: string;
}

/**
 * Wide conversion-register shell for trade landing pages (OEM / wholesale).
 * Same MDX source pipeline as LegalPageShell, without the legal-document
 * chrome (effective dates, table-of-contents sidebar, 720px measure).
 */
export async function TradeLandingShell({
  metadata,
  content,
  locale,
  pagePath,
}: TradeLandingShellProps): Promise<ReactNode> {
  const t = await getTranslations({ locale, namespace: "oemLanding" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });

  const pageUrl = new URL(pagePath, SITE_CONFIG.baseUrl).toString();
  const schema = await buildShellPageSchema({
    metadata,
    locale,
    schemaType: "WebPage",
    pageUrl,
  });

  const faqItems = extractFaqFromMetadata(metadata);
  const schemas: Array<Record<string, unknown>> = [schema];
  if (faqItems.length > 0) {
    schemas.push(
      generateFaqSchemaFromItems(faqItems, locale) as unknown as Record<
        string,
        unknown
      >,
    );
  }
  schemas.push(
    buildBreadcrumbListSchema([
      { name: tNav("home"), url: SITE_CONFIG.baseUrl },
      { name: metadata.title, url: pageUrl },
    ]),
  );

  return (
    <>
      <JsonLdGraphScript locale={locale as Locale} data={schemas} />

      <div className="mx-auto max-w-[1080px] px-6 py-14 md:py-[72px]">
        <header className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
          <div className="min-w-0">
            <h1 className="text-heading mb-4 text-balance">
              {metadata.title}
            </h1>
            {metadata.description && (
              <p className="text-body text-muted-foreground text-pretty">
                {metadata.description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/request-quote">{t("primaryCta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/products">{t("secondaryCta")}</Link>
              </Button>
            </div>
          </div>
          <figure className="border-border bg-card min-w-0 rounded-2xl border p-4 md:p-5">
            <div className="border-border mb-3 flex items-center justify-between gap-3 border-b pb-3">
              <span className="text-muted-foreground font-mono text-[10px] font-semibold tracking-[0.1em] uppercase">
                {t("diagramLabel")}
              </span>
              <span aria-hidden className="bg-primary size-1.5 rounded-full" />
            </div>
            <FactoryPoolDiagram ariaLabel={t("diagramAriaLabel")} />
            <figcaption className="text-muted-foreground border-border mt-3 border-t pt-3 text-xs leading-5">
              {t("diagramCaption")}
            </figcaption>
          </figure>
        </header>

        <article className="mt-12 max-w-[860px] min-w-0 md:mt-16">
          <LegalContentRenderer content={content} />
        </article>
      </div>
    </>
  );
}
