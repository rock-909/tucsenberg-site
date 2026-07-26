import { describe, expect, it } from "vitest";
const {
  classifyCommand,
  tokenizeShell,
} = require("../../../scripts/quality/checks/subcommand-lanes.js");

/**
 * The reconciler's whole value is that it does not fail open. Substring
 * matching would count a mention inside a comment — or a path in an `echo` —
 * as a lane, which reads as coverage while proving nothing. These pin the
 * cases that separate "runs it" from "names it".
 */

const PACKAGE_SCRIPTS = {
  "content:check": "node scripts/starter-checks.js translations",
  "type-check": "next typegen && tsc --noEmit",
};

function classify(shell: string) {
  return tokenizeShell(shell).map((tokens: string[]) =>
    classifyCommand(tokens, PACKAGE_SCRIPTS),
  );
}

describe("subcommand lane reconciler", () => {
  it("counts a real invocation", () => {
    expect(classify("node scripts/starter-checks.js brand")).toEqual([
      { subcommand: "brand" },
    ]);
  });

  it("counts the ./-prefixed spelling used in the deploy workflow", () => {
    expect(
      classify(
        'node ./scripts/starter-checks.js deployed-smoke --base-url "$X"',
      ),
    ).toEqual([{ subcommand: "deployed-smoke" }]);
  });

  it("steps over leading env assignments", () => {
    expect(
      classify("APP_ENV=preview node scripts/starter-checks.js brand"),
    ).toEqual([{ subcommand: "brand" }]);
  });

  it("does not count a shell comment that spells the whole command", () => {
    expect(classify("# node scripts/starter-checks.js brand")).toEqual([]);
  });

  it("does not count an existence test on the script path", () => {
    expect(classify("if [ ! -f ./scripts/starter-checks.js ]")).toEqual([{}]);
  });

  it("does not count the path appearing inside an echo", () => {
    expect(
      classify("echo Missing ./scripts/starter-checks.js in workflow checkout"),
    ).toEqual([{}]);
  });

  it("reports no subcommand when only flags follow the path", () => {
    expect(classify("node scripts/starter-checks.js --help")).toEqual([
      { subcommand: null },
    ]);
  });

  it("follows a package script by name so lanes can be indirect", () => {
    expect(classify("pnpm content:check")).toEqual([
      { packageScript: "content:check" },
    ]);
    expect(classify("pnpm run content:check")).toEqual([
      { packageScript: "content:check" },
    ]);
  });

  it("ignores runner calls that are not package scripts", () => {
    expect(classify("pnpm exec vitest run tests/unit")).toEqual([{}]);
  });

  it("splits chained commands so a later one is not swallowed", () => {
    expect(
      classify(
        "pnpm type-check && node scripts/starter-checks.js eslint-disable",
      ),
    ).toEqual([
      { packageScript: "type-check" },
      { subcommand: "eslint-disable" },
    ]);
  });
});
