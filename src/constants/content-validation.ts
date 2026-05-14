import { CONTENT_LIMITS } from "@/constants/app-constants";

/**
 * Runtime content validation limits used by production code.
 *
 * Keep these values separate from test helpers so production logic does not
 * silently depend on test-only constants.
 */
export const CONTENT_VALIDATION_LIMITS = {
  TITLE_MAX: CONTENT_LIMITS.TITLE_MAX_LENGTH,
  DESCRIPTION_MAX: CONTENT_LIMITS.DESCRIPTION_MAX_LENGTH,
  RECOMMENDED_MAX_TAGS: 10,
} as const;
