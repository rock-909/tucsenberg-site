import { describe, expect, it } from "vitest";

import {
  createOpsAccessCookieValue,
  verifyOpsAccessCookieValue,
} from "@/lib/ops/access-cookie";

describe("ops access cookie", () => {
  it("verifies a fresh signed cookie", async () => {
    const value = await createOpsAccessCookieValue({
      secret: "x".repeat(32),
      nowMs: 1_000,
    });

    await expect(
      verifyOpsAccessCookieValue({
        cookieValue: value,
        secret: "x".repeat(32),
        nowMs: 1_000,
      }),
    ).resolves.toBe(true);
  });

  it("rejects tampered and expired cookies", async () => {
    const value = await createOpsAccessCookieValue({
      secret: "x".repeat(32),
      nowMs: 1_000,
    });

    await expect(
      verifyOpsAccessCookieValue({
        cookieValue: `${value}tampered`,
        secret: "x".repeat(32),
        nowMs: 1_000,
      }),
    ).resolves.toBe(false);

    await expect(
      verifyOpsAccessCookieValue({
        cookieValue: value,
        secret: "x".repeat(32),
        nowMs: 1_000 + 13 * 60 * 60 * 1000,
      }),
    ).resolves.toBe(false);
  });

  it("rejects an altered signature while preserving the original cookie", async () => {
    const secret = "x".repeat(32);
    const value = await createOpsAccessCookieValue({
      secret,
      nowMs: 1_000,
    });
    const [issuedAt, signature] = value.split(".");
    expect(issuedAt).toBeDefined();
    expect(signature).toBeDefined();

    const replacement = signature?.[0] === "a" ? "b" : "a";
    const alteredSignature = `${replacement}${signature?.slice(1) ?? ""}`;

    await expect(
      verifyOpsAccessCookieValue({
        cookieValue: `${issuedAt}.${alteredSignature}`,
        secret,
        nowMs: 1_000,
      }),
    ).resolves.toBe(false);

    await expect(
      verifyOpsAccessCookieValue({
        cookieValue: value,
        secret,
        nowMs: 1_000,
      }),
    ).resolves.toBe(true);
  });
});
