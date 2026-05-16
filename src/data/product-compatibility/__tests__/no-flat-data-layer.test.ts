import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Architecture guard.
 *
 * The flat `src/data/*.ts` modules were a pre-Step-4 dead layer with zero
 * external importers and misleading test specs. The live data layer is
 * `src/data/product-compatibility/`. This guard permanently prevents the
 * orphaned flat modules from being re-introduced or re-imported anywhere
 * under `src`.
 */
describe("architecture guard: no flat data layer", () => {
  it("has no imports of the orphaned flat data modules anywhere in src", () => {
    const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
    const pattern =
      "@/data/(products|compatibility|queries|oem-brands|oem-models|schemas|i18n-types)|from [\"']@/data[\"']|from [\"']@/data/index[\"']";

    // `-rEl` assumes a POSIX-ish grep (GNU/BSD/busybox/ugrep all support these flags).
    const result = spawnSync("grep", ["-rEl", pattern, "src"], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    // grep exit status: 0 = match found, 1 = no match, >1 = error.
    expect(
      result.status,
      `flat data layer re-imported in:\n${result.stdout}`,
    ).toBe(1);
    expect(result.stdout).toBe("");
  });
});
