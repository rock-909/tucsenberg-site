import { existsSync, readdirSync, readFileSync } from "node:fs";
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

type WorkflowPath =
  | ".github/workflows/ci.yml"
  | ".github/workflows/cloudflare-deploy.yml";

function readWorkflowText(relativePath: WorkflowPath) {
  switch (relativePath) {
    case ".github/workflows/ci.yml":
      return readFileSync(".github/workflows/ci.yml", "utf8");
    case ".github/workflows/cloudflare-deploy.yml":
      return readFileSync(".github/workflows/cloudflare-deploy.yml", "utf8");
    default: {
      const _exhaustive: never = relativePath;
      return _exhaustive;
    }
  }
}

function readCiWorkflow(): Workflow {
  return yaml.load(readWorkflowText(".github/workflows/ci.yml")) as Workflow;
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

  it("keeps CI focused on starter proof instead of old guardrail bureaucracy", () => {
    const workflowText = readWorkflowText(".github/workflows/ci.yml");

    expect(workflowText).toContain("pnpm brand:check");
    expect(workflowText).toContain("pnpm content:check");
    expect(workflowText).toContain(
      "node scripts/starter-checks.js client-boundary",
    );
    expect(workflowText).toContain("pnpm website:build:cf");
    expect(workflowText).toContain("Lead API family proof");
    expect(workflowText).not.toContain("pnpm quality:gate:ci");
    expect(workflowText).not.toContain("pnpm review:all-guardrails");
  });

  it("keeps React Doctor as an error-level gate without extra governance layers", () => {
    const workflow = readCiWorkflow();
    const qualitySteps = workflow.jobs?.quality?.steps ?? [];
    const stepRuns = qualitySteps.map((step) => step.run ?? "");

    expect(stepRuns).toContain("pnpm react:doctor");
    expect(stepRuns).not.toContain("pnpm react:doctor:governance");
    expect(stepRuns).not.toContain("pnpm react:doctor:raw-governance");
  });

  it("keeps only CI and Cloudflare workflow files", () => {
    const workflowFiles = readdirSync(".github/workflows").sort();

    expect(workflowFiles).toEqual(["ci.yml", "cloudflare-deploy.yml"]);
  });

  it("keeps CI and Cloudflare as the default proof workflows", () => {
    const ciWorkflow = readWorkflowText(".github/workflows/ci.yml");
    const cloudflareWorkflow = readWorkflowText(
      ".github/workflows/cloudflare-deploy.yml",
    );

    expect(ciWorkflow).toContain("pull_request:");
    expect(ciWorkflow).toContain("pnpm website:build:cf");
    expect(cloudflareWorkflow).toContain("workflow_dispatch:");
    expect(cloudflareWorkflow).toContain("pnpm release:verify");
  });

  it("lets pnpm/action-setup use the packageManager version instead of a stale CI pin", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      readonly packageManager?: string;
    };
    const workflows: readonly WorkflowPath[] = [
      ".github/workflows/ci.yml",
      ".github/workflows/cloudflare-deploy.yml",
    ];

    expect(packageJson.packageManager).toBe("pnpm@11.1.0");

    for (const workflowPath of workflows) {
      const workflow = yaml.load(readWorkflowText(workflowPath)) as Workflow;
      const pnpmSetupSteps = Object.values(workflow.jobs ?? {}).flatMap((job) =>
        (job.steps ?? []).filter(
          (step) => step.uses === "pnpm/action-setup@v5",
        ),
      );

      expect(pnpmSetupSteps.length, workflowPath).toBeGreaterThan(0);
      for (const step of pnpmSetupSteps) {
        expect(step.with?.version, workflowPath).toBeUndefined();
      }
    }
  });

  it("removes old standalone quality and uplink workflows", () => {
    expect(existsSync(".github/workflows/code-quality.yml")).toBe(false);
    expect(existsSync(".github/workflows/uplink-health.yml")).toBe(false);
  });
});
