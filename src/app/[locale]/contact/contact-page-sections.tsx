import { Suspense } from "react";
import { ContactFormIsland } from "@/components/contact/contact-form-island";
import { FaqAccordion } from "@/components/sections/faq-accordion";
import {
  DataCard,
  DataCardContent,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";
import { SectionHead } from "@/components/ui/section-head";
import {
  getPublicContactEmail,
  getPublicContactPhone,
} from "@/config/public-trust";
import { siteFacts } from "@/config/site-facts";
import { readRequiredMessagePath } from "@/lib/i18n/read-message-path";
import type { FaqItem } from "@/types/content.types";
import { ContactFormStaticFallback } from "@/app/[locale]/contact/contact-form-static-fallback";
import type { ContactPageData } from "@/app/[locale]/contact/contact-page-data";

export function ContactMethodsCard({
  copy,
}: {
  copy: ContactPageData["copy"]["panel"]["contact"];
}) {
  const publicEmail = getPublicContactEmail(siteFacts.contact.email);
  const publicPhone = getPublicContactPhone(siteFacts.contact.phone);

  return (
    <DataCard className="p-6">
      <DataCardHeader>
        <DataCardTitle className="text-xl">{copy.title}</DataCardTitle>
      </DataCardHeader>
      <DataCardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <div>
            <p className="font-medium">{copy.emailLabel}</p>
            <p className="text-muted-foreground">
              {publicEmail ?? copy.emailUnavailable}
            </p>
          </div>
        </div>

        {publicPhone ? (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">{copy.phoneLabel}</p>
              <p className="text-muted-foreground">{publicPhone}</p>
            </div>
          </div>
        ) : null}
      </DataCardContent>
    </DataCard>
  );
}

export function ResponseExpectationsCard({
  responseCopy,
  hoursCopy,
}: {
  responseCopy: ContactPageData["copy"]["panel"]["response"];
  hoursCopy: ContactPageData["copy"]["panel"]["hours"];
}) {
  return (
    <DataCard className="p-6">
      <DataCardHeader>
        <DataCardTitle className="text-xl">{responseCopy.title}</DataCardTitle>
      </DataCardHeader>
      <DataCardContent>
        <dl className="space-y-4 text-sm">
          <div className="space-y-1">
            <dt className="font-medium">{responseCopy.responseTimeLabel}</dt>
            <dd className="text-muted-foreground">
              {responseCopy.responseTimeValue}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium">{responseCopy.bestForLabel}</dt>
            <dd className="text-muted-foreground">
              {responseCopy.bestForValue}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium">{responseCopy.prepareLabel}</dt>
            <dd className="text-muted-foreground">
              {responseCopy.prepareValue}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t pt-6">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {hoursCopy.title}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span>{hoursCopy.weekdaysLabel}</span>
              <span className="text-muted-foreground">
                {siteFacts.contact.businessHours?.weekdays}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{hoursCopy.saturdayLabel}</span>
              <span className="text-muted-foreground">
                {siteFacts.contact.businessHours?.saturday}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{hoursCopy.sundayLabel}</span>
              <span className="text-muted-foreground">
                {hoursCopy.closedLabel}
              </span>
            </div>
          </div>
        </div>
      </DataCardContent>
    </DataCard>
  );
}

export function ContactFaqSection({
  faqItems,
  title,
}: {
  faqItems: FaqItem[];
  title: string;
}) {
  const accordionItems = faqItems.map((item) => ({
    key: item.id,
    question: item.question,
    answer: item.answer,
  }));

  return (
    <section
      className="section-divider py-14 md:py-[72px]"
      data-testid="faq-section"
    >
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionHead title={title} />
        <FaqAccordion items={accordionItems} />
      </div>
    </section>
  );
}

function ContactFormColumn({
  messages,
}: {
  messages: Record<string, unknown>;
}) {
  const formLoadError = readRequiredMessagePath(messages, [
    "contact",
    "form",
    "loadError",
  ]);
  const formRetryLabel = readRequiredMessagePath(messages, [
    "contact",
    "form",
    "retryLoad",
  ]);

  return (
    <div className="space-y-6" data-testid="contact-form-column">
      <ContactFormIsland
        errorMessage={formLoadError}
        fallback={<ContactFormStaticFallback messages={messages} />}
        retryLabel={formRetryLabel}
      />
    </div>
  );
}

export function ContactFormWithFallback({
  messages,
}: {
  messages: Record<string, unknown>;
}) {
  return (
    <Suspense fallback={<ContactFormStaticFallback messages={messages} />}>
      <ContactFormColumn messages={messages} />
    </Suspense>
  );
}
