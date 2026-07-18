import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { createInquiryFormCopyFromMessages } from "@/components/forms/inquiry-form-copy";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";
import { getLocalizedPath, SITE_CONFIG } from "@/config/paths";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import { buildWebPageSchema } from "@/lib/structured-data-generators";

interface RequestQuotePageProps {
  params: Promise<LocaleParam>;
}

const STANDARD_QUOTE_HOURS = 12;
const CUSTOM_QUOTE_HOURS = 48;

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: RequestQuotePageProps): Promise<Metadata> {
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

function RequestQuoteAside({
  successCopy,
  t,
}: {
  successCopy: string;
  t: (key: string) => string;
}) {
  return (
    <aside className="space-y-4">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">{t("afterSubmitTitle")}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {successCopy}
        </p>
      </section>
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">{t("confidenceTitle")}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          <li>{t("confidenceWarranty")}</li>
          <li>{t("confidenceSamples")}</li>
          <li>{t("confidencePricing")}</li>
        </ul>
      </section>
    </aside>
  );
}

export default async function RequestQuotePage({
  params,
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
  const translatePage = (key: string) =>
    tPage(key as Parameters<typeof tPage>[0]);
  const messages = await loadCompleteMessages(locale);
  const inquiryCopy = createInquiryFormCopyFromMessages(messages);
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
          <h1 className="text-heading mb-4">{translatePage("heading")}</h1>
          <p className="text-body text-muted-foreground">
            {tPage("intro", {
              standardHours: STANDARD_QUOTE_HOURS,
              customHours: CUSTOM_QUOTE_HOURS,
            })}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <InquiryForm copy={inquiryCopy} source="request-quote" />
          <RequestQuoteAside
            successCopy={inquiryCopy.success}
            t={translatePage}
          />
        </div>
      </div>
    </>
  );
}
