const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const yaml = require("js-yaml");

const ROOT = process.cwd();

// Required real config, checked against parsed structure (not raw text) so that
// comments can neither satisfy a required value nor trip a forbidden one.
const WRANGLER_REQUIRED_FIELDS = [
  { path: ["main"], expected: ".open-next/worker.js" },
  { path: ["assets", "binding"], expected: "ASSETS" },
];
const WRANGLER_REQUIRED_COMPAT_FLAGS = [
  "nodejs_compat",
  "global_fetch_strictly_public",
];
// Cache/queue bindings and split-topology surfaces that a passing build +
// wrangler dry-run would NOT catch (adding an R2/D1/DO binding still builds).
// This is architecture policy that only a config check can express.
const WRANGLER_FORBIDDEN_TOKENS = [
  "WORKER_SELF_REFERENCE",
  "NEXT_INC_CACHE_R2_BUCKET",
  "NEXT_TAG_CACHE_D1",
  "NEXT_CACHE_DO_QUEUE",
  "durable_objects",
  "r2_buckets",
  "d1_databases",
  "migrations",
];

const OPEN_NEXT_REQUIRED_TOKENS = ["defineCloudflareConfig"];
const OPEN_NEXT_FORBIDDEN_TOKENS = [
  "r2IncrementalCache",
  "doQueue",
  "d1NextTagCache",
  "functions",
  "apiLead",
  "apiOps",
  "/api/cache/invalidate",
];

const DEPLOY_WORKFLOW_REQUIRED_COMMANDS = [
  'node scripts/starter-checks.js external-url-smoke --base-url "${PREVIEW_URL}"',
  "pnpm exec opennextjs-cloudflare deploy --env production",
];

const CLOUDFLARE_SCRIPT_SURFACE_CHECKS = [
  {
    name: "website:build:cf",
    expected:
      "DEPLOYMENT_PLATFORM=cloudflare NEXT_PUBLIC_DEPLOYMENT_PLATFORM=cloudflare pnpm exec opennextjs-cloudflare build",
  },
  {
    name: "website:build:cf:debug",
    expected:
      "DEPLOYMENT_PLATFORM=cloudflare NEXT_PUBLIC_DEPLOYMENT_PLATFORM=cloudflare pnpm exec opennextjs-cloudflare build --noMinify",
  },
];
const DESTRUCTIVE_DEPLOY_SCRIPT_SNIPPETS = [
  "wrangler delete",
  "deleted_classes",
  "new_sqlite_classes",
];
const RETIRED_SCRIPT_NAMES = [
  "build:cf",
  "deploy:cf",
  "deploy:cf:dry-run",
  "proof:cf:preview-deployed",
];

function readCloudflareCompareFile(rootDir, relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), "utf8");
}

// wrangler.jsonc is JSONC (comments + trailing commas); the TypeScript config
// reader parses it to a real object. Never regex-strip comments — that is the
// same raw-text bug class this check exists to remove.
function parseWranglerConfig(text) {
  const { config, error } = ts.parseConfigFileTextToJson(
    "wrangler.jsonc",
    text,
  );
  if (error) {
    throw new Error(
      `wrangler.jsonc parse failed: ${ts.flattenDiagnosticMessageText(error.messageText, "\n")}`,
    );
  }
  return config ?? {};
}

function getConfigValue(config, keyPath) {
  return keyPath.reduce(
    (node, key) => (node && typeof node === "object" ? node[key] : undefined),
    config,
  );
}

