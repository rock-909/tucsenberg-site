/**
 * next-intl Type Augmentation
 *
 * Provides compile-time type safety for translation keys via
 * AppConfig.Messages module augmentation.
 *
 * @see https://next-intl.dev/docs/workflows/typescript
 */

import type enCritical from "@messages/en/critical.json";
import type enDeferred from "@messages/en/deferred.json";

/**
 * Deep merge two types, giving priority to values from B when conflicts occur.
 * Used to combine critical and deferred messages into a single type.
 */
type DeepMerge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? A[K] extends object
        ? B[K] extends object
          ? DeepMerge<A[K], B[K]>
          : B[K]
        : B[K]
      : B[K]
    : K extends keyof A
      ? A[K]
      : never;
};

/**
 * Combined messages type from generated catalog compatibility files.
 * This type represents the complete translation structure.
 */
type Messages = DeepMerge<typeof enCritical, typeof enDeferred>;

declare module "next-intl" {
  /**
   * Module augmentation for next-intl's AppConfig interface.
   * This enables strict type checking for all translation function calls.
   */
  interface AppConfig {
    Messages: Messages;
  }
}
