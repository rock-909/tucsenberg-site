/**
 * Canonical locale configuration.
 */

export const LOCALES_CONFIG = Object.freeze({
  locales: Object.freeze(["en"] as const),
  defaultLocale: "en" as const,
  localePrefix: "never" as const,

  // Retired prefixes are not public locales. They only help UI helpers turn
  // stale old-language URLs back into current no-prefix URLs.
  retiredLocales: Object.freeze(["zh"] as const),

  // Display/helper prefixes are metadata. next-intl route prefix behavior is
  // controlled by `localePrefix` above.
  prefixes: Object.freeze({
    en: "",
  }),

  displayNames: Object.freeze({
    en: "English",
  }),

  triggerLabels: Object.freeze({
    en: "EN",
  }),

  timeZones: Object.freeze({
    en: "UTC",
  }),

  currencies: Object.freeze({
    en: "USD",
  }),
} as const);

/**
 * @public Locale configuration contract for downstream routing customization.
 */
export type LocalesConfig = typeof LOCALES_CONFIG;
export type ConfiguredLocale = (typeof LOCALES_CONFIG.locales)[number];
export type ConfiguredCurrency =
  (typeof LOCALES_CONFIG.currencies)[ConfiguredLocale];

export function getLocaleTimeZone(locale: ConfiguredLocale): string {
  return LOCALES_CONFIG.timeZones[locale];
}

export function getLocaleCurrency(
  locale: ConfiguredLocale,
): ConfiguredCurrency {
  return LOCALES_CONFIG.currencies[locale];
}
