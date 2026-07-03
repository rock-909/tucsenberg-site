import type { StarterProfileId } from "@/config/starter-profiles";

// source checkout demo/runtime profile for maintainers. The
// default generated starter remains `company-site`; see docs/ref/profiles.md.
export const SOURCE_RUNTIME_MESSAGE_PROFILE_ID =
  "catalog" satisfies StarterProfileId;

export function getRuntimeMessageProfileId(): StarterProfileId {
  return SOURCE_RUNTIME_MESSAGE_PROFILE_ID;
}
