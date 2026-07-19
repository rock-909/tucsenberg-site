import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import {
  createInquiryFormCopy,
  type InquiryFormCopy,
} from "@/components/forms/inquiry-form-copy";
import { InquiryFormStaticFallback } from "@/components/forms/inquiry-form-static-fallback";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";
import { getLocalizedPath, SITE_CONFIG } from "@/config/paths";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import { buildWebPageSchema } from "@/lib/structured-data-generators";
import { RequestQuoteInquiryForm } from "@/app/[locale]/request-quote/request-quote-inquiry-form";

interface RequestQuotePageParams {
  params: Promise<LocaleParam>;
}

interface RequestQuotePageProps extends RequestQuotePageParams {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: RequestQuotePageParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "requestQuote.metadata",
  });

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "requestQuote",
    path: getLocalizedPath("requestQuote", locale as Locale),
    config: {
      title: t("title"),
      description: t("description"),
    },
  });
}

interface RequestQuoteAsideCopy {
  afterSubmitTitle: string;
  confidenceTitle: string;
  confidenceWarranty: string;
  confidenceSamples: string;
  confidencePricing: string;
}

function RequestQuoteAside({
  successCopy,
  copy,
}: {
  successCopy: string;
  copy: RequestQuoteAsideCopy;
}) {
  return (
    <aside className="space-y-4">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">{copy.afterSubmitTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {successCopy}
        </p>
      </section>
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">{copy.confidenceTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          <li>{copy.confidenceWarranty}</li>
          <li>{copy.confidenceSamples}</li>
          <li>{copy.confidencePricing}</li>
        </ul>
      </section>
    </aside>
  );
}

export default async function RequestQuotePage({
  params,
  searchParams,
}: RequestQuotePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tPage = await getTranslations({
    locale,
    namespace: "requestQuote.page",
  });
  const tMeta = await getTranslations({
    locale,
    namespace: "requestQuote.metadata",
  });
  const tInquiryForm = await getTranslations({
    locale,
    namespace: "inquiry.form",
  });
  const inquiryCopy: InquiryFormCopy = createInquiryFormCopy(tInquiryForm);
  const asideCopy: RequestQuoteAsideCopy = {
    afterSubmitTitle: tPage("afterSubmitTitle"),
    confidenceTitle: tPage("confidenceTitle"),
    confidenceWarranty: tPage("confidenceWarranty"),
    confidenceSamples: tPage("confidenceSamples"),
    confidencePricing: tPage("confidencePricing"),
  };
  const inquiryFallback = <InquiryFormStaticFallback copy={inquiryCopy} />;
  const typedLocale = locale as Locale;
  const pagePath = getLocalizedPath("requestQuote", typedLocale);
  const pageUrl = new URL(pagePath, SITE_CONFIG.baseUrl).toString();

  return (
    <>
      <JsonLdGraphScript
        locale={typedLocale}
        data={[
          buildWebPageSchema({
            locale,
            name: tMeta("title"),
            description: tMeta("description"),
            url: pageUrl,
          }),
        ]}
      />
      <div className="mx-auto max-w-[1080px] px-6 py-14 md:py-[72px]">
        <header className="mb-10 max-w-2xl">
          <h1 className="text-heading mb-4">{tPage("heading")}</h1>
          <p className="text-body text-muted-foreground">{tPage("intro")}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <Suspense fallback={inquiryFallback}>
            <RequestQuoteInquiryForm
              inquiryCopy={inquiryCopy}
              inquiryFallback={inquiryFallback}
              searchParams={searchParams}
            />
          </Suspense>
          <RequestQuoteAside
            successCopy={inquiryCopy.success}
            copy={asideCopy}
          />
        </div>
      </div>
    </>
  );
}
