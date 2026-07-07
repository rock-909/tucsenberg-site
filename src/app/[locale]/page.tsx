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
  SINGLE_SITE_HOME_FAQ_ITEM_KEYS,
  SINGLE_SITE_HOME_HOW_TO_CHOOSE_ROW_KEYS,
  SINGLE_SITE_HOME_PRODUCT_CARD_BADGE_KEYS,
  SINGLE_SITE_HOME_PRODUCT_CARD_LINKS,
  SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS,
  SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS,
  SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS,
  SINGLE_SITE_HOME_SECTION_ORDER,
  type SingleSiteHomeSectionKey,
} from "@/config/single-site-page-expression";
import { FaqSectionView } from "@/components/sections/faq-section-view";
import { ProductLineGlyph } from "@/components/products/product-diagrams";
import type { TucsenbergProductDiagramKind } from "@/constants/tucsenberg-product-page-types";
import { generateFaqSchemaFromItems } from "@/lib/content/mdx-faq";
import { InlineMarkdown } from "@/lib/content/inline-markdown";
import {
  getSingleSiteHomeFinalCtaTargetsFromLinks,
  getSingleSiteHomeLinkTargets,
  type SingleSiteHomeFinalCtaTarget,
} from "@/config/single-site-links";
import { Link } from "@/i18n/routing";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import {
  JsonLdGraphScript,
  JsonLdScript,
} from "@/components/seo/json-ld-script";

type HomeTranslator = Awaited<ReturnType<typeof getTranslations>>;

interface HomeCardItem {
  title: string;
  description: string;
}

interface HomeProductCardItem extends HomeCardItem {
  href: string;
  linkLabel: string;
  glyph: TucsenbergProductDiagramKind;
  badge?: string;
}

const HOME_PRODUCT_CARD_GLYPHS: Record<
  (typeof SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS)[number],
  TucsenbergProductDiagramKind
> = {
  structure: "boxwall",
  content: "gate",
  deployment: "bag",
  inquiry: "tube",
  multilingual: "frp",
};

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

const HOME_PRODUCT_CARD_BADGE_KEY_SET = new Set<string>(
  SINGLE_SITE_HOME_PRODUCT_CARD_BADGE_KEYS,
);

