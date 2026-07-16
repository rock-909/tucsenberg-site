import { existsSync, readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

interface WorkflowStep {
  readonly name?: string;
  readonly run?: string;
  readonly uses?: string;
  readonly env?: Record<string, string>;
}

interface Workflow {
  readonly on?: {
    readonly schedule?: readonly { readonly cron?: string }[];
  };
  readonly permissions?: Record<string, string>;
  readonly jobs?: Record<string, { readonly steps?: readonly WorkflowStep[] }>;
}

describe("daily E2E proof lane", () => {
  it("runs the coverage-mapped browser specs every day", () => {
    const workflow = yaml.load(
      readFileSync(".github/workflows/daily-e2e.yml", "utf8"),
    ) as Workflow;
    const steps = workflow.jobs?.e2e?.steps ?? [];
    const buildStep = steps.find(
      (step) => step.name === "Build production app",
    );
    const testStep = steps.find((step) => step.name === "Run daily E2E");

    expect(workflow.on?.schedule).toEqual([{ cron: "0 10 * * *" }]);
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(testStep?.env).toMatchObject({
      CI_DAILY: "true",
      PLAYWRIGHT_PROFILE_LANE: "all",
    });
    expect(buildStep?.env).toMatchObject({
      SECURITY_HEADERS_ENABLED: "false",
    });

    expect(existsSync("tests/e2e/about-page-rendering.spec.ts")).toBe(true);
    expect(existsSync("tests/e2e/core-page-visual-calibration.spec.ts")).toBe(
      true,
    );
    expect(existsSync("tests/e2e/navigation.spec.ts")).toBe(true);
    expect(existsSync("tests/e2e/not-found-recovery.spec.ts")).toBe(true);
    expect(existsSync("tests/e2e/product-family-contact-handoff.spec.ts")).toBe(
      true,
    );
    expect(existsSync("tests/e2e/seo-validation.spec.ts")).toBe(true);
    expect(existsSync("tests/e2e/theme-persistence.spec.ts")).toBe(true);

    for (const spec of [
      "tests/e2e/about-page-rendering.spec.ts",
      "tests/e2e/core-page-visual-calibration.spec.ts",
      "tests/e2e/navigation.spec.ts",
      "tests/e2e/not-found-recovery.spec.ts",
      "tests/e2e/product-family-contact-handoff.spec.ts",
      "tests/e2e/seo-validation.spec.ts",
      "tests/e2e/theme-persistence.spec.ts",
    ]) {
      expect(testStep?.run, spec).toContain(spec);
    }
  });

  it("keeps the PR lead proof lane focused on the real pipeline test", () => {
    const workflow = yaml.load(
      readFileSync(".github/workflows/ci.yml", "utf8"),
    ) as Workflow;
    const steps = workflow.jobs?.tests?.steps ?? [];
    const leadProof = steps.find(
      (step) => step.name === "Lead API family proof",
    );

    expect(leadProof?.run).toBe(
      "pnpm vitest run tests/integration/api/lead-pipeline-real.test.ts",
    );
  });
});
