import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectClientBoundaryFiles,
  hasTopLevelUseClientDirective,
  runClientBoundaryBudgetCheck,
} from "../../../scripts/starter-checks.js";

const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-client-boundary-test-trash",
);

function createFixture(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "showcase-client-boundary-"),
  );

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.writeFileSync(fullPath, content, "utf8");
  }

  return rootDir;
}

function moveFixtureToTrash(rootDir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only checks the test-owned temporary fixture directory
  if (!fs.existsSync(rootDir)) return;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable os.tmpdir trash folder
  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  const targetDir = path.join(
    TEMP_TRASH_ROOT,
    `${path.basename(rootDir)}-${Date.now()}`,
  );

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture cleanup uses recoverable rename instead of permanent deletion
  fs.renameSync(rootDir, targetDir);
}

function writeBudget(
  rootDir: string,
  allowedClientBoundaries: string[],
  maxClientBoundaries = allowedClientBoundaries.length,
): void {
  const budgetPath = path.join(
    rootDir,
    "docs/proof/baselines/client-boundary-budget.json",
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
  fs.mkdirSync(path.dirname(budgetPath), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
  fs.writeFileSync(
    budgetPath,
    `${JSON.stringify(
      {
        version: 1,
        maxClientBoundaries,
        allowedClientBoundaries,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

function writeRawBudget(rootDir: string, content: string): void {
  const budgetPath = path.join(
    rootDir,
    "docs/proof/baselines/client-boundary-budget.json",
  );
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
  fs.mkdirSync(path.dirname(budgetPath), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
  fs.writeFileSync(budgetPath, content, "utf8");
}

describe("client-boundary-budget", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTrash(rootDir);
    }
  });

  it("detects top-level use client directives only", () => {
    const rootDir = createFixture({
      "src/components/interactive.tsx": '"use client";\nexport const A = 1;',
      "src/components/single-quote.tsx": "'use client';\nexport const B = 1;",
      "src/components/with-comment.tsx":
        '/** interactive island */\n"use client";\nexport const Commented = 1;',
      "src/components/server.tsx":
        "const marker = 'use client';\nexport const C = 1;",
      "src/components/comment.tsx":
        '// "use client" should not count\nexport const D = 1;',
    });
    fixtureRoots.push(rootDir);

    expect(collectClientBoundaryFiles(rootDir)).toEqual([
      "src/components/interactive.tsx",
      "src/components/single-quote.tsx",
      "src/components/with-comment.tsx",
    ]);
  });

  it("uses Babel directives instead of comments or later strings", () => {
    expect(
      hasTopLevelUseClientDirective('"use client";\nexport const A = 1;'),
    ).toBe(true);
    expect(
      hasTopLevelUseClientDirective(
        'export const text = "use client";\nexport const A = 1;',
      ),
    ).toBe(false);
    expect(
      hasTopLevelUseClientDirective(
        '// "use client"\nexport const text = "server";',
      ),
    ).toBe(false);
  });

  it("excludes tests specs stories mocks fixtures and test utilities", () => {
    const rootDir = createFixture({
      "src/components/live.tsx": '"use client";\nexport const Live = 1;',
      "src/components/live.test.tsx": '"use client";\nexport const Test = 1;',
      "src/components/live.spec.tsx": '"use client";\nexport const Spec = 1;',
      "src/components/live.stories.tsx":
        '"use client";\nexport const Story = 1;',
      "src/components/live.story.tsx": '"use client";\nexport const Story = 1;',
      "src/components/stories/live.tsx":
        '"use client";\nexport const StoryDir = 1;',
      "src/components/storybook/preview.tsx":
        '"use client";\nexport const StorybookPreview = 1;',
      "src/components/.storybook/preview.tsx":
        '"use client";\nexport const DotStorybookPreview = 1;',
      "src/components/mocks/live.tsx":
        '"use client";\nexport const MockDir = 1;',
      "src/components/__tests__/nested.tsx":
        '"use client";\nexport const Nested = 1;',
      "src/components/__mocks__/mock.tsx":
        '"use client";\nexport const Mock = 1;',
      "src/components/__fixtures__/fixture.tsx":
        '"use client";\nexport const Fixture = 1;',
      "src/components/widget.mock.tsx":
        '"use client";\nexport const MockFile = 1;',
      "src/test/helper.tsx": '"use client";\nexport const Helper = 1;',
      "src/testing/render.tsx": '"use client";\nexport const Render = 1;',
    });
    fixtureRoots.push(rootDir);

    expect(collectClientBoundaryFiles(rootDir)).toEqual([
      "src/components/live.tsx",
    ]);
  });

  it("passes when all detected files are allowed and writes a report", () => {
    const rootDir = createFixture({
      "src/components/live.tsx": '"use client";\nexport const Live = 1;',
    });
    fixtureRoots.push(rootDir);
    writeBudget(rootDir, ["src/components/live.tsx"]);

    const result = runClientBoundaryBudgetCheck(rootDir);

    expect(result.status).toBe("passed");
    expect(result.unexpectedClientBoundaries).toEqual([]);
    expect(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- report path is inside a test-owned temporary fixture directory
      fs.existsSync(
        path.join(rootDir, "reports/quality/client-boundary-budget.json"),
      ),
    ).toBe(true);
  });

  it("fails and names unexpected client boundaries", () => {
    const rootDir = createFixture({
      "src/components/live.tsx": '"use client";\nexport const Live = 1;',
      "src/components/new-widget.tsx":
        '"use client";\nexport const Widget = 1;',
    });
    fixtureRoots.push(rootDir);
    writeBudget(rootDir, ["src/components/live.tsx"], 2);

    const result = runClientBoundaryBudgetCheck(rootDir);

    expect(result.status).toBe("failed");
    expect(result.unexpectedClientBoundaries).toEqual([
      "src/components/new-widget.tsx",
    ]);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "unexpected-client-boundary",
          file: "src/components/new-widget.tsx",
        }),
      ]),
    );
  });

  it("fails when the detected count exceeds the budget", () => {
    const rootDir = createFixture({
      "src/components/one.tsx": '"use client";\nexport const One = 1;',
      "src/components/two.tsx": '"use client";\nexport const Two = 1;',
    });
    fixtureRoots.push(rootDir);
    writeBudget(
      rootDir,
      ["src/components/one.tsx", "src/components/two.tsx"],
      1,
    );

    const result = runClientBoundaryBudgetCheck(rootDir);

    expect(result.status).toBe("failed");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "budget-exceeded",
        }),
      ]),
    );
  });

  it("fails and names stale budget entries that are no longer client boundaries", () => {
    const rootDir = createFixture({
      "src/components/live.tsx": '"use client";\nexport const Live = 1;',
      "src/components/removed.tsx": "export const Removed = 1;",
    });
    fixtureRoots.push(rootDir);
    writeBudget(rootDir, [
      "src/components/live.tsx",
      "src/components/removed.tsx",
    ]);

    const result = runClientBoundaryBudgetCheck(rootDir);

    expect(result.status).toBe("failed");
    expect(result.staleClientBoundaries).toEqual([
      "src/components/removed.tsx",
    ]);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "stale-client-boundary",
          file: "src/components/removed.tsx",
        }),
      ]),
    );
  });

  it("fails when the budget file is missing", () => {
    const rootDir = createFixture({
      "src/components/live.tsx": '"use client";\nexport const Live = 1;',
    });
    fixtureRoots.push(rootDir);

    const result = runClientBoundaryBudgetCheck(rootDir);

    expect(result.status).toBe("failed");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "budget-missing",
          file: "docs/proof/baselines/client-boundary-budget.json",
        }),
      ]),
    );
  });

  it("fails when the budget file shape is invalid", () => {
    const rootDir = createFixture({
      "src/components/live.tsx": '"use client";\nexport const Live = 1;',
    });
    fixtureRoots.push(rootDir);
    writeRawBudget(rootDir, JSON.stringify({ version: 1 }));

    const result = runClientBoundaryBudgetCheck(rootDir);

    expect(result.status).toBe("failed");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "budget-invalid",
          file: "docs/proof/baselines/client-boundary-budget.json",
        }),
      ]),
    );
  });

  it("fails when the budget file is not valid JSON", () => {
    const rootDir = createFixture({
      "src/components/live.tsx": '"use client";\nexport const Live = 1;',
    });
    fixtureRoots.push(rootDir);
    writeRawBudget(rootDir, "{not-json");

    const result = runClientBoundaryBudgetCheck(rootDir);

    expect(result.status).toBe("failed");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "budget-invalid-json",
          file: "docs/proof/baselines/client-boundary-budget.json",
        }),
      ]),
    );
  });
});
