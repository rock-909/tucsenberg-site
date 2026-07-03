/**
 * Cookie Consent Module
 *
 * Re-exports all cookie consent utilities for convenient imports.
 */

export {
  CookieConsentProvider,
  useCookieConsent,
  useCookieConsentOptional,
} from "@/lib/cookie-consent/context";

export {
  clearConsent,
  createAcceptAllConsent,
  createRejectAllConsent,
  loadConsent,
  saveConsent,
} from "@/lib/cookie-consent/storage";

export {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  type CookieCategory,
  type CookieConsent,
  type CookieConsentActions,
  type CookieConsentContextValue,
  type CookieConsentState,
  type StoredConsent,
} from "@/lib/cookie-consent/types";
