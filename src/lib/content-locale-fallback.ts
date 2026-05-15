import type { ContentType, Locale } from "@/types/content.types";

const STEP_2_CONTENT_LOCALE_FALLBACKS: Partial<
  Record<ContentType, Partial<Record<Locale, Locale>>>
> = {
  pages: {
    es: "en",
  },
};

export function getContentLocaleCandidates(
  type: ContentType,
  locale: Locale,
): readonly Locale[] {
  const fallbackLocale = STEP_2_CONTENT_LOCALE_FALLBACKS[type]?.[locale];

  if (fallbackLocale === undefined || fallbackLocale === locale) {
    return [locale];
  }

  return [locale, fallbackLocale];
}
