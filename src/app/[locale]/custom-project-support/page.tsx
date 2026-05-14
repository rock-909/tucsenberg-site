import { Suspense, type ComponentProps } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import { SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION } from "@/config/single-site-page-expression";
import { JsonLdGraphScript } from "@/components/seo";
import { FaqSection } from "@/components/sections/faq-section";
import { Link } from "@/i18n/routing";
import { generateLocaleStaticParams } from "@/app/[locale]/generate-static-params";
import { getPageBySlug } from "@/lib/content-query/queries";
import {
  LAYER1_FACTS,
  extractFaqFromMetadata,
  generateFaqSchemaFromItems,
  interpolateFaqAnswer,
} from "@/lib/content/mdx-faq";
import { buildCustomProjectPageSchema } from "@/lib/structured-data-generators";
import { getLocalizedPath } from "@/config/paths";
import type { FaqItem, Locale } from "@/types/content.types";

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPageBySlug("custom-project-support", locale as Locale);
  const description =
    page.metadata.seo?.description ?? page.metadata.description;

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "customProject",
    path: getLocalizedPath("customProject", locale as Locale),
    config: {
      title: page.metadata.seo?.title ?? page.metadata.title,
      ...(description ? { description } : {}),
    },
  });
}

// --- Constants ---

// --- Extracted sub-sections (keep main function under 120 lines) ---

interface ScopeCardData {
  title: string;
  desc: string;
}

function ServiceScopeSection({
  title,
  cards,
}: {
  title: string;
  cards: ScopeCardData[];
}) {
  return (
    <section className="mt-16">
      <h2 className="mb-8 text-2xl font-bold">{title}</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-border bg-muted/30 p-6"
          >
            <h3 className="mb-2 text-lg font-semibold">{card.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

interface ProcessStepData {
  num: string;
  title: string;
  desc: string;
  timeline: string;
}

function ProcessFlowSection({
  title,
  steps,
}: {
  title: string;
  steps: ProcessStepData[];
}) {
  return (
    <section className="mt-16">
      <h2 className="mb-8 text-2xl font-bold">{title}</h2>
      <div className="flex flex-col md:flex-row">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className="relative flex flex-1 items-start gap-4 py-5 md:flex-col md:items-center md:py-0 md:text-center"
          >
            {/* Connecting lines */}
            {i < steps.length - 1 && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute left-[calc(50%+24px)] top-5 hidden h-0.5 w-[calc(100%-48px)] bg-border md:block"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-[19px] top-[52px] w-0.5 bg-border md:hidden"
                />
              </>
            )}

            {/* Numbered circle */}
            <div className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card font-mono text-sm font-semibold text-primary">
              {step.num}
            </div>

            <div className="md:mt-3">
              <h3 className="text-[15px] font-semibold leading-snug">
                {step.title}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
              <span className="mt-1 inline-block font-mono text-xs text-primary">
                {step.timeline}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StandardsSection({
  title,
  desc,
  customLabel,
}: {
  title: string;
  desc: string;
  customLabel: string;
}) {
  return (
    <section className="mt-16">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <p className="mb-6 text-muted-foreground">{desc}</p>
      <div className="flex flex-wrap gap-3">
        {SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION.supportedStandards.map(
          (std) => (
            <span
              key={std}
              className="rounded-full bg-primary/10 px-4 py-1.5 font-mono text-sm font-medium text-primary"
            >
              {std}
            </span>
          ),
        )}
        <span className="rounded-full border border-dashed border-primary/40 px-4 py-1.5 text-sm text-muted-foreground">
          {customLabel}
        </span>
      </div>
    </section>
  );
}

function CtaSection({
  heading,
  description,
  buttonText,
  href,
}: {
  heading: string;
  description: string;
  buttonText: string;
  href: ComponentProps<typeof Link>["href"];
}) {
  return (
    <section className="mt-16 rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
      <h2 className="mb-2 text-xl font-semibold">{heading}</h2>
      <p className="mb-6 text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {buttonText}
      </Link>
    </section>
  );
}

// --- Page component ---

async function CustomProjectSupportContent({ locale }: { locale: string }) {
  setRequestLocale(locale);

  const [t, page] = await Promise.all([
    getTranslations({ locale, namespace: "customProject" }),
    getPageBySlug("custom-project-support", locale as Locale),
  ]);
  const faqItems: FaqItem[] = extractFaqFromMetadata(page.metadata).map(
    (item) => ({
      ...item,
      answer: interpolateFaqAnswer(item.answer, LAYER1_FACTS),
    }),
  );

  const scopeCards: ScopeCardData[] =
    SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION.scopeKeys.map((key) => ({
      title: t(`scope.${key}.title`),
      desc: t(`scope.${key}.desc`),
    }));

  const processSteps: ProcessStepData[] = Array.from(
    { length: SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION.processStepCount },
    (_, i) => {
      const key = `step${String(i + 1)}`;
      return {
        num: String(i + 1).padStart(2, "0"),
        title: t(`process.${key}.title`),
        desc: t(`process.${key}.desc`),
        timeline: t(`process.${key}.timeline`),
      };
    },
  );
  const customProjectSchema = buildCustomProjectPageSchema({
    name: page.metadata.title,
    locale,
    specialty: "Custom Project Support",
    ...(page.metadata.description
      ? { description: page.metadata.description }
      : {}),
  });
  const faqSchema = generateFaqSchemaFromItems(faqItems, locale as Locale);

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-12">
      <JsonLdGraphScript
        locale={locale as Locale}
        data={[customProjectSchema, faqSchema]}
      />

      <header className="mb-8 md:mb-12">
        <h1 className="text-heading mb-4">{page.metadata.title}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {page.metadata.description}
        </p>
      </header>

      <ServiceScopeSection title={t("scope.title")} cards={scopeCards} />

      <ProcessFlowSection title={t("process.title")} steps={processSteps} />

      <StandardsSection
        title={t("standards.title")}
        desc={t("standards.desc")}
        customLabel={t("standards.custom")}
      />

      <Suspense fallback={null}>
        <FaqSection
          faqItems={faqItems}
          locale={locale as Locale}
          renderJsonLd={false}
        />
      </Suspense>

      <CtaSection
        heading={t("cta.heading")}
        description={t("cta.description")}
        buttonText={t("cta.button")}
        href={SINGLE_SITE_CUSTOM_PROJECT_PAGE_EXPRESSION.ctaHref}
      />
    </div>
  );
}

function CustomProjectSupportLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-12">
      <div className="mb-8 h-10 w-72 animate-pulse rounded bg-muted" />
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-4 w-full animate-pulse rounded bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

export default async function CustomProjectSupportPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <Suspense fallback={<CustomProjectSupportLoadingSkeleton />}>
      <CustomProjectSupportContent locale={locale} />
    </Suspense>
  );
}
