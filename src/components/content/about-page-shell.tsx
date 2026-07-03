import { Suspense, type ComponentProps, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Crosshair,
  HeadphonesIcon,
  Wrench,
} from "lucide-react";
import { MDXContent } from "@/components/mdx/mdx-content";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";
import { FaqSection } from "@/components/sections/faq-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteFacts } from "@/config/site-facts";
import {
  SINGLE_SITE_ABOUT_PAGE_EXPRESSION,
  SINGLE_SITE_ABOUT_STATS_ITEMS,
  SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS,
} from "@/config/single-site-page-expression";
import { Link } from "@/i18n/routing";
import {
  LAYER1_FACTS,
  generateFaqSchemaFromItems,
  interpolateFaqAnswer,
} from "@/lib/content/mdx-faq";
import { buildAboutPageSchema } from "@/lib/structured-data-generators";
import type {
  AboutPageSections,
  FaqItem,
  Locale,
  PageMetadata,
} from "@/types/content.types";

interface AboutPageShellProps {
  metadata: PageMetadata;
  content: string;
  locale: string;
}

interface ValueCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

type AboutStatValueSource =
  (typeof SINGLE_SITE_ABOUT_STATS_ITEMS)[number]["valueSource"];
type AboutValueItemKey = (typeof SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS)[number];

function assertNever(value: never): never {
  throw new Error(`Unhandled about page expression key: ${String(value)}`);
}

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-foreground">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

function resolveAboutStatValue(
  source: AboutStatValueSource,
): string {
  switch (source) {
    case "yearsInBusiness":
      return `${siteFacts.company.yearsInBusiness}`;
    case "exportCountries":
      return `${siteFacts.stats.exportCountries}`;
    case "employees":
      return `${siteFacts.company.employees}`;
    case "exampleFootprint":
      return `${siteFacts.stats.exampleFootprint}`;
    default:
      return assertNever(source);
  }
}

function resolveValueIcon(key: AboutValueItemKey): ReactNode {
  switch (key) {
    case "quality":
      return <Crosshair className="size-6" />;
    case "innovation":
      return <Wrench className="size-6" />;
    case "service":
      return <HeadphonesIcon className="size-6" />;
    case "integrity":
      return <BadgeCheck className="size-6" />;
    default:
      return assertNever(key);
  }
}

function createAboutSchema(metadata: PageMetadata, locale: string) {
  return buildAboutPageSchema({
    title: metadata.title,
    locale,
    companyName: siteFacts.company.name,
    established: siteFacts.company.established,
    employees: siteFacts.company.employees,
    ...(metadata.description ? { description: metadata.description } : {}),
  });
}

function getAboutSections(metadata: PageMetadata): AboutPageSections {
  if (!metadata.aboutSections) {
    throw new Error("About page metadata is missing aboutSections frontmatter");
  }

  return metadata.aboutSections;
}

function getAboutValueCopy(shellCopy: AboutPageSections, key: string) {
  const value = shellCopy.values[key];
  if (!value) {
    throw new Error(`About page metadata is missing value copy for ${key}`);
  }

  return value;
}

function buildAboutValueItems(shellCopy: AboutPageSections) {
  return SINGLE_SITE_ABOUT_VALUE_ITEM_KEYS.map((key) => {
    const copy = getAboutValueCopy(shellCopy, key);
    return {
      key,
      title: copy.title,
      description: copy.description,
      icon: resolveValueIcon(key),
    };
  });
}

function buildAboutStatItems(shellCopy: AboutPageSections) {
  return SINGLE_SITE_ABOUT_STATS_ITEMS.map((item) => ({
    key: item.key,
    value: `${resolveAboutStatValue(item.valueSource)}${item.suffix}`,
    label: shellCopy.statLabels[item.labelKey],
  }));
}

export function AboutPageShell({
  metadata,
  content,
  locale,
}: AboutPageShellProps): ReactNode {
  const typedLocale = locale as Locale;
  const shellCopy = getAboutSections(metadata);

  const faqItems: FaqItem[] = (metadata.faq ?? []).map((item) => ({
    ...item,
    answer: interpolateFaqAnswer(item.answer, LAYER1_FACTS),
  }));

  const valueItems = buildAboutValueItems(shellCopy);
  const statItems = buildAboutStatItems(shellCopy);

  const ctaHref = SINGLE_SITE_ABOUT_PAGE_EXPRESSION.ctaHref as ComponentProps<
    typeof Link
  >["href"];
  const aboutSchema = createAboutSchema(metadata, locale);
  const faqSchema =
    faqItems.length > 0 ? generateFaqSchemaFromItems(faqItems, typedLocale) : null;

  return (
    <div>
      <JsonLdGraphScript
        locale={typedLocale}
        data={faqSchema ? [aboutSchema, faqSchema] : [aboutSchema]}
      />

      <section className="section-divider px-6 py-14 md:py-[72px]">
        <div className="mx-auto max-w-[1080px]">
          <div className="max-w-3xl">
            <h1 className="text-heading mb-4">
              {metadata.heroTitle ?? metadata.title}
            </h1>
            {metadata.heroSubtitle ? (
              <p className="mb-4 text-xl font-medium text-foreground">
                {metadata.heroSubtitle}
              </p>
            ) : null}
            {metadata.heroDescription ? (
              <p className="text-body text-muted-foreground">
                {metadata.heroDescription}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {content.trim().length > 0 ? (
        <article className="section-divider px-6 py-14 md:py-[72px]">
          <div className="mx-auto max-w-[1080px]">
            <MDXContent
              type="pages"
              locale={typedLocale}
              slug={metadata.slug}
              className="prose max-w-none"
            />
          </div>
        </article>
      ) : null}

      <section className="section-divider bg-muted/40 px-6 py-14 md:py-[72px]">
        <div className="mx-auto max-w-[1080px]">
          <h2 className="mb-10 text-center text-2xl font-bold">
            {shellCopy.valuesTitle}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {valueItems.map((item) => (
              <ValueCard
                key={item.key}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section-divider px-6 py-14 md:py-[72px]">
        <div className="mx-auto max-w-[1080px]">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {statItems.map((item) => (
              <div key={item.key} className="text-center">
                <div className="mb-2 font-mono text-4xl font-bold text-foreground">
                  {item.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {faqItems.length > 0 ? (
        <Suspense fallback={null}>
          <FaqSection
            faqItems={faqItems}
            locale={typedLocale}
            renderJsonLd={false}
          />
        </Suspense>
      ) : null}

      <section className="section-divider px-6 py-14 md:py-[72px]">
        <div className="mx-auto max-w-[1080px]">
          <div className="surface-card px-6 py-10 text-center md:px-10 md:py-12">
            <h2 className="mb-4 text-2xl font-bold">{shellCopy.cta.title}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              {shellCopy.cta.description}
            </p>
            <Button asChild size="lg">
              <Link href={ctaHref}>
                {shellCopy.cta.button}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
