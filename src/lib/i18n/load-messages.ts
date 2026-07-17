/**
 * Translation Message Loader
 *
 * Runtime canonical source is physical message packs under
 * `messages/base/**` and `messages/profiles/**`.
 * Flat locale files may still exist for tooling/tests, but server runtime must
 * not depend on them.
 */

import { type Locale } from "@/i18n/routing-config";
import { coerceLocale } from "@/i18n/locale-utils";
import { loadComposedRawMessages } from "@/lib/i18n/message-pack-loader";
import {
  getSiteMessageValues,
  type SiteMessageValues,
} from "@/lib/i18n/site-message-values";

type Messages = Record<string, unknown>;

function interpolateSiteMessageString(
  value: string,
  locale: Locale,
  siteValues: SiteMessageValues,
): string {
  const replacements: Record<string, string> = {
    siteName: siteValues.siteName,
    companyName: siteValues.companyName,
    currentYear: siteValues.currentYear,
    copyright: siteValues.copyright[locale],
  };

  return value.replace(
    /\{(siteName|companyName|currentYear|copyright)\}/gu,
    (match, key: string) => replacements[key] ?? match,
  );
}

function interpolateSiteMessageValues(
  value: unknown,
  locale: Locale,
  siteValues: SiteMessageValues,
): unknown {
  if (typeof value === "string") {
    return interpolateSiteMessageString(value, locale, siteValues);
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      interpolateSiteMessageValues(item, locale, siteValues),
    );
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        interpolateSiteMessageValues(item, locale, siteValues),
      ]),
    );
  }

  return value;
}

async function loadMessageSource(locale: Locale): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  const loadedMessages = await loadComposedRawMessages(safeLocale);

  return interpolateSiteMessageValues(
    loadedMessages,
    safeLocale,
    getSiteMessageValues(),
  ) as Messages;
}

export function loadCompleteMessagesFromSource(
  locale: string,
): Promise<Messages> {
  return loadMessageSource(coerceLocale(locale));
}

export function loadCompleteMessages(locale: Locale): Promise<Messages> {
  return loadMessageSource(coerceLocale(locale));
}
