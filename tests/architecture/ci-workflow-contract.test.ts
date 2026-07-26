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

  it("keeps the full React Doctor reconciliation visible but non-blocking", () => {
    const qualitySteps = readCiWorkflowConfig().jobs?.quality?.steps ?? [];

    expect(qualitySteps).toContainEqual({
      name: "React Doctor 全量对账（非阻塞）",
      "continue-on-error": true,
      run: "pnpm react:doctor:reconcile",
    });
  });

  it("keeps Semgrep blocking scope narrow in CI", () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain(
      "semgrep scan --error --severity ERROR --config semgrep.yml src",
    );
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