function getHomePageContent(t: HomeTranslator) {
  return {
    problems: SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS.map(
      (key): HomeProductCardItem => ({
        title: t(`problems.items.${key}.title`),
        description: t(`problems.items.${key}.description`),
        href: SINGLE_SITE_HOME_PRODUCT_CARD_LINKS[key],
        linkLabel: t(`problems.items.${key}.linkLabel`),
        glyph: HOME_PRODUCT_CARD_GLYPHS[key],
        ...(HOME_PRODUCT_CARD_BADGE_KEY_SET.has(key)
          ? { badge: t(`problems.items.${key}.badge`) }
          : {}),
      }),
    ),
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
  items: readonly HomeProductCardItem[];
}) {
  return (
    <section
      data-testid="home-problem-section"
      className="section-divider px-6 py-14 md:py-[72px]"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-2xl">
          <h2 className="text-section text-balance">{title}</h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            {description}
          </p>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="surface-card group hover:border-ring relative flex min-w-0 flex-col p-5 transition-colors"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <ProductLineGlyph
                  kind={item.glyph}
                  className="text-muted-foreground size-8 shrink-0"
                />
                {item.badge ? (
                  <span className="border-border bg-muted text-muted-foreground inline-flex w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <h3 className="font-semibold text-balance">
                <Link
                  href={item.href}
                  className="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {item.title}
                </Link>
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6 text-pretty">
                {item.description}
              </p>
              <span
                aria-hidden
                className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium"
              >
                {item.linkLabel}
                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeHowToChooseSection({ t }: { t: HomeTranslator }) {
  return (
    <section
      data-testid="home-how-to-choose-section"
      className="section-divider px-6 py-14 md:py-[72px]"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-2xl">
          <h2 className="text-section text-balance">
            {t("howToChoose.title")}
          </h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            {t("howToChoose.description")}
          </p>
        </div>
        <div className="border-border mt-8 overflow-x-auto rounded-2xl border">
          <table className="divide-border min-w-full divide-y text-left text-sm">
            <thead className="bg-muted/60 text-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  {t("howToChoose.columns.situation")}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {t("howToChoose.columns.startWith")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {SINGLE_SITE_HOME_HOW_TO_CHOOSE_ROW_KEYS.map((key) => (
                <tr key={key}>
                  <td className="text-muted-foreground px-4 py-3 align-top">
                    {t(`howToChoose.rows.${key}.situation`)}
                  </td>
                  <td className="text-foreground px-4 py-3 align-top font-medium">
                    {t(`howToChoose.rows.${key}.startWith`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground mt-6 max-w-3xl text-sm leading-6">
          {t("howToChoose.honestNote")}
        </p>
        <p className="mt-4 text-sm font-medium">
          <InlineMarkdown text={t("howToChoose.guideLink")} />
        </p>
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
          <h2 className="text-section text-balance">{title}</h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            {description}
          </p>
        </div>
        <dl
          data-testid="home-answer-proof-panel"
          className="mt-8 grid gap-3 md:grid-cols-2"
        >
          {items.map((item) => (
            <div
              key={item.title}
              data-testid="home-answer-proof-item"
              className="border-border bg-background min-w-0 rounded-xl border px-5 py-5"
            >
              <dt className="text-foreground text-sm font-semibold text-balance">
                {item.title}
              </dt>
              <dd className="text-muted-foreground mt-2 text-sm leading-6 text-pretty">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
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
          <h2 className="text-section text-balance">{t("startPath.title")}</h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            {t("startPath.description")}
          </p>
        </div>
        <ol className="divide-border mt-6 max-w-3xl divide-y">
          {items.map((item) => (
            <li key={item.number} className="flex gap-4 py-5 md:gap-6">
              <span
                data-testid="home-start-path-step-badge"
                className="border-border bg-muted text-foreground flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-[12px] font-semibold"
              >
                {item.number}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-balance">{item.title}</h3>
                <p className="text-muted-foreground mt-1 max-w-[70ch] text-sm leading-6 text-pretty">
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
        <div className="bg-accent rounded-2xl px-6 py-10 text-center md:px-10 md:py-12">
          <h2 className="text-section text-balance">{t("finalCta.title")}</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-[620px] text-pretty">
            {t("finalCta.description")}
          </p>
          {ctaTargets.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {ctaTargets.map((target) =>
                target.labelKey === "primary" ? (
                  <Button key={target.labelKey} size="lg" asChild>
                    <Link href={target.href}>{t("finalCta.primary")}</Link>
                  </Button>
                ) : (
                  <Button
                    key={target.labelKey}
                    size="lg"
                    variant="outline"
                    asChild
                  >
                    <Link href={target.href}>{t("finalCta.secondary")}</Link>
                  </Button>
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
  const homeFaqItems = SINGLE_SITE_HOME_FAQ_ITEM_KEYS.map((key) => ({
    id: `home-faq-${key}`,
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
  }));
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
    howToChoose: (
      <BreathingReveal>
        <HomeHowToChooseSection t={t} />
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
    faq: (
      <BreathingReveal>
        <JsonLdScript data={generateFaqSchemaFromItems(homeFaqItems, locale)} />
        <div data-testid="home-faq-section">
          <FaqSectionView
            title={t("faq.title")}
            items={homeFaqItems.map((item) => ({
              key: item.id,
              question: item.question,
              answer: item.answer,
            }))}
          />
        </div>
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
    <div className="bg-background text-foreground min-h-dvh">
      <JsonLdGraphScript locale={locale as Locale} />
      <div>
        {SINGLE_SITE_HOME_SECTION_ORDER.map((sectionKey) => (
          <Fragment key={sectionKey}>{homeSections[sectionKey]}</Fragment>
        ))}
      </div>
    </div>
  );
}
