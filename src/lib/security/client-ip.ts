/**
 * Trusted Proxy Model - Client IP Extraction
 *
 * Extracts client IP from request headers with platform-specific trust rules.
 * Only parses proxy headers when request comes from a trusted platform entry.
 */

import cloudflareIpRanges from "@/lib/security/cloudflare-ip-ranges.json";
import { NextRequest } from "next/server";
import { getRuntimeEnvString, isRuntimeDevelopment } from "@/lib/env";
import { INTERNAL_TRUSTED_CLIENT_IP_HEADER } from "@/lib/security/client-ip-headers";
import {
  getNextJsIP,
  isValidIP,
  parseFirstIP,
} from "@/lib/security/ip-parsing";
import { isTrustedCdnSource } from "@/lib/security/ip-range";

const PLATFORM_CLOUDFLARE = "cloudflare";
const PLATFORM_DEVELOPMENT = "development";

type DeploymentPlatform =
  | typeof PLATFORM_CLOUDFLARE
  | typeof PLATFORM_DEVELOPMENT;

type HeadersLike = Pick<Headers, "get">;
type TrustedHeaderName =
  | typeof INTERNAL_TRUSTED_CLIENT_IP_HEADER
  | "x-real-ip"
  | "x-forwarded-for"
  | "cf-connecting-ip";

interface TrustedProxyConfig {
  primaryHeader: TrustedHeaderName;
  secondaryHeader?: TrustedHeaderName;
  cdnIpRanges?: typeof cloudflareIpRanges;
}

const FALLBACK_IP = "0.0.0.0";
const LOCALHOST_IP = "127.0.0.1";
const INTERNAL_HEADER_CONFIG: TrustedProxyConfig = {
  primaryHeader: INTERNAL_TRUSTED_CLIENT_IP_HEADER,
};

const CLOUDFLARE_TRUSTED_PROXY_CONFIG: TrustedProxyConfig = {
  primaryHeader: "cf-connecting-ip",
  secondaryHeader: "x-forwarded-for",
  cdnIpRanges: cloudflareIpRanges,
};

const DEVELOPMENT_TRUSTED_PROXY_CONFIG: TrustedProxyConfig = {
  primaryHeader: "x-forwarded-for",
  secondaryHeader: "x-real-ip",
};

function getDeploymentPlatform(): DeploymentPlatform | null {
  const platform = getRuntimeEnvString("DEPLOYMENT_PLATFORM");

  if (platform) {
    const normalizedPlatform = platform.toLowerCase();
    if (normalizedPlatform === PLATFORM_CLOUDFLARE) return PLATFORM_CLOUDFLARE;
    if (normalizedPlatform === PLATFORM_DEVELOPMENT) {
      return PLATFORM_DEVELOPMENT;
    }
    return null;
  }

  const legacyPlatform = getRuntimeEnvString("DEPLOY_TARGET");
  if (legacyPlatform) {
    const normalizedPlatform = legacyPlatform.toLowerCase();
    if (normalizedPlatform === PLATFORM_CLOUDFLARE) return PLATFORM_CLOUDFLARE;
    if (normalizedPlatform === PLATFORM_DEVELOPMENT) {
      return PLATFORM_DEVELOPMENT;
    }
    return null;
  }

  if (getRuntimeEnvString("CF_PAGES")) {
    return PLATFORM_CLOUDFLARE;
  }
  if (isRuntimeDevelopment()) {
    return PLATFORM_DEVELOPMENT;
  }

  return null;
}

function readHeaderIP(
  headers: HeadersLike,
  headerName: TrustedHeaderName,
): string | null {
  const headerValue = headers.get(headerName);
  if (!headerValue) {
    return null;
  }

  const ip = parseFirstIP(headerValue);
  return isValidIP(ip) ? ip : null;
}

