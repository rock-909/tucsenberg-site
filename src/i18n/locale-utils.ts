import { routing, type Locale } from "@/i18n/routing-config";

export function isLocale(input: string): input is Locale {
  return (routing.locales as readonly string[]).includes(input);
}

export function coerceLocale(input: string | null | undefined): Locale {
  return input && isLocale(input) ? input : (routing.defaultLocale as Locale);
}
