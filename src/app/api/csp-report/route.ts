import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { API_ERROR_CODES } from "@/constants/api-error-codes";
import { createApiErrorResponse } from "@/lib/api/api-response";
import { createCorsPreflightResponse } from "@/lib/api/cors-utils";
import { logger, sanitizeIP, sanitizeLogContext } from "@/lib/logger";
import {
  withRateLimit,
  type RateLimitContext,
} from "@/lib/api/with-rate-limit";
import { safeParseJson } from "@/lib/api/safe-parse-json";
import type { CSPReport } from "@/config/security";
import {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
  HTTP_UNSUPPORTED_MEDIA_TYPE,
} from "@/constants";

const MAX_CSP_REPORT_BODY_BYTES = 16 * 1024; // 16 KB — CSP reports should be tiny; prevents body-based DoS
const MAX_SCRIPT_SAMPLE_LENGTH = 200;
const MAX_CSP_LOG_FIELD_LENGTH = 200;
const MAX_CSP_POLICY_LOG_LENGTH = 500;
const MAX_CSP_URL_LOG_LENGTH = 500;

/** Zod schema for CSP report validation (all fields optional per browser behavior) */
const cspReportInnerSchema = z.object({
  "document-uri": z.string().optional(),
  referrer: z.string().optional(),
  "violated-directive": z.string().optional(),
  "effective-directive": z.string().optional(),
  "original-policy": z.string().optional(),
  disposition: z.string().optional(),
  "blocked-uri": z.string().optional(),
  "line-number": z.number().optional(),
  "column-number": z.number().optional(),
  "source-file": z.string().optional(),
  "status-code": z.number().optional(),
  "script-sample": z.string().optional(),
});

const cspReportSchema = z.object({
  "csp-report": cspReportInnerSchema,
});

/**
 * CSP Report endpoint
 *
 * This endpoint receives Content Security Policy violation reports
 * and logs them for security monitoring and debugging.
 */
const isDevIgnored = () =>
  env.NODE_ENV === "development" && !env.CSP_REPORT_URI;
const isContentTypeValid = (ct: string | null) =>
  Boolean(
    ct &&
    (ct.includes("application/csp-report") || ct.includes("application/json")),
  );

function sanitizeLoggedText(
  value: string | null | undefined,
  maxLength = MAX_CSP_LOG_FIELD_LENGTH,
): string | null | undefined {
  if (!value) return value;
  return value.replace(/[\r\n\t\u2028\u2029]/gu, " ").slice(0, maxLength);
}

function sanitizeLoggedUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const normalized =
      url.protocol === "http:" || url.protocol === "https:"
        ? `${url.origin}${url.pathname}`
        : `${url.protocol}${url.pathname}`;
    return sanitizeLoggedText(normalized, MAX_CSP_URL_LOG_LENGTH) ?? undefined;
  } catch {
    return (
      sanitizeLoggedText(value.split(/[?#]/u, 1)[0], MAX_CSP_URL_LOG_LENGTH) ??
      undefined
    );
  }
}

function sanitizeScriptSample(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return sanitizeLoggedText(value, MAX_SCRIPT_SAMPLE_LENGTH) ?? undefined;
}

const buildViolationData = (
  request: NextRequest,
  cspReport: CSPReport["csp-report"],
  clientIP: string,
) => ({
  timestamp: new Date().toISOString(),
  documentUri: sanitizeLoggedUrl(cspReport["document-uri"]),
  referrer: sanitizeLoggedUrl(cspReport.referrer),
  violatedDirective: sanitizeLoggedText(cspReport["violated-directive"]),
  effectiveDirective: sanitizeLoggedText(cspReport["effective-directive"]),
  originalPolicy: sanitizeLoggedText(
    cspReport["original-policy"],
    MAX_CSP_POLICY_LOG_LENGTH,
  ),
  blockedUri: sanitizeLoggedUrl(cspReport["blocked-uri"]),
  lineNumber: cspReport["line-number"],
  columnNumber: cspReport["column-number"],
  sourceFile: sanitizeLoggedUrl(cspReport["source-file"]),
  statusCode: cspReport["status-code"],
  scriptSample: sanitizeScriptSample(cspReport["script-sample"]),
  disposition: sanitizeLoggedText(cspReport.disposition),
  userAgent: sanitizeLoggedText(request.headers.get("user-agent")),
  ip: clientIP,
});
const isSuspiciousReport = (csp: CSPReport["csp-report"]) => {
  const patterns = [
    "eval",
    "data:text/html",
    "vbscript:",
    "onload",
    "onerror",
    "onclick",
  ];
  const blocked = csp["blocked-uri"]?.toLowerCase() || "";
  const sample = csp["script-sample"]?.toLowerCase() || "";
  return patterns.some((p) => blocked.includes(p) || sample.includes(p));
};

async function parseAndValidateCSPReport(
  request: NextRequest,
): Promise<CSPReport | NextResponse> {
  const parsedBody = await safeParseJson<unknown>(request, {
    route: "/api/csp-report",
    maxBytes: MAX_CSP_REPORT_BODY_BYTES,
    emptyBodyErrorCode: API_ERROR_CODES.INVALID_REQUEST,
  });
  if (!parsedBody.ok) {
    return createApiErrorResponse(parsedBody.errorCode, parsedBody.statusCode);
  }

  const result = cspReportSchema.safeParse(parsedBody.data);
  if (!result.success) {
    return createApiErrorResponse(
      API_ERROR_CODES.INVALID_REQUEST,
      HTTP_BAD_REQUEST,
    );
  }

  // Check for empty csp-report (browser quirk) — acknowledge with 204 No Content
  if (Object.keys(result.data["csp-report"]).length === 0) {
    logger.warn(
      "Empty CSP report received (browser quirk or misconfiguration)",
    );
    return new NextResponse(null, { status: 204 });
  }

  return result.data as CSPReport;
}

function logCSPViolation(
  request: NextRequest,
  cspReport: CSPReport["csp-report"],
  clientIP: string,
): void {
  const violationData = buildViolationData(request, cspReport, clientIP);
  logger.warn(
    "CSP Violation Report",
    sanitizeLogContext({
      ...violationData,
      // normalize before sanitization to avoid leaking multi-hop proxy chains
      ip: sanitizeIP(String(violationData.ip ?? "unknown")),
    }),
  );

  if (env.NODE_ENV === "production") {
    logger.error(
      "Production CSP Violation",
      sanitizeLogContext({
        ...violationData,
        ip: sanitizeIP(String(violationData.ip ?? "unknown")),
      }),
    );
  }

  if (isSuspiciousReport(cspReport)) {
    logger.error(
      "SUSPICIOUS CSP VIOLATION DETECTED",
      sanitizeLogContext({
        ...violationData,
        ip: sanitizeIP(String(violationData.ip ?? "unknown")),
      }),
    );
  }
}

async function processReport(
  request: NextRequest,
  clientIP: string,
): Promise<NextResponse> {
  const contentType = request.headers.get("content-type");
  if (!isContentTypeValid(contentType)) {
    return createApiErrorResponse(
      API_ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      HTTP_UNSUPPORTED_MEDIA_TYPE,
    );
  }

  const report = await parseAndValidateCSPReport(request);
  if (report instanceof NextResponse) {
    return report;
  }

  const cspReport = report["csp-report"];
  logCSPViolation(request, cspReport, clientIP);

  const violationData = buildViolationData(request, cspReport, clientIP);
  return NextResponse.json(
    { status: "received", timestamp: violationData.timestamp },
    { status: 200 },
  );
}

const POST_RATE_LIMITED = withRateLimit(
  "csp",
  async (request: NextRequest, { clientIP }: RateLimitContext) => {
    try {
      return await processReport(request, clientIP);
    } catch (error) {
      logger.error("Error processing CSP report:", error as unknown);
      return createApiErrorResponse(
        API_ERROR_CODES.INTERNAL_SERVER_ERROR,
        HTTP_INTERNAL_ERROR,
      );
    }
  },
);

export function POST(request: NextRequest) {
  if (isDevIgnored()) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  return POST_RATE_LIMITED(request);
}

/**
 * Handle GET requests (for health checks)
 */
export function GET() {
  return NextResponse.json(
    {
      status: "CSP report endpoint active",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

/**
 * Only allow POST and GET methods
 */
export function OPTIONS(request: NextRequest) {
  const response = createCorsPreflightResponse(request, ["GET"]);
  response.headers.set("Allow", "POST, GET, OPTIONS");
  return response;
}
