/**
 * next-intl Type Augmentation
 *
 * Provides compile-time type safety for translation keys via
 * AppConfig.Messages module augmentation.
 *
 * @see https://next-intl.dev/docs/workflows/typescript
 */

import type enMessages from "@messages/en/messages.json";

type Messages = typeof enMessages;

declare module "next-intl" {
  /**
   * Module augmentation for next-intl's AppConfig interface.
   * This enables strict type checking for all translation function calls.
   */
  interface AppConfig {
    Messages: Messages;
  }
}
