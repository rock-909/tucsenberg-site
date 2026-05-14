import "server-only";

import {
  FIVE_MINUTES_MS,
  MILLISECONDS_PER_HOUR,
  MILLISECONDS_PER_SECOND,
} from "@/constants/time";

export const OPS_TRAFFIC_ACCESS_COOKIE_NAME = "ops_traffic_access";

const COOKIE_MAX_AGE_HOURS = 12;
const COOKIE_MAX_AGE_MS = MILLISECONDS_PER_HOUR * COOKIE_MAX_AGE_HOURS;
export const OPS_TRAFFIC_ACCESS_COOKIE_MAX_AGE_SECONDS =
  COOKIE_MAX_AGE_MS / MILLISECONDS_PER_SECOND;

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return toBase64Url(signature);
}

export async function createOpsAccessCookieValue(input: {
  secret: string;
  nowMs?: number;
}): Promise<string> {
  const issuedAt = String(input.nowMs ?? Date.now());
  const signature = await sign(input.secret, issuedAt);
  return `${issuedAt}.${signature}`;
}

export async function verifyOpsAccessCookieValue(input: {
  cookieValue: string | undefined;
  secret: string | undefined;
  nowMs?: number;
}): Promise<boolean> {
  if (!input.cookieValue || !input.secret) {
    return false;
  }

  const [issuedAt, signature] = input.cookieValue.split(".");
  if (!issuedAt || !signature) {
    return false;
  }

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) {
    return false;
  }

  const nowMs = input.nowMs ?? Date.now();
  if (nowMs - issuedAtMs > COOKIE_MAX_AGE_MS) {
    return false;
  }

  if (issuedAtMs - nowMs > FIVE_MINUTES_MS) {
    return false;
  }

  const expected = await sign(input.secret, issuedAt);
  return expected === signature;
}
