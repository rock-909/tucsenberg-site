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

export type ProfileFixtureId = NonNullable<ContentEntry["profileId"]>;

export interface ContentEntryQueryOptions {
  source?: ContentEntry["source"];
  profileId?: ProfileFixtureId;
}

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

function matchesEntryQuery(
  entry: ContentEntry,
  options: ContentEntryQueryOptions,
): boolean {
  if (options.source !== undefined && entry.source !== options.source) {
    return false;
  }

  if (
    options.profileId !== undefined &&
    entry.profileId !== options.profileId
  ) {
    return false;
  }

  return true;
}

/** Returns active source-checkout content; profile defaults live in config/starter-profiles. */
// eslint-disable-next-line max-params -- guardrail-exception GSE-20260520-manifest-query-options: manifest lookup mirrors type/locale/slug plus optional source filter
export function getContentEntry(
  type: ContentType,
  locale: Locale,
  slug: string,
  options?: ContentEntryQueryOptions,
): ContentEntry | undefined {
  const entry = lookupContentEntry(type, locale, slug);
  if (entry === undefined) {
    return undefined;
  }

  if (options !== undefined) {
    return matchesEntryQuery(entry, options) ? entry : undefined;
  }

  return entry.source === "profile-fixture" ? undefined : entry;
}

// eslint-disable-next-line max-params -- guardrail-exception GSE-20260520-profile-fixture-query: explicit profile fixture lookup keeps optional route seams readable
export function getProfileFixtureContentEntry(
  profileId: ProfileFixtureId,
  type: ContentType,
  locale: Locale,
  slug: string,
): ContentEntry | undefined {
  return getContentEntry(type, locale, slug, {
    source: "profile-fixture",
    profileId,
  });
}

/** Resolves active content first, then optional showcase-full fixtures for direct routes. */
export function resolveOptionalContentEntry(
  type: ContentType,
  locale: Locale,
  slug: string,
): ContentEntry | undefined {
  return (
    getContentEntry(type, locale, slug) ??
    getProfileFixtureContentEntry("showcase-full", type, locale, slug)
  );
}

export interface ContentEntriesByTypeOptions {
  includeProfileFixtures?: boolean;
}

export function getContentEntriesByType(
  type: ContentType,
  locale?: Locale,
  options: ContentEntriesByTypeOptions = {},
): ContentEntry[] {
  return CONTENT_MANIFEST.entries.filter((entry) => {
    if (entry.type !== type) return false;
    if (locale !== undefined && entry.locale !== locale) return false;
    if (!options.includeProfileFixtures && entry.source === "profile-fixture") {
      return false;
    }
    return true;
  });
}

export function getAllContentEntries(): ContentEntry[] {
  return CONTENT_MANIFEST.entries;
}
