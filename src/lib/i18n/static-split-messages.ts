import "server-only";

import type { Locale } from "@/types/content.types";
import { mergeObjects } from "@/lib/merge-objects";
import enCriticalMessages from "@messages/en/critical.json";
import enDeferredMessages from "@messages/en/deferred.json";
import zhCriticalMessages from "@messages/zh/critical.json";
import zhDeferredMessages from "@messages/zh/deferred.json";

type StaticMessages = Record<string, unknown>;

const STATIC_SPLIT_MESSAGES_BY_LOCALE: Record<Locale, StaticMessages> = {
  en: mergeObjects(
    enCriticalMessages as StaticMessages,
    enDeferredMessages as StaticMessages,
  ) as StaticMessages,
  zh: mergeObjects(
    zhCriticalMessages as StaticMessages,
    zhDeferredMessages as StaticMessages,
  ) as StaticMessages,
};

export function getStaticSplitMessages(locale: Locale): StaticMessages {
  return STATIC_SPLIT_MESSAGES_BY_LOCALE[locale];
}
