import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import { Button } from "@/components/ui/button";
import { getLocalizedPath } from "@/config/paths";
import {
  SINGLE_SITE_HOME_PUBLIC_DEMO_ANSWER_KEYS,
  SINGLE_SITE_HOME_PUBLIC_DEMO_PROBLEM_KEYS,
  SINGLE_SITE_HOME_PUBLIC_DEMO_START_PATH_KEYS,
} from "@/config/single-site-page-expression";
import { SINGLE_SITE_ROUTE_HREFS } from "@/config/single-site-links";
import { Link } from "@/i18n/routing";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";
import { JsonLdGraphScript } from "@/components/seo";

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

const HERO_PREVIEW_ITEMS = [
  { key: "page-structure", messageIndex: 0 },
  { key: "replacement-surface", messageIndex: 1 },
  { key: "inquiry-path", messageIndex: 2 },
  { key: "cloudflare-launch", messageIndex: 3 },
] as const;

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "home",
    path: getLocalizedPath("home", locale as Locale),
    config: {
      description: t("hero.subtitle"),
    },
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

function HomeHero({ t }: { t: HomeTranslator }) {
  return (
    <section data-testid="hero-section" className="px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-[1080px] gap-10 md:grid-cols-[1.12fr_0.88fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[1.08] tracking-[-0.04em] md:text-[56px]">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-[620px] text-lg leading-8 text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={SINGLE_SITE_ROUTE_HREFS.comingSoon}>
                {t("hero.cta.primary")}
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={SINGLE_SITE_ROUTE_HREFS.comingSoon}>
                {t("hero.cta.secondary")}
              </Link>
            </Button>
          </div>
        </div>

        <div
          className="rounded-2xl border border-border bg-card p-6 shadow-border"
          data-testid="hero-preview-card"
          aria-labelledby="hero-preview-title"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("hero.preview.label")}
          </p>
          <h2
            id="hero-preview-title"
            className="mt-3 text-2xl font-bold tracking-[-0.03em]"
          >
            {t("hero.preview.title")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t("hero.preview.description")}
          </p>
          <ul className="mt-6 space-y-3">
            {HERO_PREVIEW_ITEMS.map((item) => (
              <li
                key={item.key}
                className="rounded-xl border border-border bg-muted px-4 py-3 text-sm font-medium"
              >
                {t(`hero.preview.items.${item.messageIndex}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CardGridSection({
  title,
  description,
  items,
  testId,
  columnsClassName,
  muted = false,
}: {
  title: string;
  description: string;
  items: readonly HomeCardItem[];
  testId: string;
  columnsClassName: string;
  muted?: boolean;
}) {
  return (
    <section
      data-testid={testId}
      className={`border-t border-border px-6 py-14 md:py-20 ${
        muted ? "bg-muted/40" : ""
      }`}
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-[-0.03em]">
            {title}
          </h2>
          <p
            className={
              muted ? "mt-3 text-foreground/80" : "mt-3 text-muted-foreground"
            }
          >
            {description}
          </p>
        </div>
        <div className={`mt-9 grid gap-4 ${columnsClassName}`}>
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartPathSection({
  t,
  items,
}: {
  t: HomeTranslator;
  items: readonly HomeStepItem[];
}) {
  return (
    <section
      data-testid="home-start-path-section"
      className="border-t border-border px-6 py-14 md:py-20"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-2xl">
          <h2 className="text-[32px] font-bold leading-tight tracking-[-0.03em]">
            {t("startPath.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("startPath.description")}
          </p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.number}
              className="rounded-xl border border-border bg-card p-5"
            >
              <span className="font-mono text-sm font-semibold text-primary">
                {item.number}
              </span>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeFinalAction({ t }: { t: HomeTranslator }) {
  return (
    <section
      data-testid="home-final-action"
      className="bg-primary px-6 py-16 text-primary-foreground md:py-24"
    >
      <div className="mx-auto max-w-[760px] text-center">
        <h2 className="text-[36px] font-bold leading-tight tracking-[-0.03em]">
          {t("finalCta.title")}
        </h2>
        <p className="mt-4 text-primary-foreground/90">
          {t("finalCta.description")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="on-dark" size="lg" asChild>
            <Link href={SINGLE_SITE_ROUTE_HREFS.comingSoon}>
              {t("finalCta.primary")}
            </Link>
          </Button>
          <Button variant="ghost-dark" size="lg" asChild>
            <Link href={SINGLE_SITE_ROUTE_HREFS.comingSoon}>
              {t("finalCta.secondary")}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ComingSoonSection({ t }: { t: HomeTranslator }) {
  return (
    <section
      id="coming-soon"
      data-testid="coming-soon-section"
      className="border-t border-border bg-muted/40 px-6 py-14 md:py-20"
    >
      <div className="mx-auto max-w-[760px] rounded-2xl border border-border bg-card p-6 shadow-border md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {t("comingSoon.quoteNote")}
        </p>
        <h2 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.03em]">
          {t("comingSoon.title")}
        </h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          {t("comingSoon.description")}
        </p>
        <div className="mt-6">
          <Button variant="secondary" asChild>
            <Link href={SINGLE_SITE_ROUTE_HREFS.home}>
              {t("comingSoon.backHome")}
            </Link>
          </Button>
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLdGraphScript locale={locale as Locale} />
      <div>
        <HomeHero t={t} />
        <CardGridSection
          title={t("problems.title")}
          description={t("problems.description")}
          items={content.problems}
          testId="home-problem-section"
          columnsClassName="md:grid-cols-5"
        />
        <CardGridSection
          title={t("answer.title")}
          description={t("answer.description")}
          items={content.answers}
          testId="home-answer-section"
          columnsClassName="md:grid-cols-2"
          muted
        />
        <StartPathSection t={t} items={content.startPath} />
        <ComingSoonSection t={t} />
        <HomeFinalAction t={t} />
      </div>
    </div>
  );
}
