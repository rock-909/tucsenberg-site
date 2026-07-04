const fs = require("node:fs");
const path = require("node:path");
const {
  getReleaseProofDocsCommandBlock,
  getReleaseProofSequence,
} = require("../release-proof-manifest");

const ROOT = process.cwd();
const RELEASE_PROOF_SEQUENCE = getReleaseProofSequence();
const PERFORMANCE_ARCHIVE_DOCS = [
  "docs/proof/performance/full-performance-audit.md",
  "docs/proof/performance/lcp-first-paint-motion-boundary.md",
  "docs/proof/performance/lighthouse-budget-governance.md",
  "docs/proof/performance/lighthouse-prefetch-policy.md",
  "docs/proof/performance/lighthouse-product-detail-payload.md",
  "docs/proof/performance/lighthouse-shared-payload.md",
  "docs/proof/performance/lighthouse-yellow-debt-attribution.md",
  "docs/proof/performance/lighthouse-yellow-debt-baseline.md",
  "docs/proof/performance/lighthouse-yellow-debt-wave-1-closeout.md",
  "docs/proof/performance/lighthouse-yellow-debt-wave-2-baseline.md",
  "docs/proof/performance/lighthouse-yellow-debt-wave-2-closeout.md",
  "docs/proof/performance/lighthouse-zero-yellow-attribution.md",
  "docs/proof/performance/performance-governance-candidate-audit.md",
  "docs/proof/performance/seo-public-surface-performance-headroom.md",
];

const TRUTH_DOC_CHECKS = [
  {
    file: "docs/ref/docs-inventory.md",
    required: [
      "current-entry",
      "current-reference",
      "current-proof",
      "inherited-starter-reference",
      "historical-proof",
      "method-workflow",
      "candidate-backlog",
      "review-needed",
      "docs/proof/performance/",
      "docs/性能实验优化方法论.md",
    ],
  },
  {
    file: "docs/ref/README.md",
    required: ["architecture-tree.md", "integrations.md"],
  },
  {
    file: "docs/ref/decisions/radix-contact-form-pilot.md",
    required: [
      "Historical route/build artifact note",
      "Current Tucsenberg is English-only",
      "not a current route promise",
    ],
  },
  {
    file: "docs/proof/README.md",
    required: [
      "baselines/cloudflare-warning.md",
      "baselines/react-doctor.md",
      "baselines/route-mode.md",
      "baselines/storybook-warning.md",
      "baselines/testing/icon-mock-best-practices.md",
      "baselines/testing/mock-config-standard.md",
    ],
  },
  {
    file: "docs/proof/performance/README.md",
    required: [
      "../../性能实验优化方法论.md",
      "a reusable method note, not current launch proof",
    ],
  },
  {
    file: "docs/ref/maintainers.md",
    required: [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "src/config/single-site-product-catalog.ts",
      "src/constants/product-standards.ts",
      "src/constants/product-specs/**",
      "messages/base/**",
      "messages/profiles/**",
    ],
    forbidden: ["src/sites/message-overrides.ts", "src/sites/**/messages/**"],
  },
  {
    file: "docs/use/replace.md",
    required: [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "src/config/single-site-product-catalog.ts",
      "src/constants/product-standards.ts",
      "src/constants/product-specs/**",
      "content/config/content.json",
      "docs/use/replace.md",
    ],
    forbidden: ["pnpm ci:local", "pnpm review:translation-quartet"],
  },
  {
    file: "docs/use/content.md",
    required: ["content/config/content.json"],
  },
  {
    file: "docs/ref/surfaces.md",
    required: ["content/config/content.json", "`content/pages/{locale}/*.mdx`"],
  },
  {
    file: "docs/ref/config.md",
    required: ["content/config/content.json"],
  },
  {
    file: "docs/ref/maintainers.md",
    forbidden: [
      "src/sites/message-overrides.ts",
      "src/sites/**/messages/**",
      "src/lib/lead-pipeline/**",
      "messages/en.json",
      "messages/zh.json",
      "scripts/cloudflare/**",
    ],
  },
  {
    file: "docs/proof/release.md",
    required: [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "scripts/quality/release-proof-manifest.js",
    ],
    forbidden: [
      "src/sites/**/messages/**",
      "pnpm ci:local",
      "pnpm review:tier-a:staged",
      "pnpm review:clusters",
      "CF_APPLY_GENERATED_PATCH=true pnpm build:cf",
      "node scripts/clean-next-build-artifacts.mjs",
      "CI=1 pnpm exec playwright test --all-projects",
      "pnpm review:translation-quartet",
      "pnpm review:translate-compat",
    ],
  },
  {
    file: "docs/proof/levels.md",
    required: [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
    ],
    forbidden: ["src/sites/**", "pnpm ci:local", "pnpm quality:gate"],
  },
  {
    file: "docs/ref/maintainers.md",
    forbidden: [
      "src/sites/message-overrides.ts",
      "src/sites/**/messages/**",
      "messages/en.json",
      "messages/zh.json",
      "pnpm review:tier-a:staged",
      "pnpm review:lead-family",
      "pnpm review:homepage-sections",
      "pnpm review:locale-runtime",
      "pnpm review:clusters",
      "pnpm review:cluster",
    ],
  },
  {
    file: "docs/ref/maintainers.md",
    forbidden: [
      "pnpm quality:gate",
      "src/lib/lead-pipeline/metrics.ts",
      "src/lib/lead-pipeline/pipeline-observability.ts",
    ],
  },
  {
    file: "docs/ref/architecture-diagram.svg",
    forbidden: [
      "scripts/cloudflare/**",
      "Showcase Website Starter Project Architecture Diagram",
      "Showcase Website Starter - Current Project Architecture",
      "bilingual content",
    ],
  },
  {
    file: "docs/ref/lifecycle.md",
    forbidden: ["This starter has two lifecycle contexts:"],
  },
  {
    file: "docs/design/impeccable/system/COLOR-SYSTEM.md",
    forbidden: [
      "# Showcase Website Starter Color System",
      "The starter should look clear, credible, modern, and easy to replace.",
    ],
  },
  {
    file: "docs/design/impeccable/system/COMPONENT-GOVERNANCE.md",
    forbidden: ["This starter is built for AI-assisted development."],
  },
  {
    file: "docs/design/truth.md",
    required: [
      "Tucsenberg current site design truth",
      "当前公开站点是 English-only，没有 `/zh` 设计入口。",
      "inherited starter design baseline",
    ],
    forbidden: [
      "这份文档只记录 starter 当前已经确认的设计真相。",
      "Current truth: starter uses a replaceable role-based color system.",
    ],
  },
  {
    file: "docs/ref/motion.md",
    required: ["canonical motion rulebook for the Tucsenberg site"],
    forbidden: [
      "canonical motion rulebook for the starter",
      "Motion in this starter",
    ],
  },
  {
    file: "docs/design/impeccable/README.md",
    required: [
      "Tucsenberg inherited design governance workspace",
      "必须服从 `docs/design/truth.md` 与当前运行态",
    ],
    forbidden: [
      "external/",
      "不作为 starter 当前真相源",
      "恢复为 starter baseline",
    ],
  },
  {
    file: "docs/design/impeccable/system/PAGE-PATTERNS.md",
    required: [
      "pattern reference, not a route-by-route current-state report",
      "Historical gap snapshot",
      "verify current code before creating cleanup work",
    ],
    forbidden: [
      "所有新页面和存量页面重构必须遵循此文件",
      "当前其他页面与本规范的偏差",
    ],
  },
  ...PERFORMANCE_ARCHIVE_DOCS.map((file) => ({
    file,
    required: ["Historical starter proof."],
    ...(file === "docs/proof/performance/full-performance-audit.md"
      ? {
          forbidden: ["The current starter is in a healthy performance state."],
        }
      : {}),
  })),
  {
    file: ".claude/rules/content.md",
    required: [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "content/config/content.json",
      "docs/superpowers/workflows/cwf/**",
    ],
  },
  {
    file: ".claude/rules/i18n.md",
    required: [
      "messages/base/{locale}/{critical,deferred}.json",
      "messages/profiles/{profile}/{locale}/{critical,deferred}.json",
      "src/sites/**/messages/**",
    ],
  },
  {
    file: ".claude/rules/testing.md",
    required: ["docs/ref/contracts.md"],
  },
];

