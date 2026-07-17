import "server-only";

import type { Locale } from "@/i18n/routing-config";
import { mergeObjects } from "@/lib/merge-objects";
import {
  CATALOG_MESSAGE_PACK_IDS,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";

import enBaseMessages from "@messages/base/en/messages.json";
import enB2bLeadMessages from "@messages/profiles/b2b-lead/en/messages.json";
import enCatalogMessages from "@messages/profiles/catalog/en/messages.json";

type StaticMessages = Record<string, unknown>;

const STATIC_PACKS: Record<Locale, Record<MessagePackId, StaticMessages>> = {
  en: {
    base: enBaseMessages,
    "b2b-lead": enB2bLeadMessages,
    catalog: enCatalogMessages,
  },
};

export function getStaticComposedMessages(locale: Locale): StaticMessages {
  return CATALOG_MESSAGE_PACK_IDS.reduce<StaticMessages>(
    (acc, packId) =>
      mergeObjects(acc, STATIC_PACKS[locale][packId]) as StaticMessages,
    {},
  );
}
