import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import {
  RequestQuoteForm,
  RFQ_SUCCESS_COPY,
} from "@/app/[locale]/request-quote/request-quote-form";
import { getLocalizedPath } from "@/config/paths";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";

interface RequestQuotePageProps {
  params: Promise<LocaleParam>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: RequestQuotePageProps): Promise<Metadata> {
  const { locale } = await params;

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "requestQuote",
    path: getLocalizedPath("requestQuote", locale as Locale),
    config: {
      title:
        "Request a Quote — 12-Hour Response on Standard Items | Tucsenberg",
      description:
        "Send dimensions, quantities, market and timeline. Standard flood barrier items quoted within 12 hours; custom configurations within 48.",
    },
  });
}

function RequestQuoteAside() {
  return (
    <aside className="space-y-4">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">After you submit</h2>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {RFQ_SUCCESS_COPY}
        </p>
      </section>
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Quote confidence</h2>
        <ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-6">
          <li>3-year warranty</li>
          <li>Sample fees credited</li>
          <li>
            No published-price games — the quote is the price conversation
          </li>
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

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-14 md:py-[72px]">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-heading mb-4">Get real numbers, fast</h1>
        <p className="text-body text-muted-foreground">
          Send what you know — photos and rough dimensions are enough to start.
          Standard items quoted within <strong>12 hours</strong>, custom
          configurations within <strong>48</strong>.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <RequestQuoteForm />
        <RequestQuoteAside />
      </div>
    </div>
  );
}
