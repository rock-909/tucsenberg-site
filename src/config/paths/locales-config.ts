/**
 * Canonical locale configuration.
 */

export const LOCALES_CONFIG = Object.freeze({
  locales: Object.freeze(["en", "zh"] as const),
  defaultLocale: "en" as const,
  localePrefix: "always" as const,

  // Display/helper prefixes are metadata. next-intl route prefix behavior is
  // controlled by `localePrefix` above.
  prefixes: Object.freeze({
    en: "",
    zh: "/zh",
  }),

  displayNames: Object.freeze({
    en: "English",
    zh: "中文",
  }),

  timeZones: Object.freeze({
    en: "UTC",
    zh: "Asia/Shanghai",
  }),

  currencies: Object.freeze({
    en: "USD",
    zh: "CNY",
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
