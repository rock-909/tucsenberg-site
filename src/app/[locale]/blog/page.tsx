import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  generateLocaleStaticParams,
  type LocaleParam,
} from "@/app/[locale]/generate-static-params";
import {
  getBlogArticlePath,
  getLocalizedPath,
  type Locale,
} from "@/config/paths";
import { generateMetadataForPath } from "@/lib/seo-metadata";
import { getStarterBlogArticles } from "@/lib/blog/starter-blog";

interface BlogPageProps {
  params: Promise<LocaleParam>;
}

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return generateMetadataForPath({
    locale: locale as Locale,
    pageType: "blog",
    path: getLocalizedPath("blog", locale as Locale),
    config: {
      title: t("index.title"),
      description: t("index.description"),
      type: "website",
    },
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const articles = getStarterBlogArticles(locale);

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-16">
      <header className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {t("index.eyebrow")}
        </p>
        <h1 className="text-heading mb-4">{t("index.title")}</h1>
        <p className="text-body text-muted-foreground">
          {t("index.description")}
        </p>
      </header>

      <section
        aria-label={t("index.articleListLabel")}
        className="mt-12 grid gap-6 md:grid-cols-2"
      >
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={getBlogArticlePath(article.slug)}
            className="group rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{article.publishedAt}</span>
              <span aria-hidden="true">/</span>
              <span>{article.readingTime}</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground group-hover:text-primary">
              {article.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {article.description}
            </p>
            <span className="mt-6 inline-flex text-sm font-semibold text-primary">
              {t("index.readArticle")}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
