import { readFileSync } from "node:fs";

import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

interface DeployWorkflow {
  readonly concurrency?: {
    readonly "cancel-in-progress"?: boolean | string;
  };
  readonly jobs?: Record<
    string,
    {
      readonly needs?: string | readonly string[];
      readonly "continue-on-error"?: boolean;
      readonly steps?: readonly {
        readonly if?: string;
        readonly name?: string;
        readonly run?: string;
        readonly "continue-on-error"?: boolean;
      }[];
    }
  >;
}

function loadDeployWorkflow(): DeployWorkflow {
  return load(
    readFileSync(".github/workflows/cloudflare-deploy.yml", "utf8"),
  ) as DeployWorkflow;
}

function normalizeNeeds(
  needs: string | readonly string[] | undefined,
): string[] {
  if (needs === undefined) return [];
  return Array.isArray(needs) ? [...needs] : [needs as string];
}

describe("Cloudflare deploy workflow contract", () => {
  it("guards production deployment to the main branch", () => {
    const workflow = loadDeployWorkflow();
    const guard = workflow.jobs?.["build-and-deploy"]?.steps?.find(
      (step) =>
        step.run?.includes("GITHUB_REF_NAME") && step.run.includes('"main"'),
    );

    expect(guard?.run).toMatch(/GITHUB_REF_NAME[^\n]+!=[^\n]+main/u);
    expect(guard?.if).toContain("inputs.environment == 'production'");
  });

  it("runs strict production gates before deployment", () => {
    const steps = workflowSteps(loadDeployWorkflow(), "build-and-deploy");
    const configGate = findStepIndex(steps, "validate-production-config");
    const contentGate = findStepIndex(
      steps,
      "content-readiness --strict-client-launch",
    );
    const deploy = findStepIndex(steps, "opennextjs-cloudflare deploy");

    expect(configGate).toBeGreaterThanOrEqual(0);
    expect(contentGate).toBeGreaterThan(configGate);
    expect(deploy).toBeGreaterThan(contentGate);
  });

  it("keeps post-deploy verification serialized after the deploy job", () => {
    const workflow = loadDeployWorkflow();
    const smokeStep = workflowSteps(workflow, "post-deploy-verification").find(
      (step) => step.run?.includes("starter-checks.js deployed-smoke"),
    );

    expect(
      normalizeNeeds(workflow.jobs?.["post-deploy-verification"]?.needs),
    ).toContain("build-and-deploy");
    expect(smokeStep?.run).toContain(
      "needs.build-and-deploy.outputs.deployment_url",
    );
  });

  it("does not cancel an in-flight production deployment", () => {
    expect(loadDeployWorkflow().concurrency?.["cancel-in-progress"]).toBe(
      "${{ inputs.environment != 'production' }}",
    );
  });

  it("does not allow deploy or verification failures to be ignored", () => {
    const workflow = loadDeployWorkflow();

    for (const job of Object.values(workflow.jobs ?? {})) {
      expect(job["continue-on-error"]).toBeUndefined();
      for (const step of job.steps ?? []) {
        expect(step["continue-on-error"]).toBeUndefined();
      }
    }
  });
});

function workflowSteps(workflow: DeployWorkflow, jobName: string) {
  return workflow.jobs?.[jobName]?.steps ?? [];
}

function findStepIndex(
  steps: readonly { readonly run?: string }[],
  commandFragment: string,
) {
  return steps.findIndex((step) => step.run?.includes(commandFragment));
}
