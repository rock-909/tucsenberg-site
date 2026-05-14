import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { LegalPageShell } from "@/components/content/legal-page-shell";
import { loadLegalPage } from "@/lib/content/legal-page";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import { getLocalizedPath } from "@/config/paths";

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface TermsPageProps {
  params: Promise<LocaleParam>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { metadata } = await loadLegalPage("terms", locale);

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "terms",
    path: getLocalizedPath("terms", locale as Locale),
    config: {
      title: metadata.seo?.title ?? metadata.title,
      ...((metadata.seo?.description ?? metadata.description) !== undefined
        ? { description: metadata.seo?.description ?? metadata.description }
        : {}),
    },
  });
}

function TermsLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <div className="mb-4 h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="h-5 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

async function TermsContent({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const { metadata, content, headings } = await loadLegalPage("terms", locale);

  return (
    <LegalPageShell
      metadata={metadata}
      content={content}
      headings={headings}
      locale={locale}
      schemaType="WebPage"
      schemaAdditionalType="https://schema.org/TermsOfService"
    />
  );
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;

  return (
    <Suspense fallback={<TermsLoadingSkeleton />}>
      <TermsContent locale={locale} />
    </Suspense>
  );
}
