import { afterEach, describe, expect, it } from "vitest";
import {
  baseFiles,
  createFixture,
  expectFinding,
  moveFixtureToTrash,
} from "./component-governance-check.helpers";

const starterChecksFacade = require("../../../scripts/starter-checks.js");
const { collectComponentGovernanceFindings } = starterChecksFacade;

describe("component-governance-check C1 closure gaps", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTrash(rootDir);
    }
  });

  it("detects module.require CommonJS property-access forms", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/lib/module-require.ts":
          'const theme = module.require("@radix-ui/themes");\nexport { theme };',
        "src/lib/module-require-wrapped.ts":
          'const theme = (module as NodeModule).require("@radix-ui/themes");\nexport { theme };',
        "src/lib/module-element-require.ts":
          'const theme = module["require"]("@radix-ui/themes");\nexport { theme };',
        "src/components/layout/module-require-dialog.tsx":
          'const dialog = module.require("@radix-ui/react-dialog");\nexport { dialog };',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    for (const file of [
      "src/lib/module-require.ts",
      "src/lib/module-require-wrapped.ts",
      "src/lib/module-element-require.ts",
    ]) {
      expectFinding(result.errors, "radix-themes-import-forbidden", file);
    }
    expectFinding(
      result.errors,
      "radix-import-outside-ui",
      "src/components/layout/module-require-dialog.tsx",
    );
  });

  it("fails on Radix Themes internal classes outside app and components trees", () => {
    const rootDir = createFixture(
      baseFiles({
        "src/config/ui-class-truth.ts":
          'export const cardClass = "rt-Card rt-r-size-2";\n',
        "src/lib/ui-class-helpers.ts":
          'export const dialClass = "rt-BaseButton";\n',
      }),
    );
    fixtureRoots.push(rootDir);

    const result = collectComponentGovernanceFindings(rootDir);

    expect(result.status).toBe("failed");
    expectFinding(
      result.errors,
      "radix-themes-internal-class",
      "src/config/ui-class-truth.ts",
    );
    expectFinding(
      result.errors,
      "radix-themes-internal-class",
      "src/lib/ui-class-helpers.ts",
    );
  });
});
