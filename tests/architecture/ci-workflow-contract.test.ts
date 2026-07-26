import { existsSync, readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const LEFTHOOK_CONFIG_PATH = "lefthook.yml";
const PRETTIER_CONFIG_PATH = "prettier.config.mjs";
const SEMGREP_CONFIG_PATH = "semgrep.yml";
const COMPONENT_PROOF_COMMANDS = [
  "pnpm component:governance:test",
  "pnpm component:governance",
  "pnpm exec storybook build",
] as const;
const FULL_COMPONENT_CHECK_COMMAND = "pnpm component:check";
interface SemgrepRulePaths {
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
}

interface SemgrepRule {
  readonly id: string;
  readonly severity?: string;
  readonly paths?: SemgrepRulePaths;
}

interface WorkflowStep {
  readonly "continue-on-error"?: boolean;
  readonly name?: string;
  readonly run?: string;
}

interface CiWorkflow {
  readonly jobs?: {
    readonly quality?: {
      readonly steps?: readonly WorkflowStep[];
    };
  };
}

interface SemgrepConfig {
  readonly rules?: readonly SemgrepRule[];
}

function readCiWorkflow(): string {
  return readFileSync(CI_WORKFLOW_PATH, "utf8");
}

function readRepoFile(relativePath: string): string {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed repo config paths
  return readFileSync(relativePath, "utf8");
}

function readSemgrepConfig(): SemgrepConfig {
  return yaml.load(readRepoFile(SEMGREP_CONFIG_PATH)) as SemgrepConfig;
}

function readCiWorkflowConfig(): CiWorkflow {
  return yaml.load(readCiWorkflow()) as CiWorkflow;
}

/** Every `run:` command a parsed workflow/hook config would actually execute. */
function collectRunCommands(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) collectRunCommands(item, found);
    return found;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "run" && typeof value === "string") found.push(value);
      else collectRunCommands(value, found);
    }
  }

  return found;
}

function getQualityJob(workflow: string): string {
  const qualityStart = workflow.indexOf("  quality:");
  const testsStart = workflow.indexOf("\n  tests:", qualityStart);

  expect(qualityStart, "quality job must exist in CI workflow").toBeGreaterThan(
    -1,
  );
  expect(testsStart, "tests job must follow quality job").toBeGreaterThan(
    qualityStart,
  );

  return workflow.slice(qualityStart, testsStart);
}

describe("CI workflow contract", () => {
  it("runs component governance and Storybook build in the quality job", () => {
    const workflow = readCiWorkflow();
    const qualityJob = getQualityJob(workflow);

    for (const command of COMPONENT_PROOF_COMMANDS) {
      expect(qualityJob).toContain(command);
    }

    expect(qualityJob).not.toContain(FULL_COMPONENT_CHECK_COMMAND);
  });

  it("runs an honestly named preview configuration smoke in the quality job", () => {
    const qualitySteps = readCiWorkflowConfig().jobs?.quality?.steps ?? [];

    expect(qualitySteps).toContainEqual({
      name: "preview config smoke",
      run: "APP_ENV=preview node scripts/starter-checks.js validate-production-config",
    });
  });

  // 这两个检查器写好了很久，但一个入口都没有——只有人工敲 CLI 才会跑，等于
  // 不存在。接进 CI 之后，除了这条断言没有别的东西拦着谁再把它们摘掉。守的是
  // 命令本身在跑，不是步骤名怎么写。
  it("keeps the standalone gate checks wired to a lane that actually runs", () => {
    const qualityRuns = (readCiWorkflowConfig().jobs?.quality?.steps ?? [])
      .map((step) => step.run?.trim())
      .filter((run): run is string => Boolean(run));

    for (const command of [
      "node scripts/starter-checks.js markdown-fences",
      "node scripts/starter-checks.js vitest-collection",
    ]) {
      expect(qualityRuns).toContain(command);
    }
  });

  it("keeps the full React Doctor reconciliation visible but non-blocking", () => {
    const qualitySteps = readCiWorkflowConfig().jobs?.quality?.steps ?? [];

    expect(qualitySteps).toContainEqual({
      name: "React Doctor 全量对账（非阻塞）",
      "continue-on-error": true,
      run: "pnpm react:doctor:reconcile",
    });
  });

  // 这条以前叫 "keeps Semgrep blocking scope narrow"，钉的是带 ` src` 的整条命令
  // 字符串。它守住的正是那个洞：扫描只覆盖 src，scripts/ 下的门禁脚本和执行中的
  // 根配置全在安全扫描之外，而这条断言让谁想扩大范围都会先把它撞红。改成守扫描
  // 目标本身——必须是整个仓库，不是点名的子集。
  it("scans the whole repository, not a hand-picked subset", () => {
    const command = readCiWorkflow()
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("run: semgrep scan"));

    expect(command).toBeDefined();

    // `semgrep scan [flags] <targets...>`：跳过 flag 和带值 flag 的值，剩下的是目标。
    const tokens = (command ?? "").replace(/^run:\s*/u, "").split(/\s+/u);
    const flagsTakingValue = new Set(["--config", "--severity"]);
    const targets: string[] = [];
    for (let index = 2; index < tokens.length; index += 1) {
      const token = tokens[index] ?? "";
      if (flagsTakingValue.has(token)) {
        index += 1;
        continue;
      }
      if (token.startsWith("--")) continue;
      targets.push(token);
    }

    expect(targets).toEqual(["."]);
  });

  // CI scans with `--severity ERROR`, so any rule below that severity is dead
  // weight that still reads as coverage. A frozen ID list used to stand here; it
  // only made adding a real rule fail, and never caught a demoted one.
  it("keeps every Semgrep rule at the severity CI actually scans", () => {
    const rules = readSemgrepConfig().rules ?? [];
    const belowCiFloor = rules
      .filter((rule) => rule.severity !== "ERROR")
      .map((rule) => rule.id);

    expect(rules.length).toBeGreaterThan(0);
    expect(belowCiFloor).toEqual([]);
  });

  it("scopes safeParseJson enforcement to the inquiry lead writer only", () => {
    const semgrepConfig = readSemgrepConfig();
    const rule = (semgrepConfig.rules ?? []).find(
      (entry) => entry.id === "starter-lead-route-missing-safe-json-body",
    );
    const includes = rule?.paths?.include ?? [];

    expect(rule, "lead safe-json Semgrep rule must exist").toBeDefined();
    expect(includes).toContain("src/app/api/inquiry/route.ts");
  });

  it("keeps Lighthouse as a manual performance proof", () => {
    const automated = [
      ...collectRunCommands(yaml.load(readCiWorkflow())),
      ...collectRunCommands(yaml.load(readRepoFile(LEFTHOOK_CONFIG_PATH))),
    ];

    expect(automated.length).toBeGreaterThan(0);
    expect(
      automated.filter((command) => /lighthouse|lhci/iu.test(command)),
    ).toEqual([]);
  });

  it("declares the Tailwind Prettier plugin explicitly", () => {
    expect(existsSync(PRETTIER_CONFIG_PATH)).toBe(true);
    expect(readRepoFile(PRETTIER_CONFIG_PATH)).toContain(
      "prettier-plugin-tailwindcss",
    );
  });
});
