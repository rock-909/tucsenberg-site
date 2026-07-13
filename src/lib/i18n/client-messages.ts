import { type Locale } from "@/i18n/routing-config";
import {
  loadCriticalMessages,
  loadDeferredMessages,
} from "@/lib/i18n/load-messages";
import { mergeObjects } from "@/lib/merge-objects";

type Messages = Record<string, unknown>;

// Namespaces every route needs on the client: skip link and mobile-nav labels
// (accessibility), cookie banner (cookie), the not-found/error views (errors),
// language and navigation chrome, and the theme switcher. `contact` and
// `apiErrors` are NOT here on purpose: on the client only the contact form
// consumes them, so the contact route supplies them through a local provider
// (see contact-page-sections.tsx). Keeping them out of the root provider stops
// every non-contact page from shipping the contact form copy.
const CLIENT_MESSAGE_NAMESPACES = [
  "accessibility",
  "cookie",
  "errors",
  "language",
  "navigation",
  "theme",
] as const;

// Namespaces the contact form needs on the client, provided locally on the
// contact route instead of site-wide.
export const CONTACT_CLIENT_MESSAGE_NAMESPACES = [
  "accessibility",
  "apiErrors",
  "contact",
] as const;

export function getClientMessageNamespaces(): readonly string[] {
  return CLIENT_MESSAGE_NAMESPACES;
}

export function pickMessages(
  messages: Messages,
  namespaces: readonly string[],
): Messages {
  return namespaces.reduce<Messages>((acc, namespace) => {
    const value = messages[namespace];
    if (value !== undefined) {
      acc[namespace] = value;
    }
    return acc;
  }, {});
}

export function pickClientMessages(messages: Messages): Messages {
  return pickMessages(messages, CLIENT_MESSAGE_NAMESPACES);
}

export async function loadClientMessages(locale: Locale): Promise<Messages> {
  const [critical, deferred] = await Promise.all([
    loadCriticalMessages(locale),
    loadDeferredMessages(locale),
  ]);
  const messages = mergeObjects(critical ?? {}, deferred ?? {}) as Messages;

  return pickClientMessages(messages);
}
