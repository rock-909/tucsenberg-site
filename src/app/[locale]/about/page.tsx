import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AboutPageShell } from "@/components/content/about-page-shell";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { getPageBySlug } from "@/lib/content-query/queries";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import { getLocalizedPath } from "@/config/paths";

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface AboutPageProps {
  params: Promise<LocaleParam>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPageBySlug("about", locale as Locale);
  const description =
    page.metadata.seo?.description ?? page.metadata.description;
  const image = page.metadata.seo?.ogImage;

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "about",
    path: getLocalizedPath("about", locale as Locale),
    config: {
      title: page.metadata.seo?.title ?? page.metadata.title,
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
    },
  });
}

async function AboutContent({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const page = await getPageBySlug("about", locale as Locale);

  return (
    <AboutPageShell
      metadata={page.metadata}
      content={page.content}
      locale={locale}
    />
  );
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-4 h-9 w-64 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-4 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </div>
      }
    >
      <AboutContent locale={locale} />
    </Suspense>
  );
}
