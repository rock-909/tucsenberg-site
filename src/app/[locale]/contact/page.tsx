import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { JsonLdGraphScript } from "@/components/seo";
import { getLocalizedPath } from "@/config/paths";
import { renderLegalContent } from "@/lib/content/render-legal-content";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import type { Locale } from "@/types/content.types";
import {
  ContactFaqSection,
  ContactFormWithFallback,
  ContactMethodsCard,
  ResponseExpectationsCard,
  type ContactSearchParams,
} from "@/app/[locale]/contact/contact-page-sections";
import {
  getContactPageData,
  getStaticContactPage,
} from "@/app/[locale]/contact/contact-page-data";

interface ContactPageProps {
  params: Promise<LocaleParam>;
  searchParams?: Promise<ContactSearchParams>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as Locale;
  const page = getStaticContactPage(typedLocale);
  const description =
    page.metadata.seo?.description ?? page.metadata.description;

  return generateMetadataForPath({
    locale: typedLocale,
    pageType: "contact",
    path: getLocalizedPath("contact", typedLocale),
    config: {
      title: page.metadata.seo?.title ?? page.metadata.title,
      ...(description ? { description } : {}),
    },
  });
}

function ContactContentBody({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<ContactSearchParams>;
}) {
  const { page, messages, copy, faqItems, faqSectionTitle, faqSchema } =
    getContactPageData(locale);

  return (
    <div className="min-h-[80vh] px-4 py-16" data-testid="contact-page-content">
      <JsonLdGraphScript locale={locale} data={faqSchema ? [faqSchema] : []} />
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-heading mb-4">{page.metadata.title}</h1>
          {page.metadata.description ? (
            <p className="text-body mx-auto max-w-2xl text-muted-foreground">
              {page.metadata.description}
            </p>
          ) : null}
        </header>

        <article className="prose mb-12 max-w-none">
          {renderLegalContent(page.content)}
        </article>

        <div className="grid gap-8 md:grid-cols-2">
          <ContactFormWithFallback
            searchParams={searchParams}
            messages={messages}
          />

          <div className="space-y-6">
            <ContactMethodsCard copy={copy.panel.contact} />
            <ResponseExpectationsCard
              responseCopy={copy.panel.response}
              hoursCopy={copy.panel.hours}
            />
          </div>
        </div>
      </div>

      {faqItems.length > 0 ? (
        <ContactFaqSection faqItems={faqItems} title={faqSectionTitle} />
      ) : null}
    </div>
  );
}

export default async function ContactPage({
  params,
  searchParams,
}: ContactPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ContactContentBody
      locale={locale as Locale}
      searchParams={searchParams ?? Promise.resolve({})}
    />
  );
}
