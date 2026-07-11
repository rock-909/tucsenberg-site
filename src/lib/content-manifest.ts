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

function lookupContentEntry(
  type: ContentType,
  locale: Locale,
  slug: string,
): ContentEntry | undefined {
  return CONTENT_MANIFEST.byKey[buildKey(type, locale, slug)];
}

export function resolveOptionalContentEntry(
  type: ContentType,
  locale: Locale,
  slug: string,
): ContentEntry | undefined {
  return lookupContentEntry(type, locale, slug);
}
