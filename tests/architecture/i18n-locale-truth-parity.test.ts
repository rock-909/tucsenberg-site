import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { LOCALES_CONFIG } from "@/config/paths/locales-config";
import i18nToolConfig from "../../i18n.json";

const require = createRequire(import.meta.url);
const translationCheckConfig = require("../../i18n-locales.config.js") as {
  locales: string[];
  defaultLocale: string;
};

function sorted(values: readonly string[]) {
  return [...values].sort();
}

describe("i18n locale truth parity", () => {
  it("keeps translation checks aligned with the runtime locale truth", () => {
    expect(translationCheckConfig.locales).toEqual(LOCALES_CONFIG.locales);
    expect(translationCheckConfig.defaultLocale).toBe(
      LOCALES_CONFIG.defaultLocale,
    );
  });

  it("keeps the translation tool config aligned with the runtime locale truth", () => {
    const toolLocales = [
      i18nToolConfig.sourceLocale,
      ...i18nToolConfig.targetLocales,
    ];
    const targetLocales = LOCALES_CONFIG.locales.filter(
      (locale) => locale !== LOCALES_CONFIG.defaultLocale,
    );

    expect(i18nToolConfig.sourceLocale).toBe(LOCALES_CONFIG.defaultLocale);
    expect(sorted(i18nToolConfig.targetLocales)).toEqual(sorted(targetLocales));
    expect(sorted(toolLocales)).toEqual(sorted(LOCALES_CONFIG.locales));
  });

  it("keeps public SEO locales explicit and excludes internal Chinese preview", () => {
    expect(LOCALES_CONFIG.locales).toEqual(["en", "es", "zh"]);
    expect(LOCALES_CONFIG.publicLocales).toEqual(["en", "es"]);
    expect(LOCALES_CONFIG.publicLocales).not.toContain("zh");
  });

  it("documents the tooling locale config as a mirror, not the runtime truth", () => {
    const configSource = readFileSync("i18n-locales.config.js", "utf8");

    expect(configSource).toContain("LOCALES_CONFIG");
    expect(configSource).not.toContain("只需在此处修改 locales 数组");
  });
});
