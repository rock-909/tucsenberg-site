import { BLOG_FEATURED_ARTICLE_COUNT } from "@/lib/blog/constants";

export function splitBlogIndexArticles<T>(
  articles: readonly T[],
  featuredLimit = BLOG_FEATURED_ARTICLE_COUNT,
): {
  featuredArticles: readonly T[];
  archiveArticles: readonly T[];
} {
  return {
    featuredArticles: articles.slice(0, featuredLimit),
    archiveArticles: articles.slice(featuredLimit),
  };
}
