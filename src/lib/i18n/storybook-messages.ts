import enCriticalMessages from "@messages/en/critical.json";
import enDeferredMessages from "@messages/en/deferred.json";
import { mergeObjects } from "@/lib/merge-objects";

type StorybookLocale = "en";
type StorybookMessages = Record<string, unknown>;

const storybookMessagesByLocale = {
  en: mergeObjects(
    enCriticalMessages as StorybookMessages,
    enDeferredMessages as Partial<StorybookMessages>,
  ),
} satisfies Record<StorybookLocale, StorybookMessages>;

export function getStorybookLocale(_value: unknown): StorybookLocale {
  return "en";
}

export function getStorybookMessages(
  locale: StorybookLocale,
): StorybookMessages {
  return storybookMessagesByLocale[locale];
}
