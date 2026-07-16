import { describe, expect, it } from "vitest";
import { createUnexpectedConsoleError } from "@/test/setup.console";

describe("unexpected console.error gate", () => {
  it("allows an empty test and rejects collected errors with useful details", () => {
    expect(createUnexpectedConsoleError([])).toBeUndefined();

    const error = createUnexpectedConsoleError([
      ["Turnstile failed", { code: "network-error" }],
      [new Error("secondary failure")],
    ]);

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain("1. Turnstile failed");
    expect(error?.message).toContain('"code":"network-error"');
    expect(error?.message).toContain("2. Error: secondary failure");
  });
});
