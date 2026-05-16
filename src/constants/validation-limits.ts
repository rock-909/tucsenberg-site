/**
 * Validation Limits and Constraints
 *
 * Centralized constants for input validation, character limits,
 * and size constraints throughout the application.
 *
 * Naming convention: MAX_[DOMAIN]_[DESCRIPTION] or MIN_[DOMAIN]_[DESCRIPTION]
 */

// ============================================================================
// Lead Pipeline Limits (contact / product inquiry / newsletter)
// ============================================================================

/**
 * Max email length (RFC 5321 / 5322 practical limit).
 * Commonly validated as 254 characters.
 */
export const MAX_LEAD_EMAIL_LENGTH = 254 as const;

/** Max company name length for lead forms. */
export const MAX_LEAD_COMPANY_LENGTH = 200 as const;

/** Max full name length for lead forms. */
export const MAX_LEAD_NAME_LENGTH = 100 as const;

/** Min subject length for contact leads. */
export const MIN_LEAD_SUBJECT_LENGTH = 5 as const;

/** Max subject length for contact leads. */
export const MAX_LEAD_SUBJECT_LENGTH = 100 as const;

/** Min message length for contact leads. */
export const MIN_LEAD_MESSAGE_LENGTH = 10 as const;

/** Max message length for contact leads. */
export const MAX_LEAD_MESSAGE_LENGTH = 5000 as const;

/** Max product name length for product inquiry leads. */
export const MAX_LEAD_PRODUCT_NAME_LENGTH = MAX_LEAD_COMPANY_LENGTH;

/** Max requirements length for product inquiry leads. */
export const MAX_LEAD_REQUIREMENTS_LENGTH = 2000 as const;

/** Max country length for RFQ quote leads. */
export const MAX_LEAD_COUNTRY_LENGTH = 100 as const;

/** Max part-number(s) / OEM model field length for RFQ quote leads. */
export const MAX_LEAD_PART_NUMBERS_LENGTH = 500 as const;

/** Max quantity field length for RFQ quote leads (free-text band). */
export const MAX_LEAD_QUANTITY_LENGTH = 100 as const;

/** Max shutdown-date / urgency field length for RFQ quote leads. */
export const MAX_LEAD_SHUTDOWN_LENGTH = 200 as const;

/**
 * Max length for an RFQ source-context field (originating brand, OEM model, or
 * product the buyer came from via a compatible-brand page). These are short
 * catalog identifiers, not free-text bands; they are validated inputs only and
 * fold into the existing `requirements` block, not new Airtable/email fields.
 */
export const MAX_LEAD_SOURCE_CONTEXT_LENGTH = 200 as const;

// ============================================================================
// Cryptography Constants
// ============================================================================

/** AES-GCM key length in bits */
export const AES_KEY_LENGTH_BITS = 256 as const;

/** PBKDF2 iteration count for key derivation */
export const PBKDF2_ITERATIONS = 100000 as const;

/** Salt byte length for password hashing */
export const SALT_BYTE_LENGTH = 16 as const;

/** IV byte length for AES-GCM */
export const AES_IV_BYTE_LENGTH = 12 as const;
