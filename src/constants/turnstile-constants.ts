/**
 * Turnstile widget layout constants.
 * Based on Cloudflare's documented widget sizes.
 */
export const TURNSTILE_WIDGET_HEIGHT_PX = {
  normal: 65,
  compact: 140,
} as const;

/** Single runtime action for all inquiry-family Turnstile widgets and verification. */
export const INQUIRY_TURNSTILE_ACTION = "product_inquiry";
