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

function expectPreviewStepEnv(
  step: WorkflowStep | undefined,
  stepName: string,
): void {
  const previewSiteUrl =
    "${{ vars.CLOUDFLARE_PREVIEW_URL || 'https://tucsenberg-site-preview.faints-pudgier-9r.workers.dev' }}";
  const gaMeasurementId =
    "${{ vars.NEXT_PUBLIC_GA_MEASUREMENT_ID || secrets.NEXT_PUBLIC_GA_MEASUREMENT_ID }}";
  const googleSiteVerification =
    "${{ vars.GOOGLE_SITE_VERIFICATION || secrets.GOOGLE_SITE_VERIFICATION }}";
  const turnstileSiteKey =
    "${{ vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY || secrets.NEXT_PUBLIC_TURNSTILE_SITE_KEY }}";

  expect(step?.env?.APP_ENV, stepName).toBe("preview");
  expect(step?.env?.NEXT_PUBLIC_SITE_URL, stepName).toBe(previewSiteUrl);
  expect(step?.env?.NEXT_PUBLIC_GA_MEASUREMENT_ID, stepName).toBe(
    gaMeasurementId,
  );
  expect(step?.env?.GOOGLE_SITE_VERIFICATION, stepName).toBe(
    googleSiteVerification,
  );
  expect(step?.env?.NEXT_PUBLIC_TURNSTILE_SITE_KEY, stepName).toBe(
    turnstileSiteKey,
  );
  expect(step?.env?.NEXT_PUBLIC_SITE_URL, stepName).not.toContain(
    "example.com",
  );
  expect(step?.env?.NEXT_PUBLIC_SITE_URL, stepName).not.toContain(
    "tucsenberg.com",
  );
}

describe("CI preview environment contract", () => {
  it("runs Cloudflare build proof against a public preview URL, not the launch domain", () => {
    const workflow = readCiWorkflow();
    const cloudflareBuildSteps = workflow.jobs?.["cloudflare-build"]?.steps;

    for (const stepName of [
      "构建检查",
      "Cloudflare/OpenNext 构建",
      "Cloudflare/Wrangler dry-run",
    ]) {
      const step = cloudflareBuildSteps?.find(
        (candidate) => candidate.name === stepName,
      );

      expectPreviewStepEnv(step, stepName);
    }
  });
});
