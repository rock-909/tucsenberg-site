/**
 * Cache tag utilities for Next.js 16 Cache Components.
 *
 * Runtime invalidation is not part of the current launch architecture.
 * Keep only i18n tags used by `src/lib/i18n/load-messages.ts`.
 */

import type { Locale } from "@/types/content.types";

export const CACHE_DOMAINS = {
  I18N: "i18n",
} as const;

type CacheDomain = (typeof CACHE_DOMAINS)[keyof typeof CACHE_DOMAINS];

export const CACHE_ENTITIES = {
  I18N: {
    CRITICAL: "critical",
    DEFERRED: "deferred",
    ALL: "all",
  },
} as const;

interface BuildTagOptions {
  domain: CacheDomain;
  entity: string;
  identifier?: string;
}

function buildTag(options: BuildTagOptions): string {
  const { domain, entity, identifier } = options;
  const parts = [domain, entity];

  if (identifier) {
    parts.push(identifier);
  }

  return parts.join(":");
}

export const i18nTags = {
  critical(locale: Locale): string {
    return buildTag({
      domain: CACHE_DOMAINS.I18N,
      entity: CACHE_ENTITIES.I18N.CRITICAL,
      identifier: locale,
    });
  },

  deferred(locale: Locale): string {
    return buildTag({
      domain: CACHE_DOMAINS.I18N,
      entity: CACHE_ENTITIES.I18N.DEFERRED,
      identifier: locale,
    });
  },

  all(): string {
    return buildTag({
      domain: CACHE_DOMAINS.I18N,
      entity: CACHE_ENTITIES.I18N.ALL,
    });
  },

  forLocale(locale: Locale): string[] {
    return [
      i18nTags.critical(locale),
      i18nTags.deferred(locale),
      i18nTags.all(),
    ];
  },
};
