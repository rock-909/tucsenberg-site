import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  checkDistributedRateLimit,
  createRateLimitHeaders,
} from "@/lib/security/distributed-rate-limit";
import { getRuntimeEnvString, isRuntimeProduction } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  createOpsAccessCookieValue,
  OPS_TRAFFIC_ACCESS_COOKIE_MAX_AGE_SECONDS,
  OPS_TRAFFIC_ACCESS_COOKIE_NAME,
} from "@/lib/ops/access-cookie";
import { constantTimeCompare } from "@/lib/security/crypto";
import { getIPKey } from "@/lib/security/rate-limit-key-strategies";

const SEE_OTHER_STATUS = 303;
const RATE_LIMIT_HEADER_NAMES = [
  "retry-after",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "x-ratelimit-degraded",
] as const;

function redirectTo(path: string, headers?: Headers) {
  return new NextResponse(null, {
    status: SEE_OTHER_STATUS,
    headers: {
      ...Object.fromEntries(headers?.entries() ?? []),
      Location: path,
    },
  });
}

function redirectToDenied(headers?: Headers) {
  const response = redirectTo("/ops/traffic?access=denied", headers);
  response.cookies.delete({
    name: OPS_TRAFFIC_ACCESS_COOKIE_NAME,
    path: "/ops/traffic",
  });
  return response;
}

function copyRateLimitHeaders(source: Headers): Headers {
  const headers = new Headers();
  for (const headerName of RATE_LIMIT_HEADER_NAMES) {
    const value = source.get(headerName);
    if (value) headers.set(headerName, value);
  }
  return headers;
}

async function createFailedAttemptRateLimitKey(
  request: NextRequest,
): Promise<string | null> {
  try {
    return await getIPKey(request);
  } catch (error) {
    logger.error("Ops access rate limit key generation failed", { error });
    return null;
  }
}

async function redirectAfterFailedAttempt(rateLimitKey: string) {
  try {
    const result = await checkDistributedRateLimit(rateLimitKey, "opsAccess");
    if (!result.allowed) {
      return redirectToDenied(
        copyRateLimitHeaders(createRateLimitHeaders(result)),
      );
    }
  } catch (error) {
    logger.error("Ops access rate limit check failed", { error });
  }

  return redirectToDenied();
}

export async function POST(request: NextRequest) {
  const rateLimitKey = await createFailedAttemptRateLimitKey(request);
  if (!rateLimitKey) {
    return redirectToDenied();
  }

  const form = await request.formData();
  const accessKey = String(form.get("accessKey") ?? "");
  const secret = getRuntimeEnvString("OPS_DASHBOARD_ACCESS_KEY");

  if (!secret || !constantTimeCompare(accessKey, secret)) {
    return redirectAfterFailedAttempt(rateLimitKey);
  }

  const response = redirectTo("/ops/traffic");
  response.cookies.set({
    name: OPS_TRAFFIC_ACCESS_COOKIE_NAME,
    value: await createOpsAccessCookieValue({ secret }),
    httpOnly: true,
    sameSite: "strict",
    secure: isRuntimeProduction(),
    path: "/ops/traffic",
    maxAge: OPS_TRAFFIC_ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
