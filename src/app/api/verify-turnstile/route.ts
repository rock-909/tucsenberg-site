import { NextRequest, NextResponse } from "next/server";
import {
  createApiErrorResponse,
  createApiSuccessResponse,
} from "@/lib/api/api-response";
import {
  applyCorsHeaders,
  createCorsPreflightResponse,
} from "@/lib/api/cors-utils";
import { safeParseJson } from "@/lib/api/safe-parse-json";
import {
  withRateLimit,
  type RateLimitContext,
} from "@/lib/api/with-rate-limit";
import { env } from "@/lib/env";
import { logger, sanitizeIP } from "@/lib/logger";
import { verifyTurnstileDetailed } from "@/lib/security/turnstile";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
  HTTP_OK,
  HTTP_SERVICE_UNAVAILABLE,
} from "@/constants";

/**
 * Request body interface for Turnstile verification.
 *
 * SECURITY NOTE: Client IP is intentionally NOT accepted from request body.
 * The server MUST derive the client IP from trusted request headers
 * (X-Forwarded-For, X-Real-IP) to prevent IP spoofing attacks that could
 * bypass Turnstile's risk analysis.
 */
interface TurnstileVerificationRequest {
  token: string;
}

interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Validate request body
 */
function validateRequestBody(body: TurnstileVerificationRequest) {
  if (!body.token) {
    return createApiErrorResponse(
      API_ERROR_CODES.TURNSTILE_MISSING_TOKEN,
      HTTP_BAD_REQUEST,
    );
  }
  return null;
}

/**
 * Create network error response (503 Service Unavailable for upstream failures)
 */
function createNetworkErrorResponse(verifyError: Error, clientIP: string) {
  logger.error("Turnstile verification request failed", {
    error: verifyError,
    clientIP: sanitizeIP(clientIP),
  });
  return createApiErrorResponse(
    API_ERROR_CODES.TURNSTILE_NETWORK_ERROR,
    HTTP_SERVICE_UNAVAILABLE,
  );
}

/**
 * Check if Turnstile is configured
 */
function checkTurnstileConfigured(): NextResponse | null {
  if (!env.TURNSTILE_SECRET_KEY) {
    logger.error("Turnstile not configured - TURNSTILE_SECRET_KEY missing");
    return createApiErrorResponse(
      API_ERROR_CODES.TURNSTILE_NOT_CONFIGURED,
      HTTP_INTERNAL_ERROR,
    );
  }
  return null;
}

function isTurnstileNetworkError(result: TurnstileVerificationResult): boolean {
  return (
    result.errorCodes?.some(
      (code) => code === "network-error" || code === "timeout",
    ) ?? false
  );
}

function createFailedVerificationResponse(
  result: TurnstileVerificationResult,
  clientIP: string,
): NextResponse {
  if (isTurnstileNetworkError(result)) {
    logger.error("Turnstile verification network failure", {
      errorCodes: result.errorCodes,
      clientIP: sanitizeIP(clientIP),
    });
    return createApiErrorResponse(
      API_ERROR_CODES.TURNSTILE_NETWORK_ERROR,
      HTTP_SERVICE_UNAVAILABLE,
    );
  }

  return createApiErrorResponse(
    API_ERROR_CODES.TURNSTILE_VERIFICATION_FAILED,
    HTTP_BAD_REQUEST,
  );
}

async function verifyRequestToken(
  token: string,
  clientIP: string,
): Promise<NextResponse | null> {
  let verificationResult: TurnstileVerificationResult;
  try {
    verificationResult = await verifyTurnstileDetailed(token, clientIP);
  } catch (verifyError) {
    return createNetworkErrorResponse(verifyError as Error, clientIP);
  }

  if (!verificationResult.success) {
    return createFailedVerificationResponse(verificationResult, clientIP);
  }

  return null;
}

/**
 * Verify Cloudflare Turnstile token
 *
 * This endpoint verifies the Turnstile token on the server side
 * to ensure the user has passed the bot protection challenge.
 * Uses the shared verifyTurnstile function for consistency.
 */
async function handlePost(
  request: NextRequest,
  { clientIP }: RateLimitContext,
) {
  try {
    const configError = checkTurnstileConfigured();
    if (configError) return configError;

    const parsedBody = await safeParseJson<TurnstileVerificationRequest>(
      request,
      { route: "/api/verify-turnstile" },
    );
    if (!parsedBody.ok) {
      return createApiErrorResponse(
        parsedBody.errorCode,
        parsedBody.statusCode,
      );
    }

    const validationError = validateRequestBody(parsedBody.data);
    if (validationError) return validationError;

    const verificationError = await verifyRequestToken(
      parsedBody.data.token,
      clientIP,
    );
    if (verificationError) return verificationError;

    return createApiSuccessResponse({ verified: true }, HTTP_OK);
  } catch (error) {
    logger.error("Error verifying Turnstile token", { error: error as Error });
    return createApiErrorResponse(
      API_ERROR_CODES.INTERNAL_SERVER_ERROR,
      HTTP_INTERNAL_ERROR,
    );
  }
}

const POST_RATE_LIMITED = withRateLimit("turnstile", handlePost);

export async function POST(request: NextRequest) {
  const response = await POST_RATE_LIMITED(request);
  return applyCorsHeaders({ request, response });
}

/**
 * Handle GET requests (for health checks)
 */
export function GET() {
  return createApiSuccessResponse(
    {
      status: "Turnstile verification endpoint active",
      timestamp: new Date().toISOString(),
    },
    HTTP_OK,
  );
}

/**
 * Only allow POST and GET methods
 */
export function OPTIONS(request: NextRequest) {
  // CORS helper already includes the baseline POST/OPTIONS methods.
  return createCorsPreflightResponse(request, ["GET"]);
}
