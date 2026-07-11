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

/**
 * Resolves active source-checkout content first, then the optional
 * showcase-full profile fixtures used by direct routes.
 */
export function resolveOptionalContentEntry(
  type: ContentType,
  locale: Locale,
  slug: string,
): ContentEntry | undefined {
  const entry = lookupContentEntry(type, locale, slug);
  if (entry === undefined) {
    return undefined;
  }

  if (entry.source !== "profile-fixture") {
    return entry;
  }

  // Only the showcase-full fixture set is exposed on direct routes.
  return entry.profileId === "showcase-full" ? entry : undefined;
}
