import type { StarterProfileId } from "@/config/starter-profiles";
import type { Locale } from "@/i18n/routing";
import { mergeObjects } from "@/lib/merge-objects";
import {
  getMessagePackIdsForProfile,
  type MessagePackId,
  type MessageType,
} from "@/lib/i18n/message-pack-config";

type Messages = Record<string, unknown>;

type MessagePackLoader = () => Promise<{ default: Messages }>;

const MESSAGE_PACK_LOADERS: Record<
  Locale,
  Record<MessagePackId, Record<MessageType, MessagePackLoader>>
> = {
  en: {
    base: {
      critical: () => import("@messages/base/en/critical.json"),
      deferred: () => import("@messages/base/en/deferred.json"),
    },
    minimal: {
      critical: () => import("@messages/profiles/minimal/en/critical.json"),
      deferred: () => import("@messages/profiles/minimal/en/deferred.json"),
    },
    "b2b-lead": {
      critical: () => import("@messages/profiles/b2b-lead/en/critical.json"),
      deferred: () => import("@messages/profiles/b2b-lead/en/deferred.json"),
    },
    catalog: {
      critical: () => import("@messages/profiles/catalog/en/critical.json"),
      deferred: () => import("@messages/profiles/catalog/en/deferred.json"),
    },
  },
};

export async function loadRawMessagePack(
  locale: Locale,
  packId: MessagePackId,
  type: MessageType,
): Promise<Messages> {
  const loaded = await MESSAGE_PACK_LOADERS[locale][packId][type]();
  return loaded.default;
}

export async function loadComposedRawMessages(
  locale: Locale,
  type: MessageType,
  profileId: StarterProfileId,
): Promise<Messages> {
  const packs = await Promise.all(
    getMessagePackIdsForProfile(profileId).map((packId) =>
      loadRawMessagePack(locale, packId, type),
    ),
  );

  return packs.reduce<Messages>(
    (acc, pack) => mergeObjects(acc, pack) as Messages,
    {},
  );
}
