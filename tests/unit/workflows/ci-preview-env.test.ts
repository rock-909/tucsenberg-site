import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

interface WorkflowStep {
  readonly name?: string;
  readonly uses?: string;
  readonly run?: string;
  readonly env?: Record<string, string>;
  readonly with?: Record<string, unknown>;
}

interface WorkflowJob {
  readonly steps?: WorkflowStep[];
}

interface Workflow {
  readonly jobs?: Record<string, WorkflowJob>;
}

function readCiWorkflow(): Workflow {
  return yaml.load(
    readFileSync(".github/workflows/ci.yml", "utf8"),
  ) as Workflow;
}

describe("CI preview environment contract", () => {
  it("does not run preview performance builds with the reserved example.com site URL", () => {
    const workflow = readCiWorkflow();
    const buildStep = workflow.jobs?.["cloudflare-build"]?.steps?.find(
      (step) => step.name === "构建检查",
    );

    expect(buildStep?.env?.APP_ENV).toBe("preview");
    expect(buildStep?.env?.NEXT_PUBLIC_SITE_URL).not.toContain("example.com");
  });
});
