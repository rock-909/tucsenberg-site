import type { Locale } from "@/types/content.types";

export const I18N_CACHE_NAMESPACE = "i18n";

export const I18N_CACHE_ENTITIES = {
  CRITICAL: "critical",
  DEFERRED: "deferred",
  ALL: "all",
} as const;

interface BuildI18nTagOptions {
  entity: string;
  identifier?: string;
}

function buildI18nTag(options: BuildI18nTagOptions): string {
  const { entity, identifier } = options;
  const parts = [I18N_CACHE_NAMESPACE, entity];

  if (identifier) {
    parts.push(identifier);
  }

  return parts.join(":");
}

export const i18nTags = {
  critical(locale: Locale): string {
    return buildI18nTag({
      entity: I18N_CACHE_ENTITIES.CRITICAL,
      identifier: locale,
    });
  },

  deferred(locale: Locale): string {
    return buildI18nTag({
      entity: I18N_CACHE_ENTITIES.DEFERRED,
      identifier: locale,
    });
  },

  all(): string {
    return buildI18nTag({
      entity: I18N_CACHE_ENTITIES.ALL,
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
