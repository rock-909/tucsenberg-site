import {
  getRuntimeEnvBoolean,
  getRuntimeEnvString,
  isRuntimeDevelopment,
  isRuntimeProduction,
  isRuntimeTest,
} from "../lib/env";

export type SecurityHeader = {
  key: string;
  value: string;
};

/**
 * Security configuration for the application
 * Includes CSP, security headers, and other security-related settings
 */

/**
 * Content Security Policy configuration
 *
 * Boundary: NEXT_PUBLIC_SECURITY_MODE=strict means enforced security headers
 * with a static-compatible CSP. It is not nonce-level strict CSP. A
 * nonce-level policy needs dynamic rendering and a proxy-generated nonce, which
 * is intentionally outside the starter default.
 */
export function generateCSP(): string {
  const isDevelopment = isRuntimeDevelopment();
  const isProduction = isRuntimeProduction();
  const configuredReportUri = getRuntimeEnvString("CSP_REPORT_URI")?.trim();
  const reportUri =
    configuredReportUri && configuredReportUri.length > 0
      ? configuredReportUri
      : "/api/csp-report";

  // Base CSP directives
  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      ...(isDevelopment
        ? ["'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"]
        : []),
      // Cloudflare Turnstile
      "https://challenges.cloudflare.com",
      // Google Analytics (if enabled)
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ],
    // Static App Router/RSC emits inline bootstrap script elements. A strict
    // no-inline script-element policy needs nonce/proxy dynamic rendering, which
    // is intentionally not part of this starter default.
    "script-src-elem": [
      "'self'",
      ...(isDevelopment
        ? ["'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"]
        : ["'unsafe-inline'"]),
      "https://challenges.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ],
    "script-src-attr": ["'none'"],
    "style-src": [
      "'self'",
      // Static CSP intentionally keeps inline style allowances for framework
      // and runtime style attributes until a dedicated dynamic nonce plan exists.
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
    // Static CSP intentionally keeps inline style element allowances for
    // framework/runtime style tags that cannot be reliably statically hashed.
    "style-src-elem": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
    // Static CSP intentionally keeps style attributes allowed for framework and
    // runtime-rendered style attributes used by server/client components.
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      // Google Analytics
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
    ],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      // API endpoints
      ...(isDevelopment ? ["http://localhost:*", "ws://localhost:*"] : []),
      // Google Analytics
      "https://www.google-analytics.com",
      "https://analytics.google.com",
      "https://region1.google-analytics.com",
    ],
    "frame-src": [
      // Cloudflare Turnstile (removed 'none' - conflicts with allowlist)
      "https://challenges.cloudflare.com",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "report-uri": [reportUri],
    "upgrade-insecure-requests": isProduction ? [] : undefined,
  };

  // Convert directives to CSP string
  return Object.entries(cspDirectives)
    .flatMap(([key, value]) => {
      if (value === undefined) {
        return [];
      }

      if (Array.isArray(value) && value.length > 0) {
        return [`${key} ${value.join(" ")}`];
      }

      return [key];
    })
    .join("; ");
}

/**
 * Security headers configuration
 */
function isSecurityHeadersEnabled(testMode = false): boolean {
  if (testMode) {
    return getRuntimeEnvBoolean("SECURITY_HEADERS_ENABLED") !== false;
  }

  if (isRuntimeTest()) {
    return getRuntimeEnvBoolean("SECURITY_HEADERS_ENABLED") !== false;
  }

  return getRuntimeEnvBoolean("SECURITY_HEADERS_ENABLED") !== false;
}

export function getSecurityHeaders(testMode = false): SecurityHeader[] {
  if (!isSecurityHeadersEnabled(testMode)) {
    return [];
  }

  const securityConfig = getSecurityConfig(testMode);
  const cspHeaderKey = securityConfig.cspReportOnly
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";

  return [
    // Prevent clickjacking
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    // Prevent MIME type sniffing
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    // Referrer policy
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    // HSTS (HTTP Strict Transport Security)
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    // Content Security Policy (enforced or report-only based on security mode)
    {
      key: cspHeaderKey,
      value: generateCSP(),
    },
    // Permissions Policy (formerly Feature Policy)
    {
      key: "Permissions-Policy",
      value: [
        "camera=()",
        "microphone=()",
        "geolocation=()",
        "interest-cohort=()",
        "payment=()",
        "usb=()",
      ].join(", "),
    },
    // Cross-Origin policies
    {
      key: "Cross-Origin-Embedder-Policy",
      value: "unsafe-none", // Changed from require-corp for compatibility
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin",
    },
    {
      key: "Cross-Origin-Resource-Policy",
      value: "cross-origin",
    },
  ];
}

/**
 * Security mode configuration
 *
 * `strict` is kept as the public env value for compatibility. In this starter,
 * it means "enforce the static-compatible CSP header" rather than "nonce-level
 * strict CSP".
 */
export const SECURITY_MODES = {
  strict: {
    cspReportOnly: false,
    enforceHTTPS: true,
    strictTransportSecurity: true,
    contentTypeOptions: true,
    frameOptions: "DENY",
    xssProtection: true,
  },
  moderate: {
    cspReportOnly: false,
    enforceHTTPS: true,
    strictTransportSecurity: true,
    contentTypeOptions: true,
    frameOptions: "SAMEORIGIN",
    xssProtection: true,
  },
  relaxed: {
    cspReportOnly: true,
    enforceHTTPS: false,
    strictTransportSecurity: false,
    contentTypeOptions: true,
    frameOptions: "SAMEORIGIN",
    xssProtection: false,
  },
} as const;

/**
 * Get security configuration based on mode
 */
export function getSecurityConfig(_testMode = false) {
  const rawMode = getRuntimeEnvString("NEXT_PUBLIC_SECURITY_MODE") || "strict";

  const mode =
    rawMode === "moderate" || rawMode === "relaxed" ? rawMode : "strict";

  switch (mode) {
    case "moderate":
      return SECURITY_MODES.moderate;
    case "relaxed":
      return SECURITY_MODES.relaxed;
    case "strict":
    default:
      return SECURITY_MODES.strict;
  }
}

/**
 * CSP report endpoint handler type
 */
export interface CSPReport {
  "csp-report": {
    "document-uri": string;
    referrer: string;
    "violated-directive": string;
    "effective-directive": string;
    "original-policy": string;
    disposition: string;
    "blocked-uri": string;
    "line-number": number;
    "column-number": number;
    "source-file": string;
    "status-code": number;
    "script-sample": string;
  };
}
