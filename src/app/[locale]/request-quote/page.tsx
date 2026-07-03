import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
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
      title: "Request a Quote — 12-Hour Response on Standard Items",
      description:
        "Send dimensions, quantities, market and timeline. Standard flood barrier items quoted within 12 hours; custom configurations within 48.",
    },
  });
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

      <section className="surface-card p-6 md:p-8">
        <h2 className="mb-4 text-2xl font-semibold">RFQ fields</h2>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-foreground">
          <li>What are you protecting?</li>
          <li>Opening width × height / run length</li>
          <li>Mounting surface / ground type</li>
          <li>Material preference or advise me</li>
          <li>Quantity</li>
          <li>Market & delivery port</li>
          <li>Timeline</li>
          <li>Photos / drawings upload</li>
          <li>Name / Email / Company / WhatsApp</li>
          <li>This is a wholesale / OEM / private label enquiry</li>
        </ol>
      </section>
    </div>
  );
}
