/**
 * Translation Message Loader
 *
 * Runtime canonical source is physical message packs under
 * `messages/base/**` and `messages/profiles/**`.
 * Flat locale files may still exist for tooling/tests, but server runtime must
 * not depend on them.
 */

import { unstable_cache } from "next/cache";
import {
  DEFAULT_STARTER_PROFILE_ID,
  type StarterProfileId,
} from "@/config/starter-profiles";
import { i18nTags } from "@/lib/i18n/cache-tags";
import {
  isRuntimeCi,
  isRuntimeCloudflare,
  isRuntimeDevelopment,
  isRuntimePlaywright,
  isRuntimeProductionBuildPhase,
} from "@/lib/env";
import { mergeObjects } from "@/lib/merge-objects";
import { MONITORING_INTERVALS } from "@/constants/performance-constants";
import { type Locale } from "@/i18n/routing";
import { coerceLocale } from "@/i18n/locale-utils";
import {
  getMessagePackIdsForProfile,
  type MessageType,
} from "@/lib/i18n/message-pack-config";
import { loadComposedRawMessages } from "@/lib/i18n/message-pack-loader";
import {
  getSiteMessageValues,
  type SiteMessageValues,
} from "@/lib/i18n/site-message-values";

type Messages = Record<string, unknown>;

export { getMessagePackIdsForProfile };

const isCiEnv = isRuntimeCi() || isRuntimePlaywright();
const isProductionBuild = () => isRuntimeProductionBuildPhase();
const isDev = () => isRuntimeDevelopment();
const isCloudflareRuntime = () => isRuntimeCloudflare();
const revalidate = () => (isDev() ? 1 : MONITORING_INTERVALS.CACHE_CLEANUP);

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

async function loadMessageSourceForProfile(
  locale: Locale,
  type: MessageType,
  profileId: StarterProfileId,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  const loadedMessages = await loadComposedRawMessages(
    safeLocale,
    type,
    profileId,
  );

  return interpolateSiteMessageValues(
    loadedMessages,
    safeLocale,
    getSiteMessageValues(),
  ) as Messages;
}

function createCachedForProfile(
  locale: Locale,
  type: MessageType,
  profileId: StarterProfileId,
) {
  return unstable_cache(
    () => loadMessageSourceForProfile(locale, type, profileId),
    [`i18n-${type}`, locale, profileId],
    {
      revalidate: revalidate(),
      tags: [
        (type === "critical" ? i18nTags.critical : i18nTags.deferred)(locale),
        i18nTags.all(),
      ],
    },
  );
}

function loadForProfile(
  locale: Locale,
  type: MessageType,
  profileId: StarterProfileId,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  return isCiEnv || isProductionBuild() || isCloudflareRuntime()
    ? loadMessageSourceForProfile(safeLocale, type, profileId)
    : createCachedForProfile(safeLocale, type, profileId)();
}

export function loadCriticalMessagesForProfile(
  locale: Locale,
  profileId: StarterProfileId,
): Promise<Messages> {
  return loadForProfile(locale, "critical", profileId);
}

export function loadDeferredMessagesForProfile(
  locale: Locale,
  profileId: StarterProfileId,
): Promise<Messages> {
  return loadForProfile(locale, "deferred", profileId);
}

export async function loadCompleteMessagesForProfile(
  locale: Locale,
  profileId: StarterProfileId,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  const [critical, deferred] = await Promise.all([
    loadCriticalMessagesForProfile(safeLocale, profileId),
    loadDeferredMessagesForProfile(safeLocale, profileId),
  ]);
  return mergeObjects(critical ?? {}, deferred ?? {}) as Messages;
}

async function loadCompleteMessagesFromSourceForProfile(
  locale: Locale,
  profileId: StarterProfileId,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  const [critical, deferred] = await Promise.all([
    loadMessageSourceForProfile(safeLocale, "critical", profileId),
    loadMessageSourceForProfile(safeLocale, "deferred", profileId),
  ]);
  return mergeObjects(critical ?? {}, deferred ?? {}) as Messages;
}

export function loadCriticalMessages(locale: Locale): Promise<Messages> {
  return loadCriticalMessagesForProfile(locale, DEFAULT_STARTER_PROFILE_ID);
}

export function loadDeferredMessages(locale: Locale): Promise<Messages> {
  return loadDeferredMessagesForProfile(locale, DEFAULT_STARTER_PROFILE_ID);
}

export function loadCompleteMessagesFromSource(
  locale: string,
): Promise<Messages> {
  const safeLocale = coerceLocale(locale);
  return loadCompleteMessagesFromSourceForProfile(
    safeLocale,
    DEFAULT_STARTER_PROFILE_ID,
  );
}

export function loadCompleteMessages(locale: Locale): Promise<Messages> {
  return loadCompleteMessagesForProfile(locale, DEFAULT_STARTER_PROFILE_ID);
}
