/**
 * Reconciles every `scripts/starter-checks.js` subcommand against the lanes
 * that invoke it.
 *
 * A check nobody runs is identical to a check that does not exist, except that
 * it reads as coverage. `markdown-fences` sat like that for months and was only
 * found by grepping all twenty subcommands by hand.
 *
 * WHAT THIS PROVES, EXACTLY: the subcommand appears in command position inside
 * a structurally identified lane — a workflow step's `run:`, a lefthook
 * command's `run:`, or a release-proof-manifest step. It does not observe
 * runtime execution, so a step guarded by a real `if:` condition still counts
 * as a lane; only a literally-false condition is rejected.
 *
 * The first version of this check counted anything that looked like a call:
 * any YAML key named `run` anywhere in the document, `echo "node
 * scripts/starter-checks.js foo"`, a heredoc body, a runbook string for a human
 * to type. Every one of those is a way to turn the gate green without wiring a
 * lane, which is the exact failure the gate exists to prevent. So:
 *
 * - Only `jobs.*.steps[].run` and lefthook `<hook>.commands.*.run` are read.
 *   A key named `run` sitting in `env:` or `with:` is not a command.
 * - A command counts only when the executor is in command position. `echo
 *   "node scripts/starter-checks.js x"` starts with `echo`, so it is text.
 * - Heredoc bodies, line-continuation joins and trailing `#` comments are
 *   handled before tokenizing, so data does not read as commands.
 * - Manual runbook lanes are reported in their own bucket. A human being told
 *   to type a command is a lane, but it is not an automated one, and the two
 *   must not be printed as the same thing.
 * - `pnpm run x` runs package script `x`; `pnpm exec x` / `npx x` run a binary
 *   named `x`. Conflating them invents lanes that do not exist.
 *
 * Known blind spots, all of which fail closed (a real call is missed and gets
 * reported as an orphan, rather than a fake call passing): command
 * substitution `$(...)`, backticks, `xargs`, and multiplexers like
 * `concurrently "node a" "node b"`.
 */

const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");
const yaml = require("js-yaml");

