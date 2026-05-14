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

interface PrivacyPageProps {
  params: Promise<LocaleParam>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { metadata } = await loadLegalPage("privacy", locale);

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "privacy",
    path: getLocalizedPath("privacy", locale as Locale),
    config: {
      title: metadata.seo?.title ?? metadata.title,
      ...((metadata.seo?.description ?? metadata.description) !== undefined
        ? { description: metadata.seo?.description ?? metadata.description }
        : {}),
    },
  });
}

function PrivacyLoadingSkeleton() {
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

async function PrivacyContent({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const { metadata, content, headings } = await loadLegalPage(
    "privacy",
    locale,
  );

  return (
    <LegalPageShell
      metadata={metadata}
      content={content}
      headings={headings}
      locale={locale}
      schemaType="PrivacyPolicy"
    />
  );
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;

  return (
    <Suspense fallback={<PrivacyLoadingSkeleton />}>
      <PrivacyContent locale={locale} />
    </Suspense>
  );
}
