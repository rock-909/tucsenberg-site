import type { StarterProfileId } from "@/config/starter-profiles";

// Source checkout runtime profile for this materialized Tucsenberg site.
export const SOURCE_RUNTIME_MESSAGE_PROFILE_ID =
  "catalog" satisfies StarterProfileId;

export function getRuntimeMessageProfileId(): StarterProfileId {
  return SOURCE_RUNTIME_MESSAGE_PROFILE_ID;
}
