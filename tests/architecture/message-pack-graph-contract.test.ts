import fs from "node:fs";
import { describe, expect, it } from "vitest";
import type { StarterProfileId } from "@/config/starter-profiles";
import {
  PROFILE_MESSAGE_PACKS,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";
import profileMessagePacks from "@messages/message-packs.json";
import { PROFILE_PACK_PATHS } from "../../scripts/starter-profile/messages";

const PROFILE_PACK_MAP = profileMessagePacks as Record<
  StarterProfileId,
  readonly MessagePackId[]
>;

function packRootFor(packId: MessagePackId): string {
  return packId === "base" ? "messages/base" : `messages/profiles/${packId}`;
}

describe("message pack graph contract", () => {
  it("uses messages/message-packs.json as the runtime pack-order source", () => {
    expect(PROFILE_MESSAGE_PACKS).toEqual(PROFILE_PACK_MAP);
  });

  it("keeps every profile base-first with existing pack directories", () => {
    for (const [profileId, packIds] of Object.entries(PROFILE_PACK_MAP) as [
      StarterProfileId,
      readonly MessagePackId[],
    ][]) {
      expect(packIds[0], `${profileId} starts with base`).toBe("base");

      for (const packId of packIds) {
        const packRoot = packRootFor(packId);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- pack roots come from the fixed message-pack map under test
        expect(fs.existsSync(packRoot), packRoot).toBe(true);
      }
    }
  });

  it("keeps materializer pack roots derived from the same map", () => {
    for (const [profileId, packIds] of Object.entries(PROFILE_PACK_MAP) as [
      StarterProfileId,
      readonly MessagePackId[],
    ][]) {
      expect(PROFILE_PACK_PATHS[profileId]).toEqual(
        packIds.map((packId) => packRootFor(packId)),
      );
    }
  });

  it("keeps the materialized Tucsenberg profile graph scoped to en-only catalog runtime", () => {
    expect(Object.keys(PROFILE_PACK_MAP).sort()).toEqual([
      "b2b-lead",
      "catalog",
      "minimal",
    ]);
    expect(PROFILE_PACK_MAP).not.toHaveProperty("company-site");
    expect(PROFILE_PACK_MAP).not.toHaveProperty("content-marketing");
    expect(PROFILE_PACK_MAP).not.toHaveProperty("showcase-full");
  });
});
