/**
 * next-intl Type Augmentation
 *
 * Provides compile-time type safety for translation keys via
 * AppConfig.Messages module augmentation.
 *
 * @see https://next-intl.dev/docs/workflows/typescript
 */

import type enBaseCritical from "@messages/base/en/critical.json";
import type enBaseDeferred from "@messages/base/en/deferred.json";
import type enMinimalCritical from "@messages/profiles/minimal/en/critical.json";
import type enMinimalDeferred from "@messages/profiles/minimal/en/deferred.json";
import type enB2bLeadCritical from "@messages/profiles/b2b-lead/en/critical.json";
import type enB2bLeadDeferred from "@messages/profiles/b2b-lead/en/deferred.json";
import type enCatalogCritical from "@messages/profiles/catalog/en/critical.json";
import type enCatalogDeferred from "@messages/profiles/catalog/en/deferred.json";

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
 * Combined messages type from profile packs in pack order.
 * This type represents the complete translation structure.
 */
type Messages = DeepMerge<DeepMerge<DeepMerge<DeepMerge<DeepMerge<DeepMerge<DeepMerge<typeof enBaseCritical, typeof enBaseDeferred>, typeof enMinimalCritical>, typeof enMinimalDeferred>, typeof enB2bLeadCritical>, typeof enB2bLeadDeferred>, typeof enCatalogCritical>, typeof enCatalogDeferred>;

declare module "next-intl" {
  /**
   * Module augmentation for next-intl's AppConfig interface.
   * This enables strict type checking for all translation function calls.
   */
  interface AppConfig {
    Messages: Messages;
  }
}
