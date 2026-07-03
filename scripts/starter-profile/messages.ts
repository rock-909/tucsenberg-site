import fs from "node:fs";
import path from "node:path";
import {
  getStarterProfile,
  type StarterMessageNamespace,
  type StarterProfileId,
} from "../../src/config/starter-profiles";
import { LOCALES_CONFIG } from "../../src/config/paths/locales-config";
import { mergeObjects } from "../../src/lib/merge-objects";
import type { MessagePackId } from "../../src/lib/i18n/message-pack-config";
import profileMessagePacks from "../../messages/message-packs.json";
import type { MaterializedMessageSet } from "./types";

const MESSAGE_LOCALES = LOCALES_CONFIG.locales;
const MESSAGE_TYPES = ["critical", "deferred"] as const;
const MESSAGE_LOCALE_PATTERN = MESSAGE_LOCALES.map((locale) =>
  locale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");
const COMPAT_MESSAGE_PATH_PATTERN = new RegExp(
  `^messages\\/(${MESSAGE_LOCALE_PATTERN})\\/(critical|deferred)\\.json$`,
);

function getMessagePackRoot(packId: MessagePackId): string {
  return packId === "base" ? "messages/base" : `messages/profiles/${packId}`;
}

export const PROFILE_PACK_PATHS = Object.fromEntries(
  Object.entries(
    profileMessagePacks as Record<StarterProfileId, readonly MessagePackId[]>,
  ).map(([profileId, packIds]) => [
    profileId,
    packIds.map((packId) => getMessagePackRoot(packId)),
  ]),
) as Record<StarterProfileId, readonly string[]>;

const ALL_MESSAGE_PACK_ROOTS = [
  ...new Set(
    Object.values(PROFILE_PACK_PATHS).flatMap((packRoots) => [...packRoots]),
  ),
  "messages/examples/ui-demo",
] as const;

export function getIncludedMessagePackRoots(
  profileId: StarterProfileId,
): readonly string[] {
  return PROFILE_PACK_PATHS[profileId];
}

export function getExcludedMessagePackRoots(
  profileId: StarterProfileId,
): readonly string[] {
  const included = new Set(PROFILE_PACK_PATHS[profileId]);
  return ALL_MESSAGE_PACK_ROOTS.filter((root) => !included.has(root));
}

export function composeMessagesForProfileFromFiles(options: {
  repoRoot: string;
  profileId: StarterProfileId;
  relativePath: string;
}): Record<string, unknown> {
  const { repoRoot, profileId, relativePath } = options;
  const match = relativePath.match(COMPAT_MESSAGE_PATH_PATTERN);

  if (!match) {
    throw new Error(`Unsupported compatibility message path: ${relativePath}`);
  }

  const locale = match[1];
  const messageType = match[2];

  return PROFILE_PACK_PATHS[profileId].reduce<Record<string, unknown>>(
    (acc, packRoot) => {
      const packPath = path.join(
        repoRoot,
        packRoot,
        locale,
        `${messageType}.json`,
      );
      const packMessages = JSON.parse(
        fs.readFileSync(packPath, "utf8"),
      ) as Record<string, unknown>;
      return mergeObjects(acc, packMessages);
    },
    {},
  );
}

export function pruneMessagesForProfile(
  profileId: StarterProfileId,
  messages: Record<string, unknown>,
): Record<string, unknown> {
  const allowedNamespaces = new Set(
    getStarterProfile(profileId).messageNamespaces,
  );
  const pruned: Record<string, unknown> = {};

  for (const [namespace, value] of Object.entries(messages)) {
    if (allowedNamespaces.has(namespace as StarterMessageNamespace)) {
      pruned[namespace] = value;
    }
  }

  return pruned;
}

export function buildMaterializedMessageSet(
  profileId: StarterProfileId,
): MaterializedMessageSet {
  const profile = getStarterProfile(profileId);
  const allNamespaces = getStarterProfile("showcase-full").messageNamespaces;

  return {
    profileId,
    locales: MESSAGE_LOCALES,
    includedNamespaces: profile.messageNamespaces,
    excludedNamespaces: allNamespaces.filter(
      (namespace) => !profile.messageNamespaces.includes(namespace),
    ),
  };
}

export function materializedMessageRelativePaths(
  profileId: StarterProfileId,
): readonly string[] {
  const paths: string[] = [];

  for (const packRoot of PROFILE_PACK_PATHS[profileId]) {
    for (const locale of MESSAGE_LOCALES) {
      for (const messageType of MESSAGE_TYPES) {
        paths.push(`${packRoot}/${locale}/${messageType}.json`);
      }
    }
  }

  for (const locale of MESSAGE_LOCALES) {
    for (const messageType of MESSAGE_TYPES) {
      paths.push(`messages/${locale}/${messageType}.json`);
    }
  }

  return paths;
}

export function materializedCompatMessageRelativePaths(): readonly string[] {
  const paths: string[] = [];

  for (const locale of MESSAGE_LOCALES) {
    for (const messageType of MESSAGE_TYPES) {
      paths.push(`messages/${locale}/${messageType}.json`);
    }
  }

  return paths;
}
