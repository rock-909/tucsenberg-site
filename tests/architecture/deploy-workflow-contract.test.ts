import { readFileSync } from "node:fs";

import { load } from "js-yaml";
import { describe, expect, it } from "vitest";

interface DeployWorkflow {
  readonly concurrency?: {
    readonly group?: string;
    readonly "cancel-in-progress"?: boolean | string;
  };
  readonly jobs?: Record<
    string,
    {
      readonly needs?: string | readonly string[];
      readonly "continue-on-error"?: boolean;
      readonly steps?: readonly {
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
  it("runs preview proof against an explicit public preview URL without Cloudflare deploy secrets", () => {
    const workflow = readFileSync(
      ".github/workflows/cloudflare-deploy.yml",
      "utf8",
    );

    expect(workflow).toContain("preview_url:");
    expect(workflow).toMatch(
      /- name: 检查 Cloudflare 凭据\s+if:\s*\$\{\{\s*inputs\.environment == 'production'\s*\}\}/u,
    );
    expect(workflow).toContain('if [ -z "$PREVIEW_URL" ]; then');
    expect(workflow).toContain(
      'node scripts/starter-checks.js public-preview-smoke --base-url "${PREVIEW_URL}"',
    );
    expect(workflow).not.toContain(
      "node scripts/starter-checks.js cf-preview-deployed",
    );
  });

  it("guards production deployment to the main branch", () => {
    const workflow = readFileSync(
      ".github/workflows/cloudflare-deploy.yml",
      "utf8",
    );

    expect(workflow).toContain("阻断：production 只能从 main 部署");
    expect(workflow).toContain('if [ "${GITHUB_REF_NAME}" != "main" ]; then');
    expect(workflow).toContain("GITHUB_REF_NAME: ${{ github.ref_name }}");
    expect(workflow).toMatch(
      /if:\s*\$\{\{\s*inputs\.environment == 'production'\s*\}\}/u,
    );
  });

  it("passes public marketing verification config into production builds", () => {
    const workflow = readFileSync(
      ".github/workflows/cloudflare-deploy.yml",
      "utf8",
    );

    expect(workflow).toContain(
      "NEXT_PUBLIC_GA_MEASUREMENT_ID: ${{ vars.NEXT_PUBLIC_GA_MEASUREMENT_ID || secrets.NEXT_PUBLIC_GA_MEASUREMENT_ID }}",
    );
    expect(workflow).toContain(
      "GOOGLE_SITE_VERIFICATION: ${{ vars.GOOGLE_SITE_VERIFICATION || secrets.GOOGLE_SITE_VERIFICATION }}",
    );
  });

  it("runs the strict public-launch config gate before production deploy", () => {
    const workflow = readFileSync(
      ".github/workflows/cloudflare-deploy.yml",
      "utf8",
    );

    expect(workflow).toContain(
      "PUBLIC_LAUNCH_STRICT=true APP_ENV=production node scripts/starter-checks.js validate-production-config",
    );
    expect(workflow.indexOf("validate-production-config")).toBeLessThan(
      workflow.indexOf("部署到 Cloudflare Workers（production）"),
    );
  });

  it("uses wrangler production public vars before strict proof and build", () => {
    const workflow = readFileSync(
      ".github/workflows/cloudflare-deploy.yml",
      "utf8",
    );

    expect(workflow).toContain("导出 production public vars（wrangler）");
    expect(workflow).toContain("ts.parseConfigFileTextToJson");
    expect(workflow).toContain("NEXT_PUBLIC_SITE_URL");
    expect(workflow).toContain("NEXT_PUBLIC_BASE_URL");
    expect(
      workflow.indexOf("导出 production public vars（wrangler）"),
    ).toBeLessThan(workflow.indexOf("validate-production-config"));
    expect(workflow.indexOf("validate-production-config")).toBeLessThan(
      workflow.indexOf("pnpm release:verify"),
    );
    expect(workflow.indexOf("validate-production-config")).toBeLessThan(
      workflow.indexOf("pnpm website:build:cf"),
    );
  });
});

describe("Cloudflare deploy serialization contract", () => {
  it("lets preview cancel in progress but never cancels production", () => {
    const workflow = loadDeployWorkflow();

    // The concurrency group is per-environment, and cancellation is disabled
    // for production so a running production deploy runs through verification.
    expect(workflow.concurrency?.group).toContain("inputs.environment");
    expect(workflow.concurrency?.["cancel-in-progress"]).toBe(
      "${{ inputs.environment != 'production' }}",
    );
  });

  it("keeps post-deploy verification serialized after the deploy job", () => {
    const workflow = loadDeployWorkflow();

    expect(
      normalizeNeeds(workflow.jobs?.["post-deploy-verification"]?.needs),
    ).toContain("build-and-deploy");
  });

  it("locks the deployed smoke as the mandatory, non-optional health check", () => {
    const workflow = loadDeployWorkflow();
    const job = workflow.jobs?.["post-deploy-verification"];
    const healthStep = job?.steps?.find((step) => step.name === "健康检查");

    expect(healthStep?.run).toContain(
      'node ./scripts/starter-checks.js deployed-smoke --base-url "${{ needs.build-and-deploy.outputs.deployment_url }}"',
    );
    expect(job?.["continue-on-error"]).toBeUndefined();
    expect(healthStep?.["continue-on-error"]).toBeUndefined();
  });
});
