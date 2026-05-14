import type { SiteDefinition } from "@/config/site-types";

export function defineSiteDefinition<const TDefinition extends SiteDefinition>(
  definition: TDefinition,
): TDefinition {
  return definition;
}
