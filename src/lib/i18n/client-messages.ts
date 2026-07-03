import type { StarterProfileId } from "@/config/starter-profiles";
import { type Locale } from "@/i18n/routing";
import {
  loadCriticalMessages,
  loadCriticalMessagesForProfile,
  loadDeferredMessages,
  loadDeferredMessagesForProfile,
} from "@/lib/i18n/load-messages";
import { mergeObjects } from "@/lib/merge-objects";

type Messages = Record<string, unknown>;

const CLIENT_MESSAGE_NAMESPACES = [
  "accessibility",
  "apiErrors",
  "contact",
  "cookie",
  "errors",
  "language",
  "navigation",
  "theme",
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

export async function loadClientMessagesForProfile(
  locale: Locale,
  profileId: StarterProfileId,
): Promise<Messages> {
  const [critical, deferred] = await Promise.all([
    loadCriticalMessagesForProfile(locale, profileId),
    loadDeferredMessagesForProfile(locale, profileId),
  ]);
  const messages = mergeObjects(critical ?? {}, deferred ?? {}) as Messages;

  return pickClientMessages(messages);
}

export async function loadClientMessages(locale: Locale): Promise<Messages> {
  const [critical, deferred] = await Promise.all([
    loadCriticalMessages(locale),
    loadDeferredMessages(locale),
  ]);
  const messages = mergeObjects(critical ?? {}, deferred ?? {}) as Messages;

  return pickClientMessages(messages);
}
