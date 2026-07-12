const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

const CLOUDFLARE_SOURCE_CHECKS = [
  {
    file: "open-next.config.ts",
    label:
      "OpenNext config stays anchored to the Cloudflare adapter without custom cache or split topology",
    requiredSnippets: ["defineCloudflareConfig"],
    forbiddenSnippets: [
      "r2IncrementalCache",
      "doQueue",
      "d1NextTagCache",
      "functions",
      "apiLead",
      { match: "apiOps", type: "quoted" },
      "/api/cache/invalidate",
    ],
  },
  {
    file: "wrangler.jsonc",
    label: "Wrangler config keeps the static-generation Cloudflare baseline",
    requiredSnippets: [
      '".open-next/worker.js"',
      '"ASSETS"',
      // OpenNext Cloudflare hard minimum: removing these breaks the whole site.
      '"nodejs_compat"',
      '"global_fetch_strictly_public"',
    ],
    forbiddenSnippets: [
      '"WORKER_SELF_REFERENCE"',
      '"NEXT_INC_CACHE_R2_BUCKET"',
      '"NEXT_TAG_CACHE_D1"',
      '"NEXT_CACHE_DO_QUEUE"',
      '"durable_objects"',
      '"r2_buckets"',
      '"d1_databases"',
      '"migrations"',
    ],
  },
];
const CLOUDFLARE_SCRIPT_SURFACE_CHECKS = [
  {
    name: "website:build:cf",
    expected: "pnpm exec opennextjs-cloudflare build",
  },
];
const DESTRUCTIVE_DEPLOY_SCRIPT_SNIPPETS = [
  "wrangler delete",
  "deleted_classes",
  "new_sqlite_classes",
];

function readCloudflareCompareFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function normalizeCloudflareCompareForbiddenCheck(snippet) {
  if (typeof snippet === "string") {
    return { match: snippet, type: "substring" };
  }

  return snippet;
}

function hasCloudflareCompareForbiddenContent(content, snippet) {
  const check = normalizeCloudflareCompareForbiddenCheck(snippet);

  if (check.type === "quoted") {
    return (
      content.includes(`"${check.match}"`) ||
      content.includes(`'${check.match}'`)
    );
  }

  if (check.type === "regex") {
    return check.match.test(content);
  }

  return content.includes(check.match);
}

function findCloudflareCompareForbiddenSnippets(content, snippets) {
  return snippets.filter((snippet) =>
    hasCloudflareCompareForbiddenContent(content, snippet),
  );
}

function formatCloudflareCompareForbiddenSnippet(snippet) {
  const check = normalizeCloudflareCompareForbiddenCheck(snippet);
  return check.type === "regex" ? check.match.toString() : check.match;
}

function collectCloudflareOfficialCompareFailures() {
  const failures = [];
  const packageJson = JSON.parse(readCloudflareCompareFile("package.json"));
  const scripts = packageJson.scripts ?? {};

  {
    for (const check of CLOUDFLARE_SOURCE_CHECKS) {
      const content = readCloudflareCompareFile(check.file);
      const missing = check.requiredSnippets.filter(
        (snippet) => !content.includes(snippet),
      );
      const forbidden = findCloudflareCompareForbiddenSnippets(
        content,
        check.forbiddenSnippets,
      );

      if (missing.length > 0 || forbidden.length > 0) {
        failures.push({
          file: check.file,
          label: check.label,
          missing,
          forbidden,
        });
      }
    }

    for (const check of CLOUDFLARE_SCRIPT_SURFACE_CHECKS) {
      const script = scripts[check.name];
      const matches = script === check.expected;

      if (!matches) {
        failures.push({
          file: "package.json",
          label:
            "stable Cloudflare build entrypoint must use the native OpenNext Cloudflare CLI",
          missing: [`${check.name}: ${check.expected}`],
          forbidden: [],
        });
      }

      if (typeof script === "string") {
        const forbidden = findCloudflareCompareForbiddenSnippets(script, [
          ...DESTRUCTIVE_DEPLOY_SCRIPT_SNIPPETS,
          "&&",
          "||",
          ";",
        ]);

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

    for (const retiredName of [
      "build:cf",
      "deploy:cf",
      "deploy:cf:dry-run",
      "proof:cf:preview-deployed",
    ]) {
      if (!Object.prototype.hasOwnProperty.call(scripts, retiredName)) {
        continue;
      }

      failures.push({
        file: "package.json",
        label:
          "advanced Cloudflare deploy/proof commands stay as direct scripts, not public package aliases",
        missing: [],
        forbidden: [retiredName],
      });
    }

    const cloudflareWorkflow = readCloudflareCompareFile(
      ".github/workflows/cloudflare-deploy.yml",
    );
    for (const snippet of [
      'node scripts/starter-checks.js public-preview-smoke --base-url "${PREVIEW_URL}"',
      "pnpm exec opennextjs-cloudflare deploy --env production",
    ]) {
      if (!cloudflareWorkflow.includes(snippet)) {
        failures.push({
          file: ".github/workflows/cloudflare-deploy.yml",
          label: "Cloudflare workflow must call deploy/proof scripts directly",
          missing: [snippet],
          forbidden: [],
        });
      }
    }
  }

  return failures;
}

function runCloudflareOfficialCompareCli(args = []) {
  const sourceOnly = args.includes("--source-only");

  if (args.includes("--generated-only")) {
    console.error(
      "cf-official-compare: --generated-only is retired and runs no checks. " +
        "Use `--source-only` for the source baseline, and " +
        "`pnpm exec wrangler deploy --dry-run --env preview` (after `pnpm website:build:cf`) " +
        "for native deploy-artifact proof.",
    );
    return false;
  }

  if (sourceOnly && args.includes("--require-generated")) {
    console.error(
      "cf-official-compare: generated phase configs are retired; --require-generated is no longer supported.",
    );
    return false;
  }

  const failures = collectCloudflareOfficialCompareFailures();

  if (failures.length > 0) {
    console.error("cf-official-compare: failed");
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.label}`);
      for (const snippet of failure.missing) {
        console.error(`  - missing snippet: ${snippet}`);
      }
      for (const snippet of failure.forbidden) {
        console.error(
          `  - forbidden snippet still present: ${formatCloudflareCompareForbiddenSnippet(snippet)}`,
        );
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
