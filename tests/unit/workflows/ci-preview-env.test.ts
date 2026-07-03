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
  it("runs Cloudflare build proof against a public preview URL, not the launch domain", () => {
    const workflow = readCiWorkflow();
    const cloudflareBuildSteps = workflow.jobs?.["cloudflare-build"]?.steps;
    const previewSiteUrl =
      "${{ vars.CLOUDFLARE_PREVIEW_URL || 'https://tucsenberg-site-preview.workers.dev' }}";

    for (const stepName of [
      "构建检查",
      "Cloudflare/OpenNext 构建",
      "Cloudflare/Wrangler dry-run",
    ]) {
      const step = cloudflareBuildSteps?.find(
        (candidate) => candidate.name === stepName,
      );

      expect(step?.env?.APP_ENV, stepName).toBe("preview");
      expect(step?.env?.NEXT_PUBLIC_SITE_URL, stepName).toBe(previewSiteUrl);
      expect(step?.env?.NEXT_PUBLIC_SITE_URL, stepName).not.toContain(
        "example.com",
      );
      expect(step?.env?.NEXT_PUBLIC_SITE_URL, stepName).not.toContain(
        "tucsenberg.com",
      );
    }
  });
});
