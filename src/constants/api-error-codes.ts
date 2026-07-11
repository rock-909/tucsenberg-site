/**
 * API Error Codes
 *
 * Standardized error codes for all API responses.
 * These codes are stable identifiers for machine consumption.
 * Human-readable messages are handled by client-side i18n.
 *
 * Naming convention: CATEGORY_ACTION_DETAIL
 */

// ============================================
// Common Error Codes (used across multiple APIs)
// ============================================

export const API_ERROR_CODES = {
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Server errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Request validation
  INVALID_JSON_BODY: "INVALID_JSON_BODY",
  INVALID_REQUEST: "INVALID_REQUEST",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",

  // ============================================
  // Subscribe API
  // ============================================
  SUBSCRIBE_VALIDATION_EMAIL_REQUIRED: "SUBSCRIBE_VALIDATION_EMAIL_REQUIRED",
  SUBSCRIBE_VALIDATION_EMAIL_INVALID: "SUBSCRIBE_VALIDATION_EMAIL_INVALID",
  SUBSCRIBE_PROCESSING_ERROR: "SUBSCRIBE_PROCESSING_ERROR",

  // ============================================
  // Contact API
  // ============================================
  CONTACT_VALIDATION_FAILED: "CONTACT_VALIDATION_FAILED",
  CONTACT_PROCESSING_ERROR: "CONTACT_PROCESSING_ERROR",
  CONTACT_SUBMISSION_EXPIRED: "CONTACT_SUBMISSION_EXPIRED",

  // ============================================
  // Inquiry API
  // ============================================
  INQUIRY_VALIDATION_FAILED: "INQUIRY_VALIDATION_FAILED",
  INQUIRY_PROCESSING_ERROR: "INQUIRY_PROCESSING_ERROR",

  // ============================================
  // Turnstile Verification API
  // ============================================
  TURNSTILE_REQUIRED: "TURNSTILE_REQUIRED",
  TURNSTILE_REJECTED: "TURNSTILE_REJECTED",
  TURNSTILE_UNAVAILABLE: "TURNSTILE_UNAVAILABLE",

  // ============================================
  // Generic Error (fallback)
  // ============================================
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * Client-synthesized error code for a failed contact-form network request.
 *
 * Not part of {@link API_ERROR_CODES}: the server never emits it. The browser
 * sets it when the fetch itself rejects, and the form feedback UI maps it to a
 * localized network-error message.
 */
export const FORM_NETWORK_ERROR = "FORM_NETWORK_ERROR";
