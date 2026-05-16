import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import {
  buildClientSearchIndex,
  oemBrands,
  type ClientSearchIndex,
} from "@/data/product-compatibility";
import { Button } from "@/components/ui/button";
import { JsonLdGraphScript } from "@/components/seo";
import { SlaCommitments } from "@/components/trust";
import { HomeHeroSearch } from "@/components/search/home-hero-search";
import { getLocalizedPath } from "@/config/paths";
import {
  FEATURED_MEMBRANE_HREF,
  SINGLE_SITE_ROUTE_HREFS,
} from "@/config/single-site-links";
import { Link } from "@/i18n/routing";
import { generateMetadataForPath, type Locale } from "@/lib/seo-metadata";

type HomeTranslator = Awaited<ReturnType<typeof getTranslations>>;

interface HomePageProps {
  params: Promise<LocaleParam>;
}

const MATERIAL_ITEMS = ["epdm", "tpu"] as const;
const BROWSE_ALL_MEMBRANES_HREF = FEATURED_MEMBRANE_HREF;

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

function Overline({ children }: { children: string }) {
  return (
    <p className="font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function HeroSection({
  t,
  searchIndex,
}: {
  t: HomeTranslator;
  searchIndex: ClientSearchIndex;
}) {
  return (
    <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="mx-auto max-w-[1080px]">
        <h1 className="max-w-[15ch] text-[40px] leading-[1.12] font-light tracking-[-0.01em] text-primary md:text-[60px] md:leading-[1.08]">
          {t("hero.title")}
        </h1>
        <p className="mt-5 max-w-[60ch] text-lg leading-[1.56] text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <div className="mt-8">
          <HomeHeroSearch searchIndex={searchIndex} />
        </div>
      </div>
    </section>
  );
}

function OemGridSection({ t }: { t: HomeTranslator }) {
  return (
    <section className="bg-card px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1080px]">
        <Overline>{t("oemGrid.overline")}</Overline>
        <h2 className="mt-3 text-[28px] leading-tight font-light tracking-[-0.01em] text-foreground md:text-[32px]">
          {t("oemGrid.title")}
        </h2>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {oemBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/compatible/${brand.slug}` as "/"}
              className="group rounded-[8px] border border-border bg-background p-6 shadow-border transition-shadow hover:shadow-[0_0_0_1px_var(--color-brand-accent)]"
            >
              <span className="text-lg font-semibold text-foreground">
                {brand.name}
              </span>
              <span className="mt-3 block text-sm font-medium text-[var(--color-brand-accent)] group-hover:underline">
                {t("oemGrid.viewAll", { brand: brand.name })}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MaterialsSection({ t }: { t: HomeTranslator }) {
  return (
    <section className="bg-card px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1080px]">
        <Overline>{t("materials.overline")}</Overline>
        <h2 className="mt-3 text-[28px] leading-tight font-light tracking-[-0.01em] text-foreground md:text-[32px]">
          {t("materials.title")}
        </h2>
        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {MATERIAL_ITEMS.map((key) => (
            <article
              key={key}
              className="rounded-[8px] border border-border bg-background p-6 shadow-border"
            >
              <h3 className="font-mono text-sm font-semibold tracking-[0.5px] text-foreground">
                {t(`materials.${key}.name`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t(`materials.${key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ t }: { t: HomeTranslator }) {
  return (
    <section className="bg-primary px-6 py-20 text-primary-foreground md:py-24">
      <div className="mx-auto max-w-[720px]">
        <h2 className="text-[28px] leading-tight font-light tracking-[-0.01em] md:text-[36px]">
          {t("cta.title")}
        </h2>
        <p className="mt-4 max-w-[52ch] text-primary-foreground/85">
          {t("cta.description")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="on-dark" size="lg" asChild>
            <Link href={SINGLE_SITE_ROUTE_HREFS.quote}>
              {t("cta.requestQuote")}
            </Link>
          </Button>
          <Button variant="ghost-dark" size="lg" asChild>
            <Link href={BROWSE_ALL_MEMBRANES_HREF as "/"}>
              {t("cta.viewMembranes")}
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
  const searchIndex = buildClientSearchIndex();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLdGraphScript locale={locale as Locale} />
      <HeroSection t={t} searchIndex={searchIndex} />
      <OemGridSection t={t} />
      <section className="p-6">
        <div className="mx-auto max-w-[1080px]">
          <SlaCommitments locale={locale as Locale} layout="ribbon" />
        </div>
      </section>
      <MaterialsSection t={t} />
      <FinalCta t={t} />
    </div>
  );
}
