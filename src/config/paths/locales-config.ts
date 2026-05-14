/**
 * Canonical locale configuration.
 */

export const LOCALES_CONFIG = Object.freeze({
  locales: Object.freeze(["en", "es", "zh"] as const),
  publicLocales: Object.freeze(["en", "es"] as const),
  defaultLocale: "en" as const,
  localePrefix: "always" as const,

  // Display/helper prefixes are metadata. next-intl route prefix behavior is
  // controlled by `localePrefix` above.
  prefixes: Object.freeze({
    en: "",
    es: "/es",
    zh: "/zh",
  }),

  displayNames: Object.freeze({
    en: "English",
    es: "Español",
    zh: "中文",
  }),

  timeZones: Object.freeze({
    en: "UTC",
    es: "America/Mexico_City",
    zh: "Asia/Shanghai",
  }),

  currencies: Object.freeze({
    en: "USD",
    es: "USD",
    zh: "CNY",
  }),
} as const);

/**
 * @public Locale configuration contract for downstream routing customization.
 */
export type LocalesConfig = typeof LOCALES_CONFIG;
export type ConfiguredLocale = (typeof LOCALES_CONFIG.locales)[number];
export type PublicSeoLocale = (typeof LOCALES_CONFIG.publicLocales)[number];
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

export function isPublicSeoLocale(
  locale: ConfiguredLocale,
): locale is PublicSeoLocale {
  return LOCALES_CONFIG.publicLocales.includes(locale as PublicSeoLocale);
}
