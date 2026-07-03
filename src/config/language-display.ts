export const LANGUAGE_OPTION_LABELS = {
  en: "English",
  zh: "简体中文",
} as const;

/** Compact header trigger labels keep the control on one line. */
export const LANGUAGE_TRIGGER_LABELS = {
  en: "EN",
  zh: "中文",
} as const;

export type SiteLanguage = keyof typeof LANGUAGE_OPTION_LABELS;
