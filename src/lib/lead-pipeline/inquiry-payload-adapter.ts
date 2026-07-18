/**
 * Temporary adapter for legacy Contact/RFQ payloads until D6b/D6e retire the
 * duplicate form stacks. Maps known legacy shapes into the canonical inquiry
 * contract without inventing buyer text or weakening catalog validation.
 */

const LEGACY_OPTIONAL_BLANK_FIELDS = [
  "phone",
  "message",
  "company",
  "buyerInterest",
  "requirements",
  "quantity",
  "catalogProductId",
] as const;

function normalizeBlankOptional(value: unknown): unknown {
  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }
  return value;
}

/**
 * Normalize a raw /api/inquiry JSON body before Zod validation.
 *
 * - Blank optional strings become `undefined`.
 * - Legacy RFQ payloads may still send `requirements`; canonical `message`
 *   wins when both are present. Requirements stays available for downstream
 *   legacy mapping until the old frontend stack is retired.
 */
export function adaptLegacyInquiryPayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const adapted: Record<string, unknown> = { ...data };

  for (const field of LEGACY_OPTIONAL_BLANK_FIELDS) {
    adapted[field] = normalizeBlankOptional(adapted[field]);
  }

  if (adapted.message === undefined && adapted.requirements !== undefined) {
    // Legacy RFQ still posts requirements; treat it as buyer text for now.
    adapted.message = adapted.requirements;
  }

  return adapted;
}
