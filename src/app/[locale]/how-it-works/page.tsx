import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { getLocalizedPath } from "@/config/paths";
import { renderLegalContent } from "@/lib/content/render-legal-content";
import { getPageBySlug } from "@/lib/content-query/queries";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import type { Locale } from "@/types/content.types";

interface HowItWorksPageProps {
  params: Promise<LocaleParam>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: HowItWorksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const page = await getPageBySlug("how-it-works", typedLocale);
  const description =
    page.metadata.seo?.description ?? page.metadata.description;
  const image = page.metadata.seo?.ogImage;

  return generateMetadataForPath({
    locale: typedLocale,
    pageType: "howItWorks",
    path: getLocalizedPath("howItWorks", typedLocale),
    config: {
      title: page.metadata.seo?.title ?? page.metadata.title,
      ...(description ? { description } : {}),
      ...(page.metadata.seo?.keywords
        ? { keywords: page.metadata.seo.keywords }
        : {}),
      ...(image ? { image } : {}),
    },
  });
}

function HowItWorksLoadingSkeleton() {
  return (
    <main className="mx-auto max-w-[1080px] px-6 py-16">
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-6 w-full max-w-2xl animate-pulse rounded bg-muted" />
      <div className="mt-10 space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-4 w-full animate-pulse rounded bg-muted"
          />
        ))}
      </div>
    </main>
  );
}

async function HowItWorksContent({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const page = await getPageBySlug("how-it-works", locale as Locale);

  return (
    <main className="mx-auto max-w-[1080px] px-6 py-16">
      <h1 className="text-4xl font-bold tracking-[-0.03em]">
        {page.metadata.title}
      </h1>
      {page.metadata.description ? (
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          {page.metadata.description}
        </p>
      ) : null}

      <article className="mt-10 max-w-none">
        {renderLegalContent(page.content)}
      </article>
    </main>
  );
}

export default async function HowItWorksPage({ params }: HowItWorksPageProps) {
  const { locale } = await params;

  return (
    <Suspense fallback={<HowItWorksLoadingSkeleton />}>
      <HowItWorksContent locale={locale} />
    </Suspense>
  );
}
