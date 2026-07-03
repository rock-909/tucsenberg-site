import type { StarterProfileId } from "../../src/config/starter-profiles";
import {
  PROFILE_MESSAGE_PACKS,
  type MessagePackId,
} from "../../src/lib/i18n/message-pack-config";

const LOCALES = ["en"] as const;
const MESSAGE_TYPES = ["critical", "deferred"] as const;

function packIdToImportStem(packId: MessagePackId): string {
  return packId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function packImportPrefix(packId: MessagePackId): string {
  return packId === "base" ? "@messages/base" : `@messages/profiles/${packId}`;
}

function importBinding(
  locale: (typeof LOCALES)[number],
  packId: MessagePackId,
  type: (typeof MESSAGE_TYPES)[number],
): string {
  const typeSuffix = type === "critical" ? "Critical" : "Deferred";
  return `${locale}${packIdToImportStem(packId)}${typeSuffix}`;
}

function getProfilesForIncludedPacks(
  packIds: readonly MessagePackId[],
): Partial<Record<StarterProfileId, readonly MessagePackId[]>> {
  const included = new Set(packIds);
  const profiles: Partial<Record<StarterProfileId, readonly MessagePackId[]>> =
    {};

  for (const [profileId, profilePackIds] of Object.entries(
    PROFILE_MESSAGE_PACKS,
  ) as [StarterProfileId, readonly MessagePackId[]][]) {
    if (profilePackIds.every((packId) => included.has(packId))) {
      profiles[profileId] = profilePackIds;
    }
  }

  return profiles;
}

function generateMessagePackConfigSource(
  materializedProfileId: StarterProfileId,
  packIds: readonly MessagePackId[],
): string {
  return `import type { StarterProfileId } from "@/config/starter-profiles";

import profileMessagePacks from "@messages/message-packs.json";

export type MessageType = "critical" | "deferred";

export type MessagePackId = ${packIds.map((packId) => `"${packId}"`).join(" | ")};

export const PROFILE_MESSAGE_PACKS = profileMessagePacks as Partial<
  Record<StarterProfileId, readonly MessagePackId[]>
> satisfies Partial<Record<StarterProfileId, readonly MessagePackId[]>>;

export function getMessagePackIdsForProfile(
  profileId: StarterProfileId,
): readonly MessagePackId[] {
  const packs = (
    PROFILE_MESSAGE_PACKS as Partial<
      Record<StarterProfileId, readonly MessagePackId[]>
    >
  )[profileId];
  if (!packs) {
    throw new Error(
      \`Profile "\${profileId}" is not available in this materialized starter. Active profile: "${materializedProfileId}".\`,
    );
  }

  return packs;
}
`;
}

function generateMessagePackMapJsonSource(
  packIds: readonly MessagePackId[],
): string {
  return `${JSON.stringify(getProfilesForIncludedPacks(packIds), null, 2)}\n`;
}

function generateMessagePackLoaderSource(
  packIds: readonly MessagePackId[],
): string {
  const localeBlocks = LOCALES.map((locale) => {
    const packBlocks = packIds
      .map((packId) => {
        const typeBlocks = MESSAGE_TYPES.map(
          (type) =>
            `      ${type}: () => import("${packImportPrefix(packId)}/${locale}/${type}.json"),`,
        ).join("\n");

        const key = packId.includes("-") ? `"${packId}"` : packId;
        return `    ${key}: {\n${typeBlocks}\n    },`;
      })
      .join("\n");

    return `  ${locale}: {\n${packBlocks}\n  },`;
  }).join("\n");

  return `import type { StarterProfileId } from "@/config/starter-profiles";
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
${localeBlocks}
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
`;
}

function generateStaticSplitMessagesSource(
  packIds: readonly MessagePackId[],
): string {
  const importLines = LOCALES.flatMap((locale) =>
    packIds.flatMap((packId) =>
      MESSAGE_TYPES.map(
        (type) =>
          `import ${importBinding(locale, packId, type)} from "${packImportPrefix(packId)}/${locale}/${type}.json";`,
      ),
    ),
  ).join("\n");

  const localeBlocks = LOCALES.map((locale) => {
    const packBlocks = packIds
      .map((packId) => {
        const key = packId.includes("-") ? `"${packId}"` : packId;
        return `    ${key}: {
      critical: ${importBinding(locale, packId, "critical")},
      deferred: ${importBinding(locale, packId, "deferred")},
    },`;
      })
      .join("\n");

    return `  ${locale}: {\n${packBlocks}\n  },`;
  }).join("\n");

  return `import "server-only";

import type { StarterProfileId } from "@/config/starter-profiles";
import { getRuntimeMessageProfileId } from "@/config/active-starter-profile";
import type { Locale } from "@/types/content.types";
import { mergeObjects } from "@/lib/merge-objects";
import {
  getMessagePackIdsForProfile,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";

${importLines}

type StaticMessages = Record<string, unknown>;
type StaticPack = { critical: StaticMessages; deferred: StaticMessages };

const STATIC_PACKS: Record<Locale, Record<MessagePackId, StaticPack>> = {
${localeBlocks}
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
`;
}

function buildDeepMergeType(types: readonly string[]): string {
  if (types.length === 0) {
    return "Record<string, never>";
  }

  if (types.length === 1) {
    return `typeof ${types[0]}`;
  }

  let result = `DeepMerge<typeof ${types[0]}, typeof ${types[1]}>`;
  for (let index = 2; index < types.length; index += 1) {
    result = `DeepMerge<${result}, typeof ${types[index]}>`;
  }

  return result;
}

function generateNextIntlTypesSource(
  packIds: readonly MessagePackId[],
): string {
  const importLines = packIds
    .flatMap((packId) =>
      MESSAGE_TYPES.map(
        (type) =>
          `import type ${importBinding("en", packId, type)} from "${packImportPrefix(packId)}/en/${type}.json";`,
      ),
    )
    .join("\n");

  const mergeTypes = packIds.flatMap((packId) =>
    MESSAGE_TYPES.map((type) => importBinding("en", packId, type)),
  );

  const messagesType = buildDeepMergeType(mergeTypes);

  return `/**
 * next-intl Type Augmentation
 *
 * Provides compile-time type safety for translation keys via
 * AppConfig.Messages module augmentation.
 *
 * @see https://next-intl.dev/docs/workflows/typescript
 */

${importLines}

/**
 * Deep merge two types, giving priority to values from B when conflicts occur.
 * Used to combine critical and deferred messages into a single type.
 */
type DeepMerge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? A[K] extends object
        ? B[K] extends object
          ? DeepMerge<A[K], B[K]>
          : B[K]
        : B[K]
      : B[K]
    : K extends keyof A
      ? A[K]
      : never;
};

/**
 * Combined messages type from profile packs in pack order.
 * This type represents the complete translation structure.
 */
type Messages = ${messagesType};

declare module "next-intl" {
  /**
   * Module augmentation for next-intl's AppConfig interface.
   * This enables strict type checking for all translation function calls.
   */
  interface AppConfig {
    Messages: Messages;
  }
}
`;
}

export function rewriteMessagePackSourcesForProfile(
  profileId: StarterProfileId,
  packIds: readonly MessagePackId[],
  relativePath: string,
  content: string,
): string {
  switch (relativePath.replaceAll("\\", "/")) {
    case "src/lib/i18n/message-pack-config.ts":
      return generateMessagePackConfigSource(profileId, packIds);
    case "messages/message-packs.json":
      return generateMessagePackMapJsonSource(packIds);
    case "src/lib/i18n/message-pack-loader.ts":
      return generateMessagePackLoaderSource(packIds);
    case "src/lib/i18n/static-split-messages.ts":
      return generateStaticSplitMessagesSource(packIds);
    case "src/types/next-intl.d.ts":
      return generateNextIntlTypesSource(packIds);
    default:
      return content;
  }
}
