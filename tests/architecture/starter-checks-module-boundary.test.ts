import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("starter-checks module boundary", () => {
  it("keeps the translations check in its focused quality module", () => {
    const starterChecks = readFileSync("scripts/starter-checks.js", "utf8");
    const translationsModule = readFileSync(
      "scripts/quality/checks/translations.js",
      "utf8",
    );

    expect(starterChecks).toContain('require("./quality/checks/translations")');
    expect(starterChecks).not.toContain("function validateLocale(");
    expect(starterChecks).not.toContain("function compareLocales(");
    expect(starterChecks).not.toContain("function runTranslationCheck(");
    expect(translationsModule).toContain("function runTranslationCheck(");
  });
});
