import { describe, expect, it } from "vitest";
import {
  analyzeSource,
  collectRegisteredGuardrailExceptionIds,
} from "../../../scripts/starter-checks.js";

const REGISTER_WITH_CONTACT_EXCEPTION = `
# Guardrail Side Effects Register

## Active production structural exceptions

| ID | File | Rule(s) | Real boundary preserved | Why exception is better than split | Verification |
|----|------|---------|-------------------------|------------------------------------|--------------|
| GSE-20260428-contact-flow | src/app/[locale]/contact/page.tsx | max-lines-per-function | route orchestration | Keeping the order visible is safer than helper piles. | page tests |
`;

const REGISTER_WITH_HISTORICAL_EXCEPTION = `
# Guardrail Side Effects Register

## Active production structural exceptions

| ID | File | Rule(s) | Real boundary preserved | Why exception is better than split | Verification |
|----|------|---------|-------------------------|------------------------------------|--------------|
| GSE-20260428-contact-flow | src/app/[locale]/contact/page.tsx | max-lines-per-function | route orchestration | Keeping the order visible is safer than helper piles. | page tests |

## Confirmed side effects

| Area | Triggering rule | Evidence |
|------|-----------------|----------|
| Historical page | max-lines-per-function | GSE-20260428-old-flow |
`;

describe("check-eslint-disable-usage guardrail exceptions", () => {
  it("allows a registered production structural guardrail exception", () => {
    const findings = analyzeSource(
      "src/app/[locale]/contact/page.tsx",
      `
// eslint-disable-next-line max-lines-per-function -- guardrail-exception GSE-20260428-contact-flow: route orchestration keeps request-to-render order visible
export default function ContactPage() {
  return null;
}
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([]);
  });

  it("matches guardrail exception IDs case-insensitively", () => {
    const findings = analyzeSource(
      "src/app/[locale]/contact/page.tsx",
      `
// eslint-disable-next-line max-lines-per-function -- guardrail-exception GSE-20260428-CONTACT-FLOW: route orchestration keeps request-to-render order visible
export default function ContactPage() {
  return null;
}
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([]);
  });

  it("ignores historical IDs outside the active exception section", () => {
    const findings = analyzeSource(
      "src/app/[locale]/contact/page.tsx",
      `
// eslint-disable-next-line max-lines-per-function -- guardrail-exception GSE-20260428-old-flow: archived example should not validate active production code
export default function ContactPage() {
  return null;
}
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_HISTORICAL_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        violations: expect.arrayContaining([
          expect.stringContaining("unregistered guardrail exception id"),
        ]),
      }),
    ]);
  });

  it("flags a production structural guardrail disable without exception id", () => {
    const findings = analyzeSource(
      "src/app/[locale]/contact/page.tsx",
      `
// eslint-disable-next-line max-lines-per-function -- route orchestration keeps request-to-render order visible
export default function ContactPage() {
  return null;
}
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        violations: expect.arrayContaining([
          expect.stringContaining("missing guardrail exception id"),
        ]),
      }),
    ]);
  });

  it("flags an unregistered production structural guardrail exception id", () => {
    const findings = analyzeSource(
      "src/app/[locale]/contact/page.tsx",
      `
// eslint-disable-next-line max-lines-per-function -- guardrail-exception GSE-20260428-missing-flow: route orchestration keeps request-to-render order visible
export default function ContactPage() {
  return null;
}
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        violations: expect.arrayContaining([
          expect.stringContaining("unregistered guardrail exception id"),
        ]),
      }),
    ]);
  });

  it("does not require registry entries for ordinary production disables", () => {
    const findings = analyzeSource(
      "src/lib/content-validation.ts",
      `
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- value is validated before this branch
const value = parsed.data.value!;
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([]);
  });

  it.each([
    ["config file", "some.config.ts"],
    ["component dev-tools file", "src/components/dev-tools/example.tsx"],
    ["app dev-tools route", "src/app/[locale]/dev-tools/page.tsx"],
  ])(
    "does not require guardrail registry entries for %s",
    (_label, filePath) => {
      const findings = analyzeSource(
        filePath,
        `
// eslint-disable-next-line max-lines-per-function -- local tooling flow stays readable in one place
export function Example() {
  return null;
}
      `,
        {
          registeredGuardrailExceptionIds:
            collectRegisteredGuardrailExceptionIds(
              REGISTER_WITH_CONTACT_EXCEPTION,
            ),
        },
      );

      expect(findings).toEqual([]);
    },
  );

  it("detects trailing-comment eslint-disable directives", () => {
    const findings = analyzeSource(
      "src/lib/example.ts",
      `
export const value = 1; // eslint-disable-line no-unused-vars
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings.length).toBeGreaterThan(0);
    expect(
      findings.some(
        (finding) =>
          finding.directive === "eslint-disable-line" &&
          finding.violations.includes("missing production-code reason"),
      ),
    ).toBe(true);
  });

  it("detects trailing eslint-disable after a URL string", () => {
    const findings = analyzeSource(
      "src/lib/example.ts",
      `
export const url = "https://example.com"; // eslint-disable-line no-unused-vars
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        directive: "eslint-disable-line",
        violations: ["missing production-code reason"],
      }),
    ]);
  });

  it("detects trailing block-comment eslint-disable after a URL string", () => {
    const findings = analyzeSource(
      "src/lib/example.ts",
      `
export const url = "https://example.com"; /* eslint-disable-line no-unused-vars */
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        directive: "eslint-disable-line",
        violations: ["missing production-code reason"],
      }),
    ]);
  });

  it("detects trailing eslint-disable after a regex literal", () => {
    const findings = analyzeSource(
      "src/lib/example.ts",
      `
export const x = /https?:\\/\\//; // eslint-disable-line no-unused-vars
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        directive: "eslint-disable-line",
        violations: ["missing production-code reason"],
      }),
    ]);
  });

  it("allows trailing eslint-disable with a production reason", () => {
    const findings = analyzeSource(
      "src/lib/example.ts",
      `
export const value = 1; // eslint-disable-line no-unused-vars -- retained for intentional fixture escape
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([]);
  });

  it("detects real trailing eslint-disable after a prior directive-looking string", () => {
    const findings = analyzeSource(
      "src/lib/example.ts",
      `
export const text = "eslint-disable"; // eslint-disable-line no-unused-vars
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([
      expect.objectContaining({
        directive: "eslint-disable-line",
        violations: ["missing production-code reason"],
      }),
    ]);
  });

  it("ignores eslint-disable text that only appears inside a string", () => {
    const findings = analyzeSource(
      "src/lib/example.ts",
      `
export const text = "// eslint-disable-line no-unused-vars";
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([]);
  });

  it("does not require guardrail registry entries for test files", () => {
    const findings = analyzeSource(
      "src/lib/security/__tests__/distributed-rate-limit.test.ts",
      `
/* eslint-disable max-lines, max-lines-per-function -- backend matrix stays in one file */
describe("matrix", () => {});
      `,
      {
        registeredGuardrailExceptionIds: collectRegisteredGuardrailExceptionIds(
          REGISTER_WITH_CONTACT_EXCEPTION,
        ),
      },
    );

    expect(findings).toEqual([]);
  });
});