const WORKFLOW_DIR = ".github/workflows";
const LEFTHOOK_CONFIG = "lefthook.yml";
const PACKAGE_JSON = "package.json";
const STARTER_CHECKS_PATH = "scripts/starter-checks.js";
const NODE_EXECUTORS = new Set(["node"]);
const PACKAGE_RUNNERS = new Set(["pnpm", "npm", "yarn"]);
// Run a binary, not a package script. `pnpm exec node x.js` is still a real
// call, so the rest of the command is re-read as a command of its own.
const BINARY_RUNNERS = new Set(["npx", "bunx"]);
const RUNNER_EXEC_WORDS = new Set(["exec", "dlx"]);
// Runner flags that swallow the next token: `pnpm --filter web build`.
const RUNNER_VALUE_FLAGS = new Set(["--filter", "-F", "--dir", "-C", "-w"]);
const ENV_ASSIGNMENT = /^[A-Z_][A-Z0-9_]*=/u;
const HEREDOC_START = /<<-?\s*["']?([A-Za-z_][A-Za-z0-9_]*)["']?/u;

function readRepoFile(relativePath) {
  return readFileSync(relativePath, "utf8");
}

/** A step or job condition that can never be true, so it is not a lane. */
function isLiteralFalse(condition) {
  if (condition === false) return true;
  if (typeof condition !== "string") return false;

  return /^\s*(\$\{\{)?\s*false\s*(\}\})?\s*$/u.test(condition);
}

/** Drop heredoc bodies and join continuation lines, before anything is split. */
function normalizeShellLines(shellText) {
  const lines = [];
  let pending = "";
  let heredocDelimiter = null;

  for (const rawLine of shellText.split("\n")) {
    if (heredocDelimiter !== null) {
      if (rawLine.trim() === heredocDelimiter) heredocDelimiter = null;
      continue;
    }

    const line = rawLine.trim();
    if (line.endsWith("\\")) {
      pending += `${line.slice(0, -1)} `;
      continue;
    }

    const joined = `${pending}${line}`;
    pending = "";
    if (joined.length === 0) continue;

    const heredoc = HEREDOC_START.exec(joined);
    if (heredoc) heredocDelimiter = heredoc[1];

    lines.push(joined);
  }

  if (pending.trim().length > 0) lines.push(pending.trim());
  return lines;
}

/** `echo ok # node scripts/starter-checks.js brand` — the tail is a comment. */
function stripTrailingComment(line) {
  const commentStart = / #.*$/u.exec(line);
  return commentStart ? line.slice(0, commentStart.index) : line;
}

/**
 * Split one line into separate commands. `true || x` and `false && x` are
 * dropped: the operator makes the right-hand side unreachable, which is the
 * cheapest way to write a lane that never runs.
 */
function splitLineIntoCommands(line) {
  const parts = line.split(/(&&|\|\||[;|])/u);
  const commands = [];

  for (let index = 0; index < parts.length; index += 2) {
    const segment = (parts[index] ?? "").trim();
    const precedingOperator = parts[index - 1];

    if (precedingOperator === "||" && commands.at(-1) === "true") continue;
    if (precedingOperator === "&&" && commands.at(-1) === "false") continue;
    if (segment.length > 0) commands.push(segment);
  }

  return commands;
}

/** Split a shell snippet into token arrays, one per command. */
function tokenizeShell(shellText) {
  return normalizeShellLines(shellText)
    .filter((line) => !line.startsWith("#"))
    .map(stripTrailingComment)
    .flatMap(splitLineIntoCommands)
    .map((command) =>
      command
        .split(/\s+/u)
        .map((token) => token.replace(/^["']|["']$/gu, ""))
        .filter((token) => token.length > 0),
    )
    .filter((tokens) => tokens.length > 0);
}

function isStarterChecksPath(token) {
  return token.replace(/^\.\//u, "") === STARTER_CHECKS_PATH;
}

/** `node [flags] scripts/starter-checks.js <subcommand>` */
function classifyNodeCommand(tokens) {
  const pathIndex = tokens.findIndex((token) => !token.startsWith("-"));
  if (pathIndex === -1 || !isStarterChecksPath(tokens[pathIndex])) return {};

  const next = tokens[pathIndex + 1];
  return next && !next.startsWith("-") ? { subcommand: next } : {};
}

/**
 * `pnpm run x` / `pnpm x` name a package script. `pnpm exec x` and `npx x` run
 * a binary called `x`, which is a different thing entirely — the only case
 * worth following is when that binary is `node`.
 */
function classifyRunnerCommand(tokens, packageScripts) {
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (RUNNER_VALUE_FLAGS.has(token)) index += 2;
    else if (token.startsWith("-")) index += 1;
    else break;
  }

  const target = tokens[index];
  if (!target) return {};

  // `pnpm run <name>` — the next token is the script name even if it is
  // spelled `run` or `exec`, so it must not go through the flag skipping again.
  if (target === "run") {
    const script = tokens[index + 1];
    return script && Object.hasOwn(packageScripts, script)
      ? { packageScript: script }
      : {};
  }

  if (RUNNER_EXEC_WORDS.has(target)) {
    // 互相递归：`pnpm exec node x.js` 的后半段当成一条独立命令重新识别。
    return classifyCommand(tokens.slice(index + 1), packageScripts);
  }

  return Object.hasOwn(packageScripts, target) ? { packageScript: target } : {};
}

/**
 * What one command invokes: a starter-checks subcommand, a package script, or
 * neither. The executor must be in command position — a path named anywhere
 * else is text, not a call.
 */
function classifyCommand(tokens, packageScripts) {
  const meaningful = tokens.filter((token) => !ENV_ASSIGNMENT.test(token));
  const [executor, ...rest] = meaningful;
  if (!executor) return {};

  if (NODE_EXECUTORS.has(executor) || executor.endsWith("/node")) {
    return classifyNodeCommand(rest);
  }
  if (PACKAGE_RUNNERS.has(executor)) {
    return classifyRunnerCommand(rest, packageScripts);
  }
  if (BINARY_RUNNERS.has(executor)) {
    return classifyCommand(rest, packageScripts);
  }

  return {};
}

/** `jobs.*.steps[].run` only. A key named `run` under `env:` is not a command. */
function collectWorkflowRunStrings(workflow) {
  const found = [];

  for (const job of Object.values(workflow?.jobs ?? {})) {
    if (isLiteralFalse(job?.if)) continue;

    for (const step of job?.steps ?? []) {
      if (typeof step?.run !== "string") continue;
      if (isLiteralFalse(step?.if)) continue;
      found.push(step.run);
    }
  }

  return found;
}

/** `<hook>.commands.<name>.run` only. */
function collectLefthookRunStrings(lefthook) {
  const found = [];

  for (const hook of Object.values(lefthook ?? {})) {
    for (const command of Object.values(hook?.commands ?? {})) {
      if (typeof command?.run === "string") found.push(command.run);
    }
  }

  return found;
}

/**
 * Automated lanes something else executes, and manual lanes a human is told to
 * type. Both are lanes; only one of them runs without a person.
 */
function collectLanes() {
  const automated = [];
  const manual = [];

  const workflowFiles = readdirSync(WORKFLOW_DIR).filter((file) =>
    /\.ya?ml$/u.test(file),
  );
  let workflowSteps = 0;
  for (const file of workflowFiles) {
    const workflow = yaml.load(readRepoFile(join(WORKFLOW_DIR, file)));
    const runStrings = collectWorkflowRunStrings(workflow);
    workflowSteps += runStrings.length;
    automated.push(...runStrings.flatMap(tokenizeShell));
  }

  const lefthook = yaml.load(readRepoFile(LEFTHOOK_CONFIG));
  automated.push(...collectLefthookRunStrings(lefthook).flatMap(tokenizeShell));

  const { RELEASE_PROOF_MANIFEST } = require("../release-proof-manifest.js");
  for (const step of RELEASE_PROOF_MANIFEST.steps) {
    if (step.args) automated.push([step.command, ...step.args]);
    else automated.push(...tokenizeShell(step.command));
  }
  for (const lane of RELEASE_PROOF_MANIFEST.manualProofLanes ?? []) {
    manual.push(...tokenizeShell(lane.command));
  }

  return { automated, manual, workflowFiles, workflowSteps };
}

/** Walk lane commands through package scripts, collecting subcommands hit. */
function collectReachableSubcommands(roots, packageScripts) {
  const reached = new Set();
  const visitedScripts = new Set();
  const queue = [...roots];

  while (queue.length > 0) {
    const tokens = queue.pop();
    const { subcommand, packageScript } = classifyCommand(
      tokens,
      packageScripts,
    );

    if (subcommand) reached.add(subcommand);
    if (!packageScript || visitedScripts.has(packageScript)) continue;

    visitedScripts.add(packageScript);
    // pnpm runs pre/post around the script itself; all three are the lane.
    for (const name of [
      `pre${packageScript}`,
      packageScript,
      `post${packageScript}`,
    ]) {
      if (Object.hasOwn(packageScripts, name)) {
        queue.push(...tokenizeShell(packageScripts[name]));
      }
    }
  }

  return reached;
}

function runSubcommandLaneCheck() {
  // Read the live registry rather than accepting one: a caller passing a
  // trimmed list could hide the exact thing this check exists to find.
  const { STARTER_CHECK_COMMANDS } = require("../../starter-checks.js");
  const packageScripts = JSON.parse(readRepoFile(PACKAGE_JSON)).scripts ?? {};
  const { automated, manual, workflowFiles, workflowSteps } = collectLanes();

  // Empty-scan guard: if the parse produced nothing, the check is not clean,
  // it is blind.
  if (
    workflowFiles.length === 0 ||
    workflowSteps === 0 ||
    automated.length === 0
  ) {
    console.error(
      `[subcommand-lanes] found no runnable commands (${workflowFiles.length} workflow file(s), ${workflowSteps} step(s), ${automated.length} command(s)) — the scan is broken, not clean`,
    );
    return false;
  }
  if (
    !Array.isArray(STARTER_CHECK_COMMANDS) ||
    STARTER_CHECK_COMMANDS.length === 0
  ) {
    console.error(
      "[subcommand-lanes] the subcommand registry read back empty — the check cannot tell coverage from an empty list",
    );
    return false;
  }

  const inAutomated = collectReachableSubcommands(automated, packageScripts);
  const inManual = collectReachableSubcommands(manual, packageScripts);
  const manualOnly = STARTER_CHECK_COMMANDS.filter(
    (command) => !inAutomated.has(command) && inManual.has(command),
  );
  const orphans = STARTER_CHECK_COMMANDS.filter(
    (command) => !inAutomated.has(command) && !inManual.has(command),
  );
  const unknown = [...inAutomated, ...inManual].filter(
    (command) => !STARTER_CHECK_COMMANDS.includes(command),
  );

  for (const command of orphans) {
    console.error(
      `[subcommand-lanes] "${command}" is registered but no lane invokes it — wire it into CI, lefthook, or the release proof manifest, or retire it`,
    );
  }
  for (const command of unknown) {
    console.error(
      `[subcommand-lanes] a lane invokes "${command}", which is not a registered subcommand — it would print usage and exit 1`,
    );
  }

  if (orphans.length > 0 || unknown.length > 0) return false;

  for (const command of manualOnly) {
    console.log(
      `[subcommand-lanes] "${command}" is invoked only from a manual runbook lane — a person has to type it`,
    );
  }
  console.log(
    `subcommand-lanes passed: ${STARTER_CHECK_COMMANDS.length} subcommand(s), ${STARTER_CHECK_COMMANDS.length - manualOnly.length} invoked from an automated lane, ${manualOnly.length} manual-only`,
  );
  return true;
}

module.exports = {
  runSubcommandLaneCheck,
  classifyCommand,
  tokenizeShell,
  collectWorkflowRunStrings,
  collectLefthookRunStrings,
};
