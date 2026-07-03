import "server-only";

import type { StarterProfileId } from "@/config/starter-profiles";
import { getRuntimeMessageProfileId } from "@/config/active-starter-profile";
import type { Locale } from "@/types/content.types";
import { mergeObjects } from "@/lib/merge-objects";
import {
  getMessagePackIdsForProfile,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";

import enBaseCritical from "@messages/base/en/critical.json";
import enBaseDeferred from "@messages/base/en/deferred.json";
import enMinimalCritical from "@messages/profiles/minimal/en/critical.json";
import enMinimalDeferred from "@messages/profiles/minimal/en/deferred.json";
import enB2bLeadCritical from "@messages/profiles/b2b-lead/en/critical.json";
import enB2bLeadDeferred from "@messages/profiles/b2b-lead/en/deferred.json";
import enCatalogCritical from "@messages/profiles/catalog/en/critical.json";
import enCatalogDeferred from "@messages/profiles/catalog/en/deferred.json";
import zhBaseCritical from "@messages/base/zh/critical.json";
import zhBaseDeferred from "@messages/base/zh/deferred.json";
import zhMinimalCritical from "@messages/profiles/minimal/zh/critical.json";
import zhMinimalDeferred from "@messages/profiles/minimal/zh/deferred.json";
import zhB2bLeadCritical from "@messages/profiles/b2b-lead/zh/critical.json";
import zhB2bLeadDeferred from "@messages/profiles/b2b-lead/zh/deferred.json";
import zhCatalogCritical from "@messages/profiles/catalog/zh/critical.json";
import zhCatalogDeferred from "@messages/profiles/catalog/zh/deferred.json";

type StaticMessages = Record<string, unknown>;
type StaticPack = { critical: StaticMessages; deferred: StaticMessages };

const STATIC_PACKS: Record<Locale, Record<MessagePackId, StaticPack>> = {
  en: {
    base: {
      critical: enBaseCritical,
      deferred: enBaseDeferred,
    },
    minimal: {
      critical: enMinimalCritical,
      deferred: enMinimalDeferred,
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
  zh: {
    base: {
      critical: zhBaseCritical,
      deferred: zhBaseDeferred,
    },
    minimal: {
      critical: zhMinimalCritical,
      deferred: zhMinimalDeferred,
    },
    "b2b-lead": {
      critical: zhB2bLeadCritical,
      deferred: zhB2bLeadDeferred,
    },
    catalog: {
      critical: zhCatalogCritical,
      deferred: zhCatalogDeferred,
    },
  },
};

function composeStaticSplitMessages(
  locale: Locale,
  profileId: StarterProfileId,
): StaticMessages {
  return getMessagePackIdsForProfile(profileId).reduce<StaticMessages>(
    (acc, packId) => {
      const pack = STATIC_PACKS[locale][packId];
      return mergeObjects(
        mergeObjects(acc, pack.critical) as StaticMessages,
        pack.deferred,
      ) as StaticMessages;
    },
    {},
  );
}

export function getStaticSplitMessages(
  locale: Locale,
  profileId: StarterProfileId = getRuntimeMessageProfileId(),
): StaticMessages {
  return composeStaticSplitMessages(locale, profileId);
}