const CURRENT_TRUTH_COMMAND_DOCS = [
  "docs/ref/maintainers.md",
  "docs/use/replace.md",
  "docs/proof/release.md",
  "docs/proof/levels.md",
  "docs/proof/launch.md",
  "docs/use/replace.md",
  "docs/use/deploy.md",
  "docs/ref/tech.md",
  "docs/design/impeccable/system/SECTION-REDESIGN-CHECKLIST.md",
];

const ROOT_INSTRUCTION_COMMAND_DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  ".claude/rules/conventions.md",
  ".claude/rules/cloudflare.md",
  ".claude/rules/coding-standards.md",
  ".claude/rules/code-quality.md",
  ".claude/rules/i18n.md",
  ".claude/rules/security.md",
  ".claude/rules/ui.md",
  ".claude/rules/content.md",
  ".claude/rules/testing.md",
  ".claude/rules/structured-data.md",
];

function readTruthFile(rootDir, relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function findOutOfOrderCommand(sequence, content) {
  let previousIndex = -1;

  for (const command of sequence) {
    const index = content.indexOf(command);
    if (index === -1) continue;
    if (index < previousIndex) return command;
    previousIndex = index;
  }

  return null;
}

function findCommandLineIndex(content, command) {
  return content.split("\n").findIndex((line) => line.trim() === command);
}

function extractBashBlockAfterHeading(markdown, heading) {
  const visibleMarkdown = markdown.replace(/<!--[\s\S]*?-->/g, "");
  const headingIndex = visibleMarkdown.indexOf(heading);
  if (headingIndex === -1) return null;

  const afterHeadingStart = headingIndex + heading.length;
  const nextHeadingIndex = visibleMarkdown.indexOf("\n## ", afterHeadingStart);
  const section = visibleMarkdown.slice(
    afterHeadingStart,
    nextHeadingIndex === -1 ? undefined : nextHeadingIndex,
  );
  const match = section.match(/```bash\n([\s\S]*?)\n```/);

  return match ? match[1] : null;
}

function getPackageScripts(packageJson) {
  if (
    typeof packageJson.scripts === "object" &&
    packageJson.scripts !== null &&
    !Array.isArray(packageJson.scripts)
  ) {
    return packageJson.scripts;
  }

  return {};
}

function collectPnpmPackageScriptCommands(content) {
  const commands = [];
  const matches = content.matchAll(/\bpnpm\s+(run\s+)?([A-Za-z0-9:_-]+)/g);

  for (const match of matches) {
    const scriptName = match[2];
    if (scriptName === "exec") continue;
    if (scriptName === "install") continue;

    const lineStart = content.lastIndexOf("\n", match.index) + 1;
    const lineEnd = content.indexOf("\n", match.index);
    const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (line.includes("没有 canonical")) continue;

    commands.push({ line, scriptName });
  }

  return commands;
}

function collectCurrentTruthDocFindings(rootDir = ROOT) {
  const failures = [];

  for (const check of TRUTH_DOC_CHECKS) {
    const fullPath = path.join(rootDir, check.file);
    if (!fs.existsSync(fullPath)) {
      failures.push({
        file: check.file,
        error: `missing required current-truth file "${check.file}"`,
      });
      continue;
    }

    const content = readTruthFile(rootDir, check.file);
    for (const pattern of check.forbidden ?? []) {
      if (content.includes(pattern)) {
        failures.push({
          file: check.file,
          error: `forbidden current-truth pattern "${pattern}"`,
        });
      }
    }

    for (const pattern of check.required ?? []) {
      if (!content.includes(pattern)) {
        failures.push({
          file: check.file,
          error: `missing current-truth pattern "${pattern}"`,
        });
      }
    }
  }

  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readTruthFile(rootDir, "package.json"));
    const scripts = getPackageScripts(packageJson);
    const commandDocs = [
      ...CURRENT_TRUTH_COMMAND_DOCS,
      ...ROOT_INSTRUCTION_COMMAND_DOCS,
    ];

    for (const doc of commandDocs) {
      const fullPath = path.join(rootDir, doc);
      if (!fs.existsSync(fullPath)) continue;

      const content = readTruthFile(rootDir, doc);
      const commands = collectPnpmPackageScriptCommands(content);
      for (const { scriptName } of commands) {
        if (Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
          continue;
        }
        failures.push({
          file: doc,
          error: `unknown package script command "pnpm ${scriptName}"`,
        });
      }
    }
  }

  const runbookPath = path.join(rootDir, "docs/proof/release.md");
  if (fs.existsSync(runbookPath)) {
    const runbook = readTruthFile(rootDir, "docs/proof/release.md");
    const runbookCommandBlock = extractBashBlockAfterHeading(
      runbook,
      "## Current sequence",
    );
    if (runbookCommandBlock === null) {
      failures.push({
        file: "docs/proof/release.md",
        error:
          'missing release-proof runbook command block after "## Current sequence"',
      });
    } else if (runbookCommandBlock !== getReleaseProofDocsCommandBlock()) {
      failures.push({
        file: "docs/proof/release.md",
        error: "release-proof runbook command block drift from manifest",
      });
    }

    const runbookCommandLines = runbookCommandBlock
      ? runbookCommandBlock.split("\n")
      : [];

    for (const command of RELEASE_PROOF_SEQUENCE) {
      if (!runbookCommandLines.includes(command)) {
        failures.push({
          file: "docs/proof/release.md",
          error: `missing release-proof runbook command "${command}"`,
        });
      }
    }

    const runbookOutOfOrder = findOutOfOrderCommand(
      RELEASE_PROOF_SEQUENCE,
      runbookCommandBlock ?? "",
    );
    if (runbookOutOfOrder) {
      failures.push({
        file: "docs/proof/release.md",
        error: `release-proof runbook command order drift at "${runbookOutOfOrder}"`,
      });
    }
  }

  return failures;
}

function runTruthDocsCheck() {
  const failures = collectCurrentTruthDocFindings();

  if (failures.length === 0) {
    console.log("current-truth-docs: passed");
    return true;
  }

  console.error("current-truth-docs: failed");
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.error}`);
  }
  return false;
}

module.exports = {
  CHECKS: TRUTH_DOC_CHECKS,
  CURRENT_TRUTH_COMMAND_DOCS,
  collectCurrentTruthDocFindings,
  findCommandLineIndex,
  findOutOfOrderCommand,
  runTruthDocsCheck,
};
