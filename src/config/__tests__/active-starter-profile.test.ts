import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getRuntimeMessageProfileId,
  SOURCE_RUNTIME_MESSAGE_PROFILE_ID,
} from "@/config/active-starter-profile";

describe("active-starter-profile", () => {
  it("keeps the source runtime profile explicitly separate from the default generated profile", () => {
    const source = readFileSync(
      join(process.cwd(), "src/config/active-starter-profile.ts"),
      "utf8",
    );

    expect(SOURCE_RUNTIME_MESSAGE_PROFILE_ID).toBe("showcase-full");
    expect(getRuntimeMessageProfileId()).toBe("showcase-full");
    expect(source).toContain("source checkout demo/runtime profile");
    expect(source).toContain(
      "default generated starter remains `company-site`",
    );
  });
});
