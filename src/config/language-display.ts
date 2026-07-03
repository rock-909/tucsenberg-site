import {
  LOCALES_CONFIG,
  type ConfiguredLocale,
} from "@/config/paths/locales-config";

export const LANGUAGE_OPTION_LABELS = LOCALES_CONFIG.displayNames;

/** Compact header trigger labels keep the control on one line. */
export const LANGUAGE_TRIGGER_LABELS = LOCALES_CONFIG.triggerLabels;

export type SiteLanguage = ConfiguredLocale;
