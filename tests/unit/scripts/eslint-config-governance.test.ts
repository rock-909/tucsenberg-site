import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const ESLINT_CONFIG_PATH = path.resolve("eslint.config.mjs");
const STRUCTURAL_SCRIPT_RULES = [
  "complexity",
  "max-depth",
  "max-lines",
  "max-lines-per-function",
  "max-nested-callbacks",
  "max-params",
  "max-statements",
] as const;

interface EslintConfigBlock {
  files?: string[];
  name?: string;
  rules?: Record<string, unknown>;
}

async function loadEslintConfig(): Promise<EslintConfigBlock[]> {
  const moduleUrl = `${pathToFileURL(ESLINT_CONFIG_PATH).href}?test=${Date.now()}`;
  const configModule = (await import(moduleUrl)) as {
    default: EslintConfigBlock[];
  };

  return configModule.default;
}

function findNamedBlock(
  config: EslintConfigBlock[],
  name: string,
): EslintConfigBlock {
  const block = config.find((item) => item.name === name);

  expect(block, `Expected ESLint config block "${name}"`).toBeDefined();
  return block!;
}

function expectWarningLevel(ruleName: string, value: unknown): void {
  if (Array.isArray(value)) {
    expect(value[0], `${ruleName} should be warning-level`).toBe("warn");
    return;
  }

  expect(value, `${ruleName} should be warning-level`).toBe("warn");
}

describe("eslint config governance", () => {
  it("uses one shared magic-number ignore list in the strict quality block", () => {
    const source = fs.readFileSync(ESLINT_CONFIG_PATH, "utf8");

    expect(source).toContain("const MAGIC_NUMBER_IGNORE_LIST = [");
    expect(source.match(/"no-magic-numbers": \[/gu) ?? []).toHaveLength(1);
    expect(
      source.match(/ignore: MAGIC_NUMBER_IGNORE_LIST/gu) ?? [],
    ).toHaveLength(1);
  });

  it("keeps structural script rules at warning level before final overrides", async () => {
    const config = await loadEslintConfig();
    const scriptsBlock = findNamedBlock(
      config,
      "codex-scripts-and-dev-tools-config",
    );
    const rules = scriptsBlock.rules ?? {};

    for (const ruleName of STRUCTURAL_SCRIPT_RULES) {
      expect(rules[ruleName], `${ruleName} should be configured`).toBeDefined();
      expectWarningLevel(ruleName, rules[ruleName]);
    }
  });

  it("does not disable structural script rules in the final scripts override", async () => {
    const config = await loadEslintConfig();
    const scriptsOverride = findNamedBlock(
      config,
      "scripts-directory-overrides",
    );
    const rules = scriptsOverride.rules ?? {};

    for (const ruleName of STRUCTURAL_SCRIPT_RULES) {
      expect(rules[ruleName], `${ruleName} must not be turned off`).not.toBe(
        "off",
      );
    }
  });

  it("keeps legacy script baselines file-specific instead of directory-wide", async () => {
    const config = await loadEslintConfig();
    const legacyBaseline = findNamedBlock(
      config,
      "legacy-script-structural-baselines",
    );

    expect(legacyBaseline.files).toEqual([
      "scripts/quality/checks/content-readiness.js",
      "scripts/quality/checks/content-slugs.js",
      "scripts/quality/checks/current-truth-docs.js",
      "scripts/quality/checks/eslint-disable.js",
      "scripts/quality/checks/release-verify.js",
    ]);

    for (const value of Object.values(legacyBaseline.rules ?? {})) {
      expect(Array.isArray(value) ? value[0] : value).toBe("warn");
    }
  });
});