function readTrustedHeaderIP(
  headers: HeadersLike,
  config: TrustedProxyConfig,
): string | null {
  const primaryIP = readHeaderIP(headers, config.primaryHeader);
  if (primaryIP) {
    return primaryIP;
  }

  if (config.secondaryHeader) {
    return readHeaderIP(headers, config.secondaryHeader);
  }

  return null;
}

function getPlatformContext(): {
  platform: DeploymentPlatform;
  config: TrustedProxyConfig;
} | null {
  const platform = getDeploymentPlatform();
  if (!platform) {
    return null;
  }

  return {
    platform,
    config:
      platform === PLATFORM_CLOUDFLARE
        ? CLOUDFLARE_TRUSTED_PROXY_CONFIG
        : DEVELOPMENT_TRUSTED_PROXY_CONFIG,
  };
}

function isTrustedCloudflareRequest(
  request: NextRequest,
  config: TrustedProxyConfig,
): boolean {
  if (!config.cdnIpRanges || config.cdnIpRanges.length === 0) {
    return false;
  }

  return isTrustedCdnSource(getNextJsIP(request), config.cdnIpRanges);
}

function getRequestFallbackIP(
  request: NextRequest,
  platform: DeploymentPlatform | null,
): string {
  const nextIp = getNextJsIP(request);
  if (nextIp) {
    return nextIp;
  }

  if (platform === PLATFORM_DEVELOPMENT) {
    return LOCALHOST_IP;
  }

  return FALLBACK_IP;
}

function canTrustPlatformHeaders(
  request: NextRequest,
  platformContext: { platform: DeploymentPlatform; config: TrustedProxyConfig },
): boolean {
  if (platformContext.platform !== PLATFORM_CLOUDFLARE) {
    return true;
  }

  return isTrustedCloudflareRequest(request, platformContext.config);
}

function pushUniqueIP(chain: string[], ip: string | null | undefined): void {
  if (!ip || !isValidIP(ip) || chain.includes(ip)) {
    return;
  }

  chain.push(ip);
}

export function getTrustedClientIPForInternalHeader(
  request: NextRequest,
): string | null {
  const platformContext = getPlatformContext();
  if (!platformContext || !canTrustPlatformHeaders(request, platformContext)) {
    return null;
  }

  return readTrustedHeaderIP(request.headers, platformContext.config);
}

export function getClientIP(request: NextRequest): string {
  const platformContext = getPlatformContext();
  if (!platformContext) {
    return getRequestFallbackIP(request, null);
  }

  if (!canTrustPlatformHeaders(request, platformContext)) {
    return getRequestFallbackIP(request, platformContext.platform);
  }

  const headerIP = readTrustedHeaderIP(request.headers, platformContext.config);
  if (headerIP) {
    return headerIP;
  }

  return getRequestFallbackIP(request, platformContext.platform);
}

export function getIPChain(request: NextRequest): string[] {
  const chain: string[] = [];
  const xForwardedFor = request.headers.get("x-forwarded-for");

  if (xForwardedFor) {
    for (const candidate of xForwardedFor.split(",").map((ip) => ip.trim())) {
      pushUniqueIP(chain, candidate);
    }
  }

  pushUniqueIP(chain, request.headers.get("x-real-ip"));

  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP && isValidIP(cfIP) && !chain.includes(cfIP)) {
    chain.unshift(cfIP);
  }

  pushUniqueIP(chain, getNextJsIP(request));

  return chain;
}

export function getClientIPFromHeaders(headers: HeadersLike): string {
  const platformContext = getPlatformContext();
  if (!platformContext) {
    return FALLBACK_IP;
  }

  if (platformContext.platform === PLATFORM_CLOUDFLARE) {
    return readTrustedHeaderIP(headers, INTERNAL_HEADER_CONFIG) ?? FALLBACK_IP;
  }

  const headerIP = readTrustedHeaderIP(headers, platformContext.config);
  if (headerIP) {
    return headerIP;
  }

  return platformContext.platform === PLATFORM_DEVELOPMENT
    ? LOCALHOST_IP
    : FALLBACK_IP;
}
