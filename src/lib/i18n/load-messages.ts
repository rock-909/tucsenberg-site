/**
 * Translation Message Loader
 *
 * Runtime canonical source is physical message packs under
 * `messages/base/**` and `messages/profiles/**`.
 * Flat locale files may still exist for tooling/tests, but server runtime must
 * not depend on them.
 */

import { unstable_cache } from "next/cache";
import { i18nTags } from "@/lib/i18n/cache-tags";
import {
  isRuntimeCi,
  isRuntimeCloudflare,
  isRuntimeDevelopment,
  isRuntimePlaywright,
  isRuntimeProductionBuildPhase,
} from "@/lib/env";
import { mergeObjects } from "@/lib/merge-objects";
import { type Locale } from "@/i18n/routing-config";
import { coerceLocale } from "@/i18n/locale-utils";
import { type MessageType } from "@/lib/i18n/message-pack-config";
import { loadComposedRawMessages } from "@/lib/i18n/message-pack-loader";
import {
  getSiteMessageValues,
  type SiteMessageValues,
} from "@/lib/i18n/site-message-values";

type Messages = Record<string, unknown>;

const isCiEnv = isRuntimeCi() || isRuntimePlaywright();
const isProductionBuild = () => isRuntimeProductionBuildPhase();
const isDev = () => isRuntimeDevelopment();
const isCloudflareRuntime = () => isRuntimeCloudflare();
/**
 * next/cache `unstable_cache` expects `revalidate` in SECONDS. 30 minutes = 1800s.
 * Do not borrow a millisecond interval here: the retired bug used
 * `MONITORING_INTERVALS.CACHE_CLEANUP` (30 minutes in MILLISECONDS = 1,800,000),
 * which as seconds is ~20.8 days.
 */
export const I18N_MESSAGE_REVALIDATE_SECONDS = 30 * 60;

const revalidate = () => (isDev() ? 1 : I18N_MESSAGE_REVALIDATE_SECONDS);

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

async function loadMessageSource(
  locale: Locale,
  type: MessageType,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  const loadedMessages = await loadComposedRawMessages(safeLocale, type);

  return interpolateSiteMessageValues(
    loadedMessages,
    safeLocale,
    getSiteMessageValues(),
  ) as Messages;
}

function createCached(locale: Locale, type: MessageType) {
  return unstable_cache(
    () => loadMessageSource(locale, type),
    [`i18n-${type}`, locale],
    {
      revalidate: revalidate(),
      tags: [
        (type === "critical" ? i18nTags.critical : i18nTags.deferred)(locale),
        i18nTags.all(),
      ],
    },
  );
}

function load(locale: Locale, type: MessageType): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  return isCiEnv || isProductionBuild() || isCloudflareRuntime()
    ? loadMessageSource(safeLocale, type)
    : createCached(safeLocale, type)();
}

async function loadCompleteMessagesFromSourceInternal(
  locale: Locale,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  const [critical, deferred] = await Promise.all([
    loadMessageSource(safeLocale, "critical"),
    loadMessageSource(safeLocale, "deferred"),
  ]);
  return mergeObjects(critical ?? {}, deferred ?? {}) as Messages;
}

export function loadCriticalMessages(locale: Locale): Promise<Messages> {
  return load(locale, "critical");
}

export function loadDeferredMessages(locale: Locale): Promise<Messages> {
  return load(locale, "deferred");
}

export function loadCompleteMessagesFromSource(
  locale: string,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  return loadCompleteMessagesFromSourceInternal(safeLocale);
}

export async function loadCompleteMessages(locale: Locale): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  const [critical, deferred] = await Promise.all([
    loadCriticalMessages(safeLocale),
    loadDeferredMessages(safeLocale),
  ]);
  return mergeObjects(critical ?? {}, deferred ?? {}) as Messages;
}
