/**
 * Reconciles every `scripts/starter-checks.js` subcommand against the lanes
 * that actually execute it.
 *
 * A check nobody runs is identical to a check that does not exist, except that
 * it reads as coverage. `markdown-fences` sat like that for months and was only
 * found by grepping all twenty subcommands by hand.
 *
 * Three things make this hard to do without building a fail-open gate:
 *
 * 1. Call sites are written three different ways — shell strings in CI and
 *    lefthook, `args` arrays in the release proof manifest, and package.json
 *    scripts.
 * 2. Substring matching would count a mention inside a comment as a lane. That
 *    is worse than no gate at all, so commands are tokenized and a subcommand
 *    only counts when it directly follows the script path.
 * 3. Being named in a package script is not the same as running. `brand:check`
 *    proves nothing unless something invokes `brand:check`. So package scripts
 *    are followed transitively from executed roots rather than treated as lanes
 *    in their own right.
 */

const { readFileSync, readdirSync } = require("node:fs");
const { join } = require("node:path");
const yaml = require("js-yaml");

const WORKFLOW_DIR = ".github/workflows";
const LEFTHOOK_CONFIG = "lefthook.yml";
const PACKAGE_JSON = "package.json";
const STARTER_CHECKS_PATH = "scripts/starter-checks.js";
const PACKAGE_RUNNERS = new Set(["pnpm", "npm", "yarn", "npx"]);
// `pnpm exec vitest ...` — these sit between the runner and the thing it runs.
const RUNNER_PASSTHROUGH = new Set(["run", "exec", "dlx", "--silent", "-s"]);
const ENV_ASSIGNMENT = /^[A-Z_][A-Z0-9_]*=/u;

function readRepoFile(relativePath) {
  return readFileSync(relativePath, "utf8");
}

/** Split a shell snippet into token arrays, one per command, comments dropped. */
function tokenizeShell(shellText) {
  return shellText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .flatMap((line) => line.split(/&&|\|\||[;|]/u))
    .map((command) =>
      command
        .trim()
        .split(/\s+/u)
        .map((token) => token.replace(/^["']|["']$/gu, ""))
        .filter((token) => token.length > 0),
    )
    .filter((tokens) => tokens.length > 0);
}

/**
 * What one command invokes: a starter-checks subcommand, a package script, or
 * neither. Env assignments and runner passthrough words are stepped over.
 */
function classifyCommand(tokens, packageScripts) {
  const meaningful = tokens.filter((token) => !ENV_ASSIGNMENT.test(token));
  // Call sites spell the path both ways: `scripts/...` and `./scripts/...`.
  const scriptIndex = meaningful.findIndex(
    (token) => token.replace(/^\.\//u, "") === STARTER_CHECKS_PATH,
  );

  if (scriptIndex !== -1) {
    // Naming the path is not running it. `[ -f ./scripts/starter-checks.js ]`
    // and `echo ... ./scripts/starter-checks.js in workflow checkout` both put
    // a word after the path; neither executes anything. Require the path to be
    // the thing being executed.
    const runner = meaningful[scriptIndex - 1] ?? "";
    if (scriptIndex > 0 && runner !== "node" && !runner.endsWith("/node")) {
      return {};
    }

    const next = meaningful[scriptIndex + 1];
    return next && !next.startsWith("-")
      ? { subcommand: next }
      : { subcommand: null };
  }

  const [runner, ...rest] = meaningful;
  if (!runner || !PACKAGE_RUNNERS.has(runner)) return {};

  const target = rest.find((token) => !RUNNER_PASSTHROUGH.has(token));
  return target && Object.hasOwn(packageScripts, target)
    ? { packageScript: target }
    : {};
}

/** Every `run:` string a parsed YAML config would execute. */
function collectRunStrings(node, found = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectRunStrings(item, found);
    return found;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "run" && typeof value === "string") found.push(value);
      else collectRunStrings(value, found);
    }
  }

  return found;
}

function collectExecutedRoots() {
  const roots = [];

  const workflowFiles = readdirSync(WORKFLOW_DIR).filter((file) =>
    /\.ya?ml$/u.test(file),
  );
  for (const file of workflowFiles) {
    const workflow = yaml.load(readRepoFile(join(WORKFLOW_DIR, file)));
    roots.push(...collectRunStrings(workflow).flatMap(tokenizeShell));
  }

  const lefthook = yaml.load(readRepoFile(LEFTHOOK_CONFIG));
  roots.push(...collectRunStrings(lefthook).flatMap(tokenizeShell));

  // Automated steps store argv arrays; the manual proof lanes store one shell
  // string. Manual lanes still count — a human running the release runbook is a
  // lane, and `release-verify` prints them as required proof.
  const { RELEASE_PROOF_MANIFEST } = require("../release-proof-manifest.js");
  for (const step of RELEASE_PROOF_MANIFEST.steps) {
    if (step.args) roots.push([step.command, ...step.args]);
    else roots.push(...tokenizeShell(step.command));
  }
  for (const lane of RELEASE_PROOF_MANIFEST.manualProofLanes ?? []) {
    roots.push(...tokenizeShell(lane.command));
  }

  return { roots, workflowFiles };
}

/** Walk executed roots through package scripts, collecting subcommands hit. */
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

    if (packageScript && !visitedScripts.has(packageScript)) {
      visitedScripts.add(packageScript);
      queue.push(...tokenizeShell(packageScripts[packageScript]));
    }
  }

  return reached;
}

/**
 * @param registeredCommands the live subcommand list. Passed in rather than
 *   imported: `starter-checks.js` runs `main()` before assigning its exports,
 *   so requiring it back from here reads `undefined` under the CLI entrypoint.
 */
function runSubcommandLaneCheck(registeredCommands) {
  const packageScripts = JSON.parse(readRepoFile(PACKAGE_JSON)).scripts ?? {};
  const { roots, workflowFiles } = collectExecutedRoots();

  // Empty-scan guard: if the parse produced nothing, the check is not clean,
  // it is blind.
  if (workflowFiles.length === 0 || roots.length === 0) {
    console.error(
      `[subcommand-lanes] found no executable commands (${workflowFiles.length} workflow file(s), ${roots.length} command(s)) — the scan is broken, not clean`,
    );
    return false;
  }

  const reached = collectReachableSubcommands(roots, packageScripts);
  const orphans = registeredCommands.filter((command) => !reached.has(command));
  const unknown = [...reached].filter(
    (command) => !registeredCommands.includes(command),
  );

  for (const command of orphans) {
    console.error(
      `[subcommand-lanes] "${command}" is registered but no lane runs it — wire it into CI, lefthook, or the release proof manifest, or retire it`,
    );
  }
  for (const command of unknown) {
    console.error(
      `[subcommand-lanes] a lane invokes "${command}", which is not a registered subcommand — it would print usage and exit 1`,
    );
  }

  if (orphans.length > 0 || unknown.length > 0) return false;

  console.log(
    `subcommand-lanes passed: ${registeredCommands.length} subcommand(s), every one reachable from an executed lane`,
  );
  return true;
}

module.exports = {
  runSubcommandLaneCheck,
  classifyCommand,
  tokenizeShell,
};
