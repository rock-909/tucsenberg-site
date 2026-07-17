import enMessages from "@messages/en/messages.json";

type StorybookLocale = "en";
type StorybookMessages = Record<string, unknown>;

const storybookMessagesByLocale = {
  en: enMessages as StorybookMessages,
} satisfies Record<StorybookLocale, StorybookMessages>;

export function getStorybookLocale(_value: unknown): StorybookLocale {
  return "en";
}

export function getStorybookMessages(
  locale: StorybookLocale,
): StorybookMessages {
  return storybookMessagesByLocale[locale];
}
