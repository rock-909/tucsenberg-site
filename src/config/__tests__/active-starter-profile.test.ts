import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getRuntimeMessageProfileId,
  SOURCE_RUNTIME_MESSAGE_PROFILE_ID,
} from "@/config/active-starter-profile";

describe("active-starter-profile", () => {
  it("keeps the materialized Tucsenberg runtime profile explicit", () => {
    const source = readFileSync(
      join(process.cwd(), "src/config/active-starter-profile.ts"),
      "utf8",
    );

    expect(SOURCE_RUNTIME_MESSAGE_PROFILE_ID).toBe("catalog");
    expect(getRuntimeMessageProfileId()).toBe("catalog");
    expect(source).toContain("materialized Tucsenberg site");
  });
});
