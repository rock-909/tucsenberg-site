/**
 * next-intl Type Augmentation
 *
 * Provides compile-time type safety for translation keys via
 * AppConfig.Messages module augmentation.
 *
 * Pack ownership is mutually exclusive at every leaf path
 * (`content:check` fail-fasts on cross-pack leaf conflicts). With that
 * invariant, intersecting the three pack types matches the runtime
 * `base -> b2b-lead -> catalog` composition without silent overrides.
 *
 * @see https://next-intl.dev/docs/workflows/typescript
 */

import type enBaseMessages from "@messages/base/en/messages.json";
import type enB2bLeadMessages from "@messages/profiles/b2b-lead/en/messages.json";
import type enCatalogMessages from "@messages/profiles/catalog/en/messages.json";

type Messages = typeof enBaseMessages &
  typeof enB2bLeadMessages &
  typeof enCatalogMessages;

declare module "next-intl" {
  /**
   * Module augmentation for next-intl's AppConfig interface.
   * This enables strict type checking for all translation function calls.
   */
  interface AppConfig {
    Messages: Messages;
  }
}