// Collect identifier and string-literal token values from a TS source. Comments
// are scanner trivia, so they cannot satisfy or trip any token check.
function collectSourceTokens(relPath, text) {
  const source = ts.createSourceFile(
    relPath,
    text,
    ts.ScriptTarget.Latest,
    true,
  );
  const tokens = new Set();
  const visit = (node) => {
    if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
      tokens.add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return tokens;
}

function collectDeployRunCommands(workflow) {
  const jobs = workflow?.jobs ?? {};
  const commands = [];
  for (const job of Object.values(jobs)) {
    for (const step of job?.steps ?? []) {
      if (typeof step?.run === "string") {
        commands.push(step.run);
      }
    }
  }
  return commands;
}

function checkWrangler(rootDir, failures) {
  const config = parseWranglerConfig(
    readCloudflareCompareFile(rootDir, "wrangler.jsonc"),
  );

  const missing = [];
  for (const field of WRANGLER_REQUIRED_FIELDS) {
    if (getConfigValue(config, field.path) !== field.expected) {
      missing.push(`${field.path.join(".")}: ${field.expected}`);
    }
  }
  const compatFlags = Array.isArray(config.compatibility_flags)
    ? config.compatibility_flags
    : [];
  for (const flag of WRANGLER_REQUIRED_COMPAT_FLAGS) {
    if (!compatFlags.includes(flag)) {
      missing.push(`compatibility_flags: ${flag}`);
    }
  }

  // Comments are already gone from the parsed object; searching its canonical
  // JSON only matches real configuration values.
  // ponytail: substring over canonical JSON; switch to keyed structural checks
  // only if a legitimate value ever collides with a forbidden token.
  const canonical = JSON.stringify(config);
  const forbidden = WRANGLER_FORBIDDEN_TOKENS.filter((token) =>
    canonical.includes(token),
  );

  if (missing.length > 0 || forbidden.length > 0) {
    failures.push({
      file: "wrangler.jsonc",
      label: "Wrangler config keeps the static-generation Cloudflare baseline",
      missing,
      forbidden,
    });
  }
}

function checkOpenNextConfig(rootDir, failures) {
  const tokens = collectSourceTokens(
    "open-next.config.ts",
    readCloudflareCompareFile(rootDir, "open-next.config.ts"),
  );
  const missing = OPEN_NEXT_REQUIRED_TOKENS.filter(
    (token) => !tokens.has(token),
  );
  const forbidden = OPEN_NEXT_FORBIDDEN_TOKENS.filter((token) =>
    tokens.has(token),
  );

  if (missing.length > 0 || forbidden.length > 0) {
    failures.push({
      file: "open-next.config.ts",
      label:
        "OpenNext config stays anchored to the Cloudflare adapter without custom cache or split topology",
      missing,
      forbidden,
    });
  }
}

function checkPackageScripts(rootDir, failures) {
  const packageJson = JSON.parse(
    readCloudflareCompareFile(rootDir, "package.json"),
  );
  const scripts = packageJson.scripts ?? {};

  for (const check of CLOUDFLARE_SCRIPT_SURFACE_CHECKS) {
    const script = scripts[check.name];
    if (script !== check.expected) {
      failures.push({
        file: "package.json",
        label:
          "stable Cloudflare build entrypoint must use the native OpenNext Cloudflare CLI",
        missing: [`${check.name}: ${check.expected}`],
        forbidden: [],
      });
    }

    if (typeof script === "string") {
      const forbidden = [
        ...DESTRUCTIVE_DEPLOY_SCRIPT_SNIPPETS,
        "&&",
        "||",
        ";",
      ].filter((snippet) => script.includes(snippet));
      if (forbidden.length > 0) {
        failures.push({
          file: "package.json",
          label:
            "Cloudflare build alias must stay exact and must not chain destructive actions",
          missing: [],
          forbidden,
        });
      }
    }
  }

  const retired = RETIRED_SCRIPT_NAMES.filter((name) =>
    Object.prototype.hasOwnProperty.call(scripts, name),
  );
  if (retired.length > 0) {
    failures.push({
      file: "package.json",
      label:
        "advanced Cloudflare deploy/proof commands stay as direct scripts, not public package aliases",
      missing: [],
      forbidden: retired,
    });
  }
}

function checkDeployWorkflow(rootDir, failures) {
  const workflow = yaml.load(
    readCloudflareCompareFile(
      rootDir,
      ".github/workflows/cloudflare-deploy.yml",
    ),
  );
  const commands = collectDeployRunCommands(workflow);
  const missing = DEPLOY_WORKFLOW_REQUIRED_COMMANDS.filter(
    (required) => !commands.some((run) => run.includes(required)),
  );

  if (missing.length > 0) {
    failures.push({
      file: ".github/workflows/cloudflare-deploy.yml",
      label: "Cloudflare workflow must call deploy/proof scripts directly",
      missing,
      forbidden: [],
    });
  }
}

function collectCloudflareOfficialCompareFailures(rootDir = ROOT) {
  const failures = [];
  checkWrangler(rootDir, failures);
  checkOpenNextConfig(rootDir, failures);
  checkPackageScripts(rootDir, failures);
  checkDeployWorkflow(rootDir, failures);
  return failures;
}

function runCloudflareOfficialCompareCli(args = []) {
  const unknownArgs = args.filter((arg) => arg !== "--source-only");
  if (unknownArgs.length > 0) {
    console.error(
      `cf-official-compare: unknown argument: ${unknownArgs.join(", ")}`,
    );
    return false;
  }

  const sourceOnly = args.includes("--source-only");

  const failures = collectCloudflareOfficialCompareFailures();

  if (failures.length > 0) {
    console.error("cf-official-compare: failed");
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.label}`);
      for (const snippet of failure.missing) {
        console.error(`  - missing config: ${snippet}`);
      }
      for (const snippet of failure.forbidden) {
        console.error(`  - forbidden config still present: ${snippet}`);
      }
    }
    return false;
  }

  console.log("cf-official-compare: passed");
  if (sourceOnly) {
    console.log(
      "Verified static-generation Cloudflare source baseline against open-next.config.ts, wrangler.jsonc, and package deploy aliases.",
    );
  } else {
    console.log(
      "Verified static-generation Cloudflare source baseline. Native deploy-artifact proof is covered by wrangler deploy --dry-run.",
    );
  }

  return true;
}

module.exports = {
  collectCloudflareOfficialCompareFailures,
  runCloudflareOfficialCompareCli,
};
