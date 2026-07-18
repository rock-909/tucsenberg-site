import { type Locale } from "@/i18n/routing-config";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";

type Messages = Record<string, unknown>;

// Namespaces every route needs on the client: skip link and mobile-nav labels
// (accessibility), cookie banner (cookie), the not-found/error views (errors),
// navigation chrome, and the theme switcher. There is no language switcher on
// the current site, so `language` is not shipped. Contact and RFQ inquiry copy
// is server-built through `inquiry.form` and passed into client islands as
// typed props, so legacy `contact`/`apiErrors` message packs stay off the
// site-wide client payload until D6e retires the old frontend stack.
const CLIENT_MESSAGE_NAMESPACES = [
  "accessibility",
  "cookie",
  "errors",
  "navigation",
  "theme",
] as const;

// Legacy contact-form namespaces retained for D6e retirement work. The active
// shared InquiryForm no longer consumes them through a route-local provider.
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
  const messages = await loadCompleteMessages(locale);
  return pickClientMessages(messages);
}
