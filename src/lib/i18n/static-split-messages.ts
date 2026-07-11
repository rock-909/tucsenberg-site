import "server-only";

import type { Locale } from "@/i18n/routing-config";
import { mergeObjects } from "@/lib/merge-objects";
import {
  CATALOG_MESSAGE_PACK_IDS,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";

import enBaseCritical from "@messages/base/en/critical.json";
import enBaseDeferred from "@messages/base/en/deferred.json";
import enB2bLeadCritical from "@messages/profiles/b2b-lead/en/critical.json";
import enB2bLeadDeferred from "@messages/profiles/b2b-lead/en/deferred.json";
import enCatalogCritical from "@messages/profiles/catalog/en/critical.json";
import enCatalogDeferred from "@messages/profiles/catalog/en/deferred.json";

type StaticMessages = Record<string, unknown>;
type StaticPack = { critical: StaticMessages; deferred: StaticMessages };

const STATIC_PACKS: Record<Locale, Record<MessagePackId, StaticPack>> = {
  en: {
    base: {
      critical: enBaseCritical,
      deferred: enBaseDeferred,
    },
    "b2b-lead": {
      critical: enB2bLeadCritical,
      deferred: enB2bLeadDeferred,
    },
    catalog: {
      critical: enCatalogCritical,
      deferred: enCatalogDeferred,
    },
  },
};

function composeStaticSplitMessages(locale: Locale): StaticMessages {
  return CATALOG_MESSAGE_PACK_IDS.reduce<StaticMessages>((acc, packId) => {
    const pack = STATIC_PACKS[locale][packId];
    return mergeObjects(
      mergeObjects(acc, pack.critical) as StaticMessages,
      pack.deferred,
    ) as StaticMessages;
  }, {});
}

export function getStaticSplitMessages(locale: Locale): StaticMessages {
  return composeStaticSplitMessages(locale);
}
