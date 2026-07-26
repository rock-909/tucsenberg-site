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

/**
 * 仓库自己写的配置块。第三方 preset（`@eslint/js/recommended`、
 * `typescript-eslint/recommended` 之类）名字里带 `/`，覆盖它们是正常做法，
 * 不参与下面的重复检测。
 */
function isRepoAuthored(block: EslintConfigBlock): boolean {
  return /^[a-z][a-z0-9-]*$/u.test(block.name ?? "");
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

  // 两个作用域逐字相同的块设置同一条规则时，前面那条永远不会生效——它读起来
  // 像一道防线，实际什么都不拦。这个仓库里出现过四次：useBreakpoint 导入禁令、
  // ForIn/Labeled/With 语法禁令、测试文件的 detect-object-injection error、
  // 以及重复声明的 no-eval 三件套。守的是"配置里写着的规则真的生效"。
  // 只认逐字相同的 files 作用域：一个块用更宽的 glob 盖住另一个（`**/*.ts`
  // 盖 `src/lib/**/*.ts`）它抓不到，那要靠逐文件对账，成本不在一个量级。
  it("never lets one block silently replace another at the identical files scope", async () => {
    const config = await loadEslintConfig();
    const seen = new Map<string, string>();
    const shadowed: string[] = [];

    for (const block of config) {
      if (!isRepoAuthored(block) || !block.rules) continue;

      const scope = JSON.stringify(block.files ?? "ALL_FILES");
      for (const rule of Object.keys(block.rules)) {
        const key = `${scope}::${rule}`;
        const earlier = seen.get(key);

        if (earlier) {
          shadowed.push(`${rule} @ ${scope}: ${earlier} → ${block.name}`);
        }
        seen.set(key, block.name ?? "(unnamed)");
      }
    }

    expect(shadowed).toEqual([]);
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
