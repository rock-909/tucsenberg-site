import type { LocalizedText } from "@/data/product-compatibility/schemas";

/**
 * Resolve a {@link LocalizedText} value for the active locale.
 *
 * Falls back to English for any locale outside the public set, which keeps
 * server and client compatibility surfaces consistent.
 */
export function localizeText(text: LocalizedText, locale: string): string {
  if (locale === "es") return text.es;
  if (locale === "zh") return text.zh;
  return text.en;
}
