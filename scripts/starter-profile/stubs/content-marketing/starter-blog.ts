import type { Locale } from "@/config/paths/types";

interface StarterBlogSection {
  heading: string;
  body: string;
}

export interface StarterBlogArticle {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readingTime: string;
  sections: readonly StarterBlogSection[];
}

export function getStarterBlogArticles(
  _locale: Locale,
): readonly StarterBlogArticle[] {
  return [];
}

export function getStarterBlogArticle(
  locale: Locale,
  slug: string,
): StarterBlogArticle {
  const article = getStarterBlogArticles(locale).find(
    (item) => item.slug === slug,
  );

  if (!article) {
    throw new Error(`Unknown starter blog article: ${slug}`);
  }

  return article;
}

export function getStarterBlogArticleModifiedAt(
  article: Pick<StarterBlogArticle, "publishedAt">,
): string {
  return article.publishedAt;
}

export function getStarterBlogArticleSlugs(): string[] {
  return [];
}
