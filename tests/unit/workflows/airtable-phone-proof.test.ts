import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const WORKFLOW_PATH = ".github/workflows/airtable-phone-proof.yml";
const PROOF_TEST_PATH =
  "tests/integration/api/airtable-phone-column-direct-proof.test.ts";

interface WorkflowStep {
  readonly name?: string;
  readonly id?: string;
  readonly run?: string;
  readonly uses?: string;
  readonly with?: Record<string, string>;
  readonly env?: Record<string, string>;
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

describe("Airtable phone proof workflow", () => {
  it("is manual-only with minimal permissions and dispatch checkout ref", () => {
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
      ref: "${{ github.ref }}",
      "persist-credentials": false,
    });
  });

  it("checks the proof test file, then runs the fixed vitest command with proof env", () => {
    const verifyTest = requireStep(
      (step) => step.name === "Verify proof test exists",
    );
    const proofStep = requireStep(
      (step) => step.name === "Run Airtable phone column proof",
    );
    const summaryStep = requireStep(
      (step) => step.name === "Record proof result",
    );

    expect(verifyTest.run).toContain(PROOF_TEST_PATH);
    expect(proofStep.run).toContain(
      "pnpm exec vitest run tests/integration/api/airtable-phone-column-direct-proof.test.ts --reporter=verbose",
    );
    expect(proofStep.env).toMatchObject({
      AIRTABLE_PHONE_PROOF: "1",
      AIRTABLE_API_KEY: "${{ secrets.AIRTABLE_API_KEY }}",
      AIRTABLE_BASE_ID: "${{ secrets.AIRTABLE_BASE_ID }}",
      AIRTABLE_TABLE_NAME: "${{ inputs.airtable_table_name }}",
    });
    expect(summaryStep.run).toContain("github.sha");
    expect(summaryStep.run).toContain("github.ref");
    expect(summaryStep.run).toContain("inputs.airtable_table_name");
    expect(summaryStep.run).not.toMatch(
      /record id|AIRTABLE_API_KEY|AIRTABLE_BASE_ID/iu,
    );
  });
});
