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
        <header className="max-w-3xl">
          <h1 className="text-heading mb-4 text-balance">{metadata.title}</h1>
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
        </header>

        <article className="mt-12 max-w-[860px] min-w-0 md:mt-16">
          <LegalContentRenderer content={content} />
        </article>
      </div>
    </>
  );
}
