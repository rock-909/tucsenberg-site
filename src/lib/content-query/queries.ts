/**
 * 内容查询函数
 */

import { cache } from "react";
import type {
  ContentMetadata,
  ContentType,
  Locale,
  Page,
  PageMetadata,
  ParsedContent,
} from "@/types/content.types";
import { getContentEntry } from "@/lib/content-manifest";
import { getContentLocaleCandidates } from "@/lib/content-locale-fallback";

type ContentLoader<T> = (slug: string, locale?: Locale) => T;

function cacheOutsideCloudflare<T>(loader: ContentLoader<T>): ContentLoader<T> {
  const cachedLoader = cache(loader);
  return (slug, locale) => cachedLoader(slug, locale);
}

/**
 * Get content by slug
 */
function getContentBySlug<T extends ContentMetadata = ContentMetadata>(
  slug: string,
  type: ContentType,
  locale?: Locale,
): ParsedContent<T> {
  if (locale === undefined) {
    throw new Error(`Content not found: ${slug}`);
  }

  const entry = getContentLocaleCandidates(type, locale)
    .map((candidateLocale) => getContentEntry(type, candidateLocale, slug))
    .find((candidateEntry) => candidateEntry !== undefined);

  if (entry === undefined) {
    throw new Error(`Content not found: ${slug}`);
  }

  return {
    slug: entry.slug,
    metadata: entry.metadata as T,
    content: entry.content,
    filePath: entry.filePath,
  };
}

/**
 * Get page by slug
 */
export const getPageBySlug = cacheOutsideCloudflare(
  (slug: string, locale?: Locale): Promise<Page> => {
    return Promise.resolve().then(
      () => getContentBySlug<PageMetadata>(slug, "pages", locale) as Page,
    );
  },
);
