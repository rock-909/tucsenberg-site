import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const WORKFLOW_PATH = ".github/workflows/airtable-phone-proof.yml";
const PROOF_TEST_PATH =
  "tests/integration/api/airtable-phone-column-direct-proof.test.ts";
const SUMMARY_SCRIPT_PATH =
  "scripts/workflows/write-airtable-phone-proof-summary.mjs";

interface WorkflowStep {
  readonly name?: string;
  readonly id?: string;
  readonly run?: string;
  readonly uses?: string;
  readonly with?: Record<string, string>;
  readonly env?: Record<string, string>;
  readonly if?: string;
}

interface AirtablePhoneProofWorkflow {
  readonly on?: Record<string, unknown>;
  readonly permissions?: Record<string, string>;
  readonly jobs?: {
    readonly proof?: {
      readonly steps?: readonly WorkflowStep[];
    };
  };
}

const workflow = yaml.load(
  readFileSync(WORKFLOW_PATH, "utf8"),
) as AirtablePhoneProofWorkflow;
const steps = workflow.jobs?.proof?.steps ?? [];

function requireStep(predicate: (step: WorkflowStep) => boolean): WorkflowStep {
  const step = steps.find(predicate);
  if (!step) {
    throw new Error("Required Airtable phone proof workflow step is missing");
  }
  return step;
}

function collectRunSteps(): WorkflowStep[] {
  return steps.filter((step) => typeof step.run === "string");
}

describe("Airtable phone proof workflow", () => {
  it("is manual-only with minimal permissions and exact-SHA checkout ref", () => {
    expect(Object.keys(workflow.on ?? {})).toEqual(["workflow_dispatch"]);
    expect(workflow.on?.workflow_dispatch).toMatchObject({
      inputs: {
        airtable_table_name: {
          type: "string",
          default: "Contacts",
          required: true,
        },
      },
    });
    expect(workflow.permissions).toEqual({ contents: "read" });

    const checkout = requireStep((step) => step.uses === "actions/checkout@v6");
    expect(checkout.with).toMatchObject({
      ref: "${{ github.sha }}",
      "persist-credentials": false,
    });
  });

  it("runs the fixed vitest command with proof env", () => {
    const proofStep = requireStep(
      (step) => step.name === "Run Airtable phone column proof",
    );

    expect(proofStep.run).toContain(
      "pnpm exec vitest run tests/integration/api/airtable-phone-column-direct-proof.test.ts --reporter=verbose",
    );
    expect(proofStep.run).toContain(PROOF_TEST_PATH);
    expect(proofStep.env).toMatchObject({
      AIRTABLE_PHONE_PROOF: "1",
      AIRTABLE_API_KEY: "${{ secrets.AIRTABLE_API_KEY }}",
      AIRTABLE_BASE_ID: "${{ secrets.AIRTABLE_BASE_ID }}",
      AIRTABLE_TABLE_NAME: "${{ inputs.airtable_table_name }}",
    });
    expect(proofStep.id).toBe("proof");
  });

  it("keeps workflow expressions out of every run script body", () => {
    for (const step of collectRunSteps()) {
      expect(step.run, step.name).not.toMatch(/\$\{\{/u);
    }
  });

  it("records proof results through env-backed Node summary writer", () => {
    const summaryStep = requireStep(
      (step) => step.name === "Record proof result",
    );

    expect(summaryStep.if).toBe("always()");
    expect(summaryStep.run).toBe(`node ${SUMMARY_SCRIPT_PATH}`);
    expect(summaryStep.env).toMatchObject({
      PROOF_SUMMARY_REF: "${{ github.ref }}",
      PROOF_SUMMARY_SHA: "${{ github.sha }}",
      PROOF_SUMMARY_TABLE: "${{ inputs.airtable_table_name }}",
      PROOF_OUTCOME: "${{ steps.proof.outcome }}",
    });
    expect(summaryStep.run).not.toMatch(
      /record id|AIRTABLE_API_KEY|AIRTABLE_BASE_ID|api response/iu,
    );
  });
});
