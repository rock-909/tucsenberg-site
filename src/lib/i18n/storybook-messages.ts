import enCriticalMessages from "@messages/en/critical.json";
import enDeferredMessages from "@messages/en/deferred.json";
import zhCriticalMessages from "@messages/zh/critical.json";
import zhDeferredMessages from "@messages/zh/deferred.json";
import { mergeObjects } from "@/lib/merge-objects";

type StorybookLocale = "en" | "zh";
type StorybookMessages = Record<string, unknown>;

const storybookMessagesByLocale = {
  en: mergeObjects(
    enCriticalMessages as StorybookMessages,
    enDeferredMessages as Partial<StorybookMessages>,
  ),
  zh: mergeObjects(
    zhCriticalMessages as StorybookMessages,
    zhDeferredMessages as Partial<StorybookMessages>,
  ),
} satisfies Record<StorybookLocale, StorybookMessages>;

export function getStorybookLocale(value: unknown): StorybookLocale {
  return value === "zh" ? "zh" : "en";
}

export function getStorybookMessages(
  locale: StorybookLocale,
): StorybookMessages {
  return storybookMessagesByLocale[locale];
}
