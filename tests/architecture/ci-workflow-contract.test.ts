import { existsSync, readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const LEFTHOOK_CONFIG_PATH = "lefthook.yml";
const LIGHTHOUSE_CONFIG_PATH = "lighthouserc.js";
const PRETTIER_CONFIG_PATH = "prettier.config.mjs";
const SEMGREP_CONFIG_PATH = "semgrep.yml";
const COMPONENT_PROOF_COMMANDS = [
  "pnpm component:governance:test",
  "pnpm component:governance",
  "pnpm exec storybook build",
] as const;
const FULL_COMPONENT_CHECK_COMMAND = "pnpm component:check";
const ERROR_SEMGREP_RULE_IDS = [
  "nextjs-unsafe-dangerouslySetInnerHTML",
  "hardcoded-api-keys",
  "unsafe-eval-usage",
  "nextjs-unsafe-redirect",
  "insecure-random-generation",
  "nextjs-unsafe-html-injection",
  "weak-crypto-algorithm",
  "sql-injection-risk",
  "nextjs-unsafe-server-action",
  "environment-variable-exposure",
  "object-injection-untrusted-key-write",
  "no-raw-request-json-in-api",
  "env-access-bypass-in-config",
  "raw-proxy-header-read-outside-trusted-entry",
  "api-route-free-text-error-response",
  "starter-lead-route-missing-safe-json-body",
] as const;

interface SemgrepRule {
  readonly id: string;
  readonly severity?: string;
}

interface WorkflowStep {
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

  it("keeps Semgrep blocking scope narrow in CI", () => {
    const workflow = readCiWorkflow();

    expect(workflow).toContain(
      "semgrep scan --error --severity ERROR --config semgrep.yml src",
    );
  });

  it("keeps only must-fix Semgrep rules at ERROR severity", () => {
    const semgrepConfig = readSemgrepConfig();
    const errorRuleIds = (semgrepConfig.rules ?? [])
      .filter((rule) => rule.severity === "ERROR")
      .map((rule) => rule.id);

    expect(errorRuleIds).toEqual(ERROR_SEMGREP_RULE_IDS);
  });

  it("keeps Lighthouse as a manual performance proof", () => {
    const workflow = readCiWorkflow();
    const lefthook = readRepoFile(LEFTHOOK_CONFIG_PATH);
    const lighthouseConfig = readRepoFile(LIGHTHOUSE_CONFIG_PATH);

    expect(workflow).not.toContain("website:lighthouse");
    expect(workflow).not.toContain("lhci");
    expect(lefthook).not.toContain("performance-test");
    expect(lefthook).not.toContain("website:lighthouse");
    expect(lefthook).not.toContain("lhci autorun");
    expect(lighthouseConfig).toContain(
      "Lighthouse 是手动性能证明，不接入默认 CI 或 git hook。",
    );
  });

  it("declares the Tailwind Prettier plugin explicitly", () => {
    expect(existsSync(PRETTIER_CONFIG_PATH)).toBe(true);
    expect(readRepoFile(PRETTIER_CONFIG_PATH)).toContain(
      "prettier-plugin-tailwindcss",
    );
  });
});
