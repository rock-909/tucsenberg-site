/**
 * Rate Limit Key Generation Strategies
 *
 * HMAC-based key generation with server-side pepper to prevent
 * offline correlation attacks. All keys use minimum 64-bit (16 hex chars)
 * truncation to balance collision resistance with storage efficiency.
 *
 * Priority hierarchy (per security spec):
 * API key > session ID > signed token > IP
 *
 * UserAgent is NOT used as primary shard (easily spoofed).
 */

import { NextRequest } from "next/server";
import { getRuntimeEnvString, isRuntimeProduction } from "@/lib/env";
import { logger } from "@/lib/logger";
import { generateHMAC } from "@/lib/security/crypto";
import { getClientIP } from "@/lib/security/client-ip";

/** Key strategy function signature */
export type KeyStrategy = (request: NextRequest) => Promise<string> | string;

/** HMAC output length (64-bit = 16 hex chars) */
const HMAC_OUTPUT_LENGTH = 16;

/** Whether pepper warning has been logged */
let hasLoggedPepperWarning = false;

/** Minimum pepper length for security (32 bytes = 64 hex chars recommended) */
const MIN_PEPPER_LENGTH = 32;

/**
 * Get HMAC pepper from environment
 *
 * SECURITY: In production, RATE_LIMIT_PEPPER is REQUIRED. Missing or weak pepper
 * will cause fail-fast to prevent insecure rate limiting that could be bypassed.
 *
 * @throws Error in production if pepper is missing or too short
 */
function getPepper(): string {
  const currentPepper = getRuntimeEnvString("RATE_LIMIT_PEPPER");
  const isProduction = isRuntimeProduction();

  if (!currentPepper) {
    if (isProduction) {
      throw new Error(
        "[SECURITY] RATE_LIMIT_PEPPER is required in production. " +
          `Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
      );
    }

    if (!hasLoggedPepperWarning) {
      logger.warn(
        "[Rate Limit] RATE_LIMIT_PEPPER not configured. Using default development pepper. " +
          "This is insecure - set RATE_LIMIT_PEPPER for production.",
      );
      hasLoggedPepperWarning = true;
    }
    return "default-dev-pepper-insecure";
  }

  // Validate pepper length
  if (currentPepper.length < MIN_PEPPER_LENGTH) {
    if (isProduction) {
      throw new Error(
        `[SECURITY] RATE_LIMIT_PEPPER is too short (${currentPepper.length} chars). ` +
          `Minimum ${MIN_PEPPER_LENGTH} chars required. ` +
          `Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
      );
    }

    if (!hasLoggedPepperWarning) {
      logger.warn(
        `[Rate Limit] RATE_LIMIT_PEPPER is weak (${currentPepper.length} chars). ` +
          `Recommend at least ${MIN_PEPPER_LENGTH} chars for production.`,
      );
      hasLoggedPepperWarning = true;
    }
  }

  return currentPepper;
}

export function extractBearerToken(authHeader: string): string | null {
  const bearerPrefixLength = "Bearer".length;
  const scheme = authHeader.slice(0, bearerPrefixLength);
  if (scheme.toLowerCase() !== "bearer") {
    return null;
  }

  const separator = authHeader[bearerPrefixLength];
  if (!separator || !/\s/.test(separator)) {
    return null;
  }

  const token = authHeader.slice(bearerPrefixLength + 1).trim();
  if (token.length === 0) {
    return null;
  }

  return token;
}

/**
 * Generate HMAC key from input using server-side pepper
 *
 * @param input - The value to hash (IP, session ID, API key, etc.)
 * @returns 16-character hex string (64-bit)
 */
export async function hmacKey(input: string): Promise<string> {
  const pepper = getPepper();
  const digest = await generateHMAC(input, pepper, "SHA-256");
  return digest.slice(0, HMAC_OUTPUT_LENGTH);
}

/**
 * Generate HMAC key with pepper rotation support
 * During rotation grace period, checks both current and previous pepper
 *
 * TODO: Not currently used. Implement pepper rotation workflow:
 * 1. Set RATE_LIMIT_PEPPER_PREVIOUS to current pepper
 * 2. Set RATE_LIMIT_PEPPER to new pepper
 * 3. Use this function to check rate limits against both keys during grace period
 * 4. After grace period (e.g., 2x window duration), remove RATE_LIMIT_PEPPER_PREVIOUS
 *
 * @param input - The value to hash
 * @returns Array of possible keys (usually 1, up to 2 during rotation)
 */
