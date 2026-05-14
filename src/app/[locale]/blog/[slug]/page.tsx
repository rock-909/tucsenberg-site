import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  getStarterBlogArticle,
  getStarterBlogArticleSlugs,
} from "@/lib/blog/starter-blog";
import {
  getBlogArticlePath,
  getCanonicalPath,
  type Locale,
} from "@/config/paths";
import { generateMetadataForPath } from "@/lib/seo-metadata";

interface BlogArticlePageProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export function generateStaticParams() {
  return (["en", "zh"] as const).flatMap((locale) =>
    getStarterBlogArticleSlugs().map((slug) => ({
      locale,
      slug,
    })),
  );
}

function loadArticle(locale: Locale, slug: string) {
  try {
    return getStarterBlogArticle(locale, slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = loadArticle(locale, slug);
  if (!article) {
    notFound();
  }

  return generateMetadataForPath({
    locale,
    pageType: "blog",
    path: getBlogArticlePath(article.slug),
    config: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.publishedAt,
      section: "Launch guide",
    },
  });
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const article = loadArticle(locale, slug);
  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[840px] px-6 py-16">
      <Link
        href={getCanonicalPath("blog")}
        className="mb-8 inline-flex text-sm font-semibold text-primary hover:underline"
      >
        {t("article.backToBlog")}
      </Link>

      <article>
        <header>
          <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{article.publishedAt}</span>
            <span aria-hidden="true">/</span>
            <span>{article.readingTime}</span>
          </div>
          <h1 className="text-heading mb-5">{article.title}</h1>
          <p className="text-body text-muted-foreground">
            {article.description}
          </p>
        </header>

        <div className="mt-12 space-y-10">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-2xl font-semibold tracking-[-0.02em]">
                {section.heading}
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
