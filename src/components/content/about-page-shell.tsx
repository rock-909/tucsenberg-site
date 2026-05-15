import { Suspense, type ComponentProps, type ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Crosshair,
  HeadphonesIcon,
  Wrench,
} from "lucide-react";
import { MDXContent } from "@/components/mdx/mdx-content";
import { JsonLdGraphScript } from "@/components/seo";
import { FaqSection } from "@/components/sections/faq-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
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

function ValueCard({ icon, title, description }: ValueCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
  source: (typeof SINGLE_SITE_ABOUT_STATS_ITEMS)[number]["valueSource"],
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
      return "";
  }
}

function resolveValueIcon(key: string): ReactNode {
  switch (key) {
    case "quality":
      return <Crosshair className="h-6 w-6" />;
    case "innovation":
      return <Wrench className="h-6 w-6" />;
    case "service":
      return <HeadphonesIcon className="h-6 w-6" />;
    default:
      return <BadgeCheck className="h-6 w-6" />;
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

      <section className="relative overflow-hidden bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-heading mb-4">
              {metadata.heroTitle ?? metadata.title}
            </h1>
            {metadata.heroSubtitle ? (
              <p className="mb-4 text-xl font-medium text-primary">
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
        <article className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <MDXContent
              type="pages"
              locale={typedLocale}
              slug={metadata.slug}
              className="prose max-w-none"
            />
          </div>
        </article>
      ) : null}

      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-bold">
            {shellCopy.valuesTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {statItems.map((item) => (
              <MetricCard
                key={item.key}
                label={item.label}
                value={item.value}
                className="items-center text-center"
              />
            ))}
          </dl>
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

      <section className="bg-primary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-primary-foreground">
            {shellCopy.cta.title}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            {shellCopy.cta.description}
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href={ctaHref}>
              {shellCopy.cta.button}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
