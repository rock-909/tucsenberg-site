import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { Button } from "@/components/ui/button";
import { BreathingReveal } from "@/components/motion/breathing-reveal";
import { HeroSection } from "@/components/sections/hero-section";
import { getLocalizedPath } from "@/config/paths";
import {
  SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS,
  SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS,
  SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS,
  SINGLE_SITE_HOME_SECTION_ORDER,
  type SingleSiteHomeSectionKey,
} from "@/config/single-site-page-expression";
import {
  getSingleSiteHomeFinalCtaTargetsFromLinks,
  getSingleSiteHomeLinkTargets,
  type SingleSiteHomeFinalCtaTarget,
} from "@/config/single-site-links";
import { Link } from "@/i18n/routing";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";

type HomeTranslator = Awaited<ReturnType<typeof getTranslations>>;

interface HomeCardItem {
  title: string;
  description: string;
}

interface HomeStepItem extends HomeCardItem {
  number: string;
}

interface HomePageProps {
  params: Promise<LocaleParam>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "home",
    path: getLocalizedPath("home", locale as Locale),
  });
}

function getHomePageContent(t: HomeTranslator) {
  return {
    problems: SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS.map((key) => ({
      title: t(`problems.items.${key}.title`),
      description: t(`problems.items.${key}.description`),
    })),
    answers: SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS.map((key) => ({
      title: t(`answer.items.${key}.title`),
      description: t(`answer.items.${key}.description`),
    })),
    startPath: SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS.map(
      (key, index) => ({
        number: String(index + 1).padStart(2, "0"),
        title: t(`startPath.items.${key}.title`),
        description: t(`startPath.items.${key}.description`),
      }),
    ),
  };
}

function HomeProblemSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: readonly HomeCardItem[];
}) {
  return (
    <section
      data-testid="home-problem-section"
      className="section-divider px-6 py-14 md:py-[72px]"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-2xl">
          <h2 className="text-balance text-[32px] font-semibold leading-tight">
            {title}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="surface-card min-w-0 p-5">
              <h3 className="text-balance font-semibold">{item.title}</h3>
              <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeCapabilitiesSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: readonly HomeCardItem[];
}) {
  return (
    <section
      data-testid="home-answer-section"
      className="section-divider px-6 py-14 md:py-[72px]"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-2xl">
          <h2 className="text-balance text-[32px] font-semibold leading-tight">
            {title}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            {description}
          </p>
        </div>
        <div
          data-testid="home-answer-proof-panel"
          className="mt-8 surface-card rounded-2xl bg-muted/30 p-3 md:p-4"
        >
          <dl className="grid gap-2 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.title}
                data-testid="home-answer-proof-item"
                className="min-w-0 rounded-xl border border-border bg-background px-4 py-4"
              >
                <dt className="text-balance text-sm font-semibold text-foreground">
                  {item.title}
                </dt>
                <dd className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function HomeStartPathSection({
  t,
  items,
}: {
  t: HomeTranslator;
  items: readonly HomeStepItem[];
}) {
  return (
    <section
      data-testid="home-start-path-section"
      className="section-divider px-6 py-14 md:py-[72px]"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-2xl">
          <h2 className="text-balance text-[32px] font-semibold leading-tight">
            {t("startPath.title")}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            {t("startPath.description")}
          </p>
        </div>
        <ol className="mt-8 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.number}
              className="surface-card flex gap-4 p-5 md:gap-5"
            >
              <span
                data-testid="home-start-path-step-badge"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-[12px] font-semibold text-foreground"
              >
                {item.number}
              </span>
              <div className="min-w-0">
                <h3 className="text-balance font-semibold">{item.title}</h3>
                <p className="mt-1 text-pretty text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function HomeFinalAction({
  t,
  ctaTargets,
}: {
  t: HomeTranslator;
  ctaTargets: SingleSiteHomeFinalCtaTarget[];
}) {
  return (
    <section
      data-testid="home-final-action"
      className="section-divider px-6 py-14 md:py-[72px]"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="surface-card px-6 py-10 text-center md:px-10 md:py-12">
          <h2 className="text-balance text-[32px] font-semibold leading-tight md:text-[36px]">
            {t("finalCta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-[620px] text-pretty text-muted-foreground">
            {t("finalCta.description")}
          </p>
          {ctaTargets.length > 0 && (
            <div className="mt-8 flex flex-col items-center gap-3">
              {ctaTargets.map((target) =>
                target.labelKey === "secondary" ? (
                  <Button key={target.labelKey} size="lg" asChild>
                    <Link href={target.href}>{t("finalCta.secondary")}</Link>
                  </Button>
                ) : (
                  <Link
                    key={target.labelKey}
                    href={target.href}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("finalCta.primary")}
                  </Link>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const content = getHomePageContent(t);
  const homeLinks = getSingleSiteHomeLinkTargets();
  const finalCtaTargets = getSingleSiteHomeFinalCtaTargetsFromLinks(homeLinks);
  const homeSections = {
    hero: <HeroSection />,
    problems: (
      <BreathingReveal>
        <HomeProblemSection
          title={t("problems.title")}
          description={t("problems.description")}
          items={content.problems}
        />
      </BreathingReveal>
    ),
    answer: (
      <BreathingReveal>
        <HomeCapabilitiesSection
          title={t("answer.title")}
          description={t("answer.description")}
          items={content.answers}
        />
      </BreathingReveal>
    ),
    startPath: (
      <BreathingReveal>
        <HomeStartPathSection t={t} items={content.startPath} />
      </BreathingReveal>
    ),
    finalCta: (
      <BreathingReveal>
        <HomeFinalAction t={t} ctaTargets={finalCtaTargets} />
      </BreathingReveal>
    ),
  } satisfies Record<SingleSiteHomeSectionKey, ReactNode>;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <JsonLdGraphScript locale={locale as Locale} />
      <div>
        {SINGLE_SITE_HOME_SECTION_ORDER.map((sectionKey) => (
          <Fragment key={sectionKey}>{homeSections[sectionKey]}</Fragment>
        ))}
      </div>
    </div>
  );
}
