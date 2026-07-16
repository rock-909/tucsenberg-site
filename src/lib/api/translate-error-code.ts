/**
 * API Error Code Translation Utility
 *
 * Provides utilities to translate API error codes into localized messages.
 * Used on the client side with next-intl's useTranslations hook.
 */

import {
  API_ERROR_CODES,
  type ApiErrorCode,
} from "@/constants/api-error-codes";

/**
 * Check if a string is a valid API error code
 */
function isValidErrorCode(code: unknown): code is ApiErrorCode {
  if (typeof code !== "string") return false;
  return Object.values(API_ERROR_CODES).includes(code as ApiErrorCode);
}

/**
 * Get the translation key for an error code
 *
 * @param errorCode - The API error code from response
 * @returns The translation key for use with useTranslations
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useTranslations } from 'next-intl';
 * import { getErrorTranslationKey } from '@/lib/api/translate-error-code';
 *
 * function ErrorMessage({ errorCode }: { errorCode: string }) {
 *   const t = useTranslations('apiErrors');
 *   const key = getErrorTranslationKey(errorCode);
 *   return <p>{t(key)}</p>;
 * }
 * ```
 */
function getErrorTranslationKey(
  errorCode: string | undefined | null,
): ApiErrorCode {
  if (!errorCode || !isValidErrorCode(errorCode)) {
    return API_ERROR_CODES.UNKNOWN_ERROR;
  }
  return errorCode;
}

/**
 * Type-safe helper to get translated API error message
 *
 * @param t - Translation function from useTranslations('apiErrors')
 * @param errorCode - The API error code from response
 * @returns The translated error message
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useTranslations } from 'next-intl';
 * import { translateApiError } from '@/lib/api/translate-error-code';
 *
 * function MyComponent() {
 *   const t = useTranslations('apiErrors');
 *
 *   async function handleSubmit() {
 *     const response = await fetch('/api/subscribe', { method: 'POST', body: ... });
 *     const data = await response.json();
 *
 *     if (!data.success) {
 *       const message = translateApiError(t, data.errorCode);
 *       toast.error(message);
 *     }
 *   }
 * }
 * ```
 */
export function translateApiError(
  t: (key: string) => string,
  errorCode: string | undefined | null,
): string {
  const key = getErrorTranslationKey(errorCode);
  return t(key);
}
