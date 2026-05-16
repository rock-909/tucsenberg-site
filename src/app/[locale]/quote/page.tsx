import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { getLocalizedPath } from "@/config/paths";
import { JsonLdGraphScript } from "@/components/seo";
import { NarrativeSection } from "@/components/trust";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import { QuoteFormSection } from "@/app/[locale]/quote/quote-form-section";

interface QuotePageProps {
  params: Promise<LocaleParam>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: QuotePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quote" });

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "quote",
    path: getLocalizedPath("quote", locale as Locale),
    config: {
      title: t("hero.title"),
      description: t("hero.description"),
    },
  });
}

function QuoteFormSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-16 w-full animate-pulse rounded-[6px] bg-muted"
          />
        ))}
      </div>
      <div className="h-72 w-full animate-pulse rounded-[8px] bg-muted" />
    </div>
  );
}

export default async function QuotePage({
  params,
  searchParams,
}: QuotePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "quote" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLdGraphScript locale={locale as Locale} />

      <section className="px-6 pt-16 pb-4">
        <div className="mx-auto max-w-[1080px]">
          <span className="block text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {t("intake.eyebrow")}
          </span>
          <h1 className="mt-2 text-[32px] leading-[1.1] font-light tracking-[-0.01em] text-primary md:text-[48px]">
            {t("hero.title")}
          </h1>
          <p className="mt-4 max-w-[640px] text-muted-foreground">
            {t("intake.body")}
          </p>
        </div>
      </section>

      <NarrativeSection title={t("intake.title")} divider>
        <div className="max-w-[68ch] rounded-[8px] border border-border bg-muted/40 p-5">
          <p className="text-sm font-medium text-foreground">
            {t("softEntry.title")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("softEntry.body")}
          </p>
        </div>
      </NarrativeSection>

      <section className="px-6 pt-6 pb-20">
        <div className="mx-auto max-w-[1080px]">
          <Suspense fallback={<QuoteFormSkeleton />}>
            <QuoteFormSection
              searchParams={searchParams ?? Promise.resolve({})}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
