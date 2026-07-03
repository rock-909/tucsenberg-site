import type { StarterProfileId } from "@/config/starter-profiles";

import profileMessagePacks from "@messages/message-packs.json";

export type MessageType = "critical" | "deferred";

export type MessagePackId = "base" | "minimal" | "b2b-lead" | "catalog";

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
      `Profile "${profileId}" is not available in this materialized starter. Active profile: "catalog".`,
    );
  }

  return packs;
}
