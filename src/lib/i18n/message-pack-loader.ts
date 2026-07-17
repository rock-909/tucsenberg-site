import type { Locale } from "@/i18n/routing-config";
import { mergeObjects } from "@/lib/merge-objects";
import {
  CATALOG_MESSAGE_PACK_IDS,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";

type Messages = Record<string, unknown>;

type MessagePackLoader = () => Promise<{ default: Messages }>;

const MESSAGE_PACK_LOADERS: Record<
  Locale,
  Record<MessagePackId, MessagePackLoader>
> = {
  en: {
    base: () => import("@messages/base/en/messages.json"),
    "b2b-lead": () => import("@messages/profiles/b2b-lead/en/messages.json"),
    catalog: () => import("@messages/profiles/catalog/en/messages.json"),
  },
};

export async function loadRawMessagePack(
  locale: Locale,
  packId: MessagePackId,
): Promise<Messages> {
  const loaded = await MESSAGE_PACK_LOADERS[locale][packId]();
  return loaded.default;
}

export async function loadComposedRawMessages(
  locale: Locale,
): Promise<Messages> {
  const packs = await Promise.all(
    CATALOG_MESSAGE_PACK_IDS.map((packId) =>
      loadRawMessagePack(locale, packId),
    ),
  );

  return packs.reduce<Messages>(
    (acc, pack) => mergeObjects(acc, pack) as Messages,
    {},
  );
}
