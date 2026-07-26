import { describe, expect, it } from "vitest";
const {
  classifyCommand,
  collectLefthookRunStrings,
  collectWorkflowRunStrings,
  tokenizeShell,
} = require("../../../scripts/quality/checks/subcommand-lanes.js");

/**
 * The reconciler's whole value is that it does not fail open. Everything below
 * separates "a lane runs it" from "some text says its name". The second half
 * of the list came out of an adversarial review that turned the first version
 * green six different ways without wiring a single lane.
 */

const PACKAGE_SCRIPTS = {
  "content:check": "node scripts/starter-checks.js translations",
  "type-check": "next typegen && tsc --noEmit",
  run: "node scripts/starter-checks.js brand",
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

  // `node --check x.js sub` 只解析文件不执行，`-e` / `-p` 根本不读它。没有一份
  // flag 名单能一直判对，所以任何 flag 都按"判不准"处理，落进 orphan 桶。
  it("refuses to classify a node command carrying flags", () => {
    expect(classify("node --check scripts/starter-checks.js brand")).toEqual([
      {},
    ]);
    expect(
      classify("node --trace-warnings scripts/starter-checks.js brand"),
    ).toEqual([{}]);
  });

  it("does not count a shell comment that spells the whole command", () => {
    expect(classify("# node scripts/starter-checks.js brand")).toEqual([]);
  });

  // 注释里再塞一个 `;`。只写 `echo ok # node ...` 证明不了注释真被剥掉：
  // 首 token 是 echo，整行本来就不计数，把剥注释整个删掉这条也照样绿。
  it("does not count a command hidden behind a trailing comment", () => {
    expect(
      classify("echo ok # harmless; node scripts/starter-checks.js brand"),
    ).toEqual([{}]);
  });

  // 引号里的 `;` `&&` 是字符串内容。按原字符切开的话，一条 echo 就能凭空造出
  // 任意多条车道，步骤退出 0，门变绿。
  it("does not split on separators inside quotes", () => {
    expect(
      classify('echo "harmless; node scripts/starter-checks.js brand"'),
    ).toEqual([{}]);
    expect(
      classify('echo "x && node scripts/starter-checks.js brand"'),
    ).toEqual([{}]);
  });

  // 引号里的 `#` 也是内容：真正的子命令名是 `brand # fake`，它不在注册表里，
  // 会落进 unknown 桶把门撞红——而不是被当成 `brand` 算作已覆盖。
  it("keeps a quoted hash inside the subcommand name", () => {
    expect(
      classify('node scripts/starter-checks.js "brand # fake" || true'),
    ).toEqual([{ subcommand: "brand # fake" }, {}]);
  });

  // 一行开两个 heredoc。只记住第一个 delimiter 的话，第二段正文会被当命令读。
  it("does not count the body of a second heredoc opened on the same line", () => {
    expect(
      classify(
        [
          "cat <<A <<B",
          "payload",
          "A",
          "node scripts/starter-checks.js brand",
          "B",
        ].join("\n"),
      ),
    ).toEqual([{}]);
  });

  // 注释里的 `\` 是注释内容，不续行。拼上去等于把下一行的真调用一起吃掉。
  it("does not let a comment's backslash swallow the next line", () => {
    expect(
      classify("# comment \\\nnode scripts/starter-checks.js brand"),
    ).toEqual([{ subcommand: "brand" }]);
  });

  it("does not count an existence test on the script path", () => {
    expect(classify("if [ ! -f ./scripts/starter-checks.js ]")).toEqual([{}]);
  });

  it("does not count the path appearing inside an echo", () => {
    expect(
      classify("echo Missing ./scripts/starter-checks.js in workflow checkout"),
    ).toEqual([{}]);
  });

  // 这条是审查里最便宜的一种作假：把真调用改成打印同一行字，步骤照样退出 0。
  it("does not count a quoted command printed by echo", () => {
    expect(
      classify('echo "node scripts/starter-checks.js markdown-fences"'),
    ).toEqual([{}]);
  });

  it("does not count a heredoc body", () => {
    expect(
      classify(
        ["cat <<'EOF'", "node scripts/starter-checks.js brand", "EOF"].join(
          "\n",
        ),
      ),
    ).toEqual([{}]);
  });

  it("does not count a branch the operator makes unreachable", () => {
    expect(classify("true || node scripts/starter-checks.js brand")).toEqual([
      {},
    ]);
    expect(classify("false && node scripts/starter-checks.js brand")).toEqual([
      {},
    ]);
  });

  it("joins a continuation line instead of reading the backslash as a subcommand", () => {
    expect(classify("node scripts/starter-checks.js \\\n  brand")).toEqual([
      { subcommand: "brand" },
    ]);
  });

  it("reports no subcommand when only flags follow the path", () => {
    expect(classify("node scripts/starter-checks.js --help")).toEqual([{}]);
  });

  it("follows a package script by name so lanes can be indirect", () => {
    expect(classify("pnpm content:check")).toEqual([
      { packageScript: "content:check" },
    ]);
    expect(classify("pnpm run content:check")).toEqual([
      { packageScript: "content:check" },
    ]);
  });

  it("reads the script name after `run` literally, even when it is `run`", () => {
    expect(classify("pnpm run run")).toEqual([{ packageScript: "run" }]);
  });

  // `pnpm --store-dir content:check --version` 里 content:check 是 flag 的值，
  // 什么都没跑。带值 flag 的名单在 pnpm / npm / yarn 之间不可能同时正确
  // （`-w` 在 pnpm 是布尔、在 npm 带值），判不准就不算车道。
  it("refuses to classify a runner command carrying flags", () => {
    expect(classify("pnpm --store-dir content:check --version")).toEqual([{}]);
    expect(classify("npm --prefix content:check --version")).toEqual([{}]);
    expect(classify("pnpm -w content:check")).toEqual([{}]);
    expect(classify("pnpm --filter web content:check")).toEqual([{}]);
  });

  // `pnpm exec x` 跑的是名叫 x 的可执行文件，不是 package script x。
  it("does not treat an exec'd binary as a package script of the same name", () => {
    expect(classify("pnpm exec content:check")).toEqual([{}]);
    expect(classify("npx content:check")).toEqual([{}]);
  });

  it("still follows a real node call made through exec", () => {
    expect(classify("pnpm exec node scripts/starter-checks.js brand")).toEqual([
      { subcommand: "brand" },
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

describe("lane collection reads command positions, not any key named run", () => {
  it("reads workflow step commands", () => {
    expect(
      collectWorkflowRunStrings({
        jobs: { quality: { steps: [{ run: "node x.js brand" }] } },
      }),
    ).toEqual(["node x.js brand"]);
  });

  // 顶层 env 里放一个叫 run 的变量什么都不会执行，早先的版本把它当命令。
  it("ignores a `run` key that is not a step command", () => {
    expect(
      collectWorkflowRunStrings({
        env: { run: "node x.js brand" },
        jobs: {
          quality: {
            env: { run: "node x.js brand" },
            steps: [
              { uses: "actions/checkout@v4", with: { run: "node x.js" } },
            ],
          },
        },
      }),
    ).toEqual([]);
  });

  it("ignores a step whose condition can never be true", () => {
    expect(
      collectWorkflowRunStrings({
        jobs: {
          quality: {
            steps: [
              { if: "${{ false }}", run: "node x.js brand" },
              { if: false, run: "node x.js translations" },
            ],
          },
        },
      }),
    ).toEqual([]);
  });

  it("keeps a step whose condition is a real expression", () => {
    expect(
      collectWorkflowRunStrings({
        jobs: {
          quality: {
            steps: [
              {
                if: "${{ inputs.environment == 'production' }}",
                run: "node x",
              },
            ],
          },
        },
      }),
    ).toEqual(["node x"]);
  });

  it("reads lefthook hook commands", () => {
    expect(
      collectLefthookRunStrings({
        "pre-push": {
          parallel: true,
          commands: { lint: { run: "pnpm lint" } },
        },
      }),
    ).toEqual(["pnpm lint"]);
  });
});