export async function hmacKeyWithRotation(input: string): Promise<string[]> {
  const keys = [await hmacKey(input)];

  const previousPepper = getRuntimeEnvString("RATE_LIMIT_PEPPER_PREVIOUS");
  if (previousPepper) {
    const previousDigest = await generateHMAC(input, previousPepper, "SHA-256");
    const previousKey = previousDigest.slice(0, HMAC_OUTPUT_LENGTH);
    keys.push(previousKey);
  }

  return keys;
}

/**
 * Strategy 1: Pure IP with HMAC (default, backward compatible)
 *
 * Uses client IP as the sole identifier. Simple and effective for
 * low-traffic APIs where NAT false positives are acceptable.
 *
 * @param request - Next.js request object
 * @returns Rate limit key in format `ip:{hmacHash}`
 */
export async function getIPKey(request: NextRequest): Promise<string> {
  const clientIP = getClientIP(request);
  return `ip:${await hmacKey(clientIP)}`;
}

/**
 * Strategy 2: Session Priority (for authenticated users)
 *
 * Uses server-issued session ID when available, falls back to IP.
 *
 * SECURITY WARNING: This strategy trusts the session-id cookie value for rate
 * limiting. If the cookie is not cryptographically signed (e.g., with iron-session
 * or similar), an attacker can bypass rate limits by changing the cookie value
 * on each request. Only use this strategy when:
 * - Session cookie is server-signed and tamper-proof, OR
 * - The protected endpoint has low abuse impact (e.g., analytics)
 *
 * For high-security endpoints, use getIPKey() or implement session signature
 * verification before rate limiting.
 *
 * @param request - Next.js request object
 * @returns Rate limit key in format `session:{hmacHash}` or `ip:{hmacHash}`
 */
export async function getSessionPriorityKey(
  request: NextRequest,
): Promise<string> {
  // Check for session cookie (should be server-issued and signed)
  const sessionCookie = request.cookies.get("session-id");
  const sessionValue = sessionCookie?.value;

  if (sessionValue && isValidSessionFormat(sessionValue)) {
    return `session:${await hmacKey(sessionValue)}`;
  }

  // Fallback to IP
  return getIPKey(request);
}

/**
 * Strategy 3: API Key Priority (for server-to-server APIs)
 *
 * Uses API key from Authorization header when available, falls back to IP.
 *
 * SECURITY WARNING: This strategy uses the raw Bearer token value BEFORE
 * authentication. If rate limiting runs before auth validation, an attacker
 * can bypass rate limits by sending random Bearer tokens on each request.
 *
 * RECOMMENDED PATTERN for high-security endpoints:
 * 1. Use getIPKey() for pre-auth rate limiting (coarse protection)
 * 2. Validate authentication
 * 3. Apply per-API-key rate limits after auth passes (fine-grained protection)
 *
 * Only use this strategy when:
 * - Rate limiting happens AFTER authentication, OR
 * - You accept the risk of pre-auth resource consumption
 *
 * @param request - Next.js request object
 * @returns Rate limit key in format `apikey:{hmacHash}` or `ip:{hmacHash}`
 */
export async function getApiKeyPriorityKey(
  request: NextRequest,
): Promise<string> {
  const authHeader = request.headers.get("Authorization");
  const apiKey = authHeader ? extractBearerToken(authHeader) : null;

  if (typeof apiKey === "string") {
    return `apikey:${await hmacKey(apiKey)}`;
  }

  // Fallback to IP
  return getIPKey(request);
}

/**
 * Validate session ID format
 *
 * Session IDs must be server-issued (typically UUID or similar format).
 * This is a basic format check - actual session validation should happen
 * in the application's auth layer before using session-based rate limiting.
 *
 * @param sessionId - Session ID string to validate
 * @returns true if format appears valid (not empty, reasonable length)
 */
function isValidSessionFormat(sessionId: string): boolean {
  // Basic sanity checks - session must be non-empty and reasonable length
  // Actual validation (signature, expiry) should happen in auth middleware
  if (!sessionId || sessionId.length < 8 || sessionId.length > 256) {
    return false;
  }

  // Reject obviously invalid values
  if (sessionId === "undefined" || sessionId === "[object Object]") {
    return false;
  }

  return true;
}

/**
 * Reset pepper warning state (for testing)
 */
export function resetPepperWarning(): void {
  hasLoggedPepperWarning = false;
}
