import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const COMPONENT_PROOF_COMMANDS = [
  "pnpm component:governance:test",
  "pnpm component:governance",
  "pnpm exec storybook build",
] as const;
const FULL_COMPONENT_CHECK_COMMAND = "pnpm component:check";

function readCiWorkflow(): string {
  return readFileSync(CI_WORKFLOW_PATH, "utf8");
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
});
