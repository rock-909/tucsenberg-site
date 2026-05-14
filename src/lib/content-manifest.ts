/**
 * Content Manifest Loader
 *
 * Provides utilities to query the content manifest for MDX RSC rendering.
 * Uses static import from generated TypeScript file - no runtime fs dependency.
 */

import type { ContentType, Locale } from "@/types/content.types";
import {
  CONTENT_MANIFEST,
  type ContentEntry,
} from "./content-manifest.generated";

export type { ContentEntry };

function buildKey(type: ContentType, locale: Locale, slug: string): string {
  return `${type}/${locale}/${slug}`;
}

export function getContentEntry(
  type: ContentType,
  locale: Locale,
  slug: string,
): ContentEntry | undefined {
  const key = buildKey(type, locale, slug);
  return CONTENT_MANIFEST.byKey[key];
}

export function getContentEntriesByType(
  type: ContentType,
  locale?: Locale,
): ContentEntry[] {
  return CONTENT_MANIFEST.entries.filter((entry) => {
    if (entry.type !== type) return false;
    if (locale !== undefined && entry.locale !== locale) return false;
    return true;
  });
}

export function getAllContentEntries(): ContentEntry[] {
  return CONTENT_MANIFEST.entries;
}
