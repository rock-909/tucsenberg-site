const fs = require("node:fs");
const path = require("node:path");
const {
  getReleaseProofDocsCommandBlock,
  getReleaseProofSequence,
} = require("../release-proof-manifest");

const ROOT = process.cwd();
const RELEASE_PROOF_SEQUENCE = getReleaseProofSequence();
const PERFORMANCE_ARCHIVE_DOCS = [
  "docs/技术难题/全量性能审计.md",
  "docs/技术难题/LCP首屏动效边界.md",
  "docs/技术难题/Lighthouse预算治理.md",
  "docs/技术难题/Lighthouse预取策略.md",
  "docs/技术难题/Lighthouse产品详情负载.md",
  "docs/技术难题/Lighthouse共享负载.md",
  "docs/技术难题/Lighthouse黄色债务归因.md",
  "docs/技术难题/Lighthouse黄色债务基线.md",
  "docs/技术难题/Lighthouse黄色债务第一轮收口.md",
  "docs/技术难题/Lighthouse黄色债务第二轮基线.md",
  "docs/技术难题/Lighthouse黄色债务第二轮收口.md",
  "docs/技术难题/Lighthouse零黄色归因.md",
  "docs/技术难题/性能治理候选审计.md",
  "docs/技术难题/SEO公开页面性能余量.md",
];
const RETIRED_PUBLIC_TRUTH_PATTERNS = ["/api/verify-turnstile"];
const HISTORICAL_BANNER = "> Historical.";
const HISTORICAL_DERIVATION_DOCS = new Set([
  "docs/项目基础/替换顺序.md",
  "docs/项目基础/派生起步.md",
  "docs/项目基础/派生配置.md",
  "docs/项目基础/派生干跑验证.md",
]);

const TRUTH_DOC_CHECKS = [
  {
    file: "docs/项目基础/文档清单.md",
    required: [
      "current-entry",
      "current-reference",
      "current-proof",
      "historical-proof",
      "method-workflow",
      "candidate-backlog",
      "Docs existence closeout",
      "docs/技术难题/",
      "docs/design/",
      "docs/决策记录/",
      "docs/superpowers/",
      "specs/**",
      "plans/**",
      "docs/技术难题/性能实验优化方法论.md",
      "docs/技术难题/审查2026-07/交接文档.md",
      "docs/audits/上线就绪问题清单-2026-07-05.md",
    ],
    forbidden: ["review-needed", "Follow-up buckets"],
  },
  {
    file: "docs/README.md",
    required: [
      "性能实验优化方法论.md",
      "Superpowers 上游当前默认输出路径",
      "docs/superpowers/specs/**",
      "docs/superpowers/plans/**",
      "技术难题/审查2026-07/交接文档.md",
    ],
  },
  {
    file: "README.md",
    required: [
      "src/constants/tucsenberg-product-page-*.ts",
      "messages/profiles/b2b-lead/**",
      "messages/profiles/catalog/**",
      "base -> b2b-lead -> catalog",
      "pnpm messages:sync",
    ],
  },
  {
    file: "docs/项目基础/AI协作边界.md",
    required: [
      "Upstream `obra/superpowers` currently writes specs and implementation plans",
      "docs/superpowers/specs/**",
      "docs/superpowers/plans/**",
      "Older upstream history used `docs/plans/**`",
      "Local `.superpowers/**` state is not a repo document path",
    ],
  },
  {
    file: "docs/项目基础/维护入口.md",
    required: ["旧 starter workflow 说明已经移出 `docs/`"],
    forbidden: ["website-production-workflow.excalidraw"],
  },
  {
    file: "docs/技术难题/性能实验优化方法论.md",
    required: [
      "这是方法笔记，不是当前 Tucsenberg launch proof。",
      "docs/项目基础/上线验证.md",
    ],
  },
  {
    file: "docs/项目基础/项目基础索引.md",
    required: ["架构树.md", "集成.md"],
  },
  {
    file: "docs/决策记录/Radix联系表单试点.md",
    required: [
      "Historical route/build artifact note",
      "Current Tucsenberg is English-only",
      "not a current route promise",
    ],
  },
  {
    file: "docs/技术难题/验证入口.md",
    required: [
      "Cloudflare构建警告.md",
      "ReactDoctor基线.md",
      "路由模式基线.md",
      "Storybook警告基线.md",
      "旧 mock 方法笔记已经移出 `docs/`",
      "审查2026-07/交接文档.md",
    ],
  },
  // 交接文档已整篇转为 historical（docs/技术难题/审查2026-07/ 目录豁免），
  // 原 required 锁的是时点快照（commit 哈希 42aaabe/8c6dc3a、"0 error / 3 warning"
  // 输出、"尚未 push" 状态），会强制文档保留过时陈述。required 只锁活的真相，
  // 禁止锁时点快照——整条移除。
  {
    file: "docs/技术难题/性能记录.md",
    required: [
      "性能实验优化方法论.md",
      "a reusable method note, not current launch proof",
    ],
  },
  {
    // 维护规则.md 原在 TRUTH_DOC_CHECKS 里出现 4 次，forbidden 列表互相重叠。
    // 合并为单一条目：required 保留唯一一份，forbidden 取 4 条的去重并集。
    file: "docs/项目基础/维护规则.md",
    required: [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
      "src/config/single-site-product-catalog.ts",
      "src/constants/product-standards.ts",
      "src/constants/tucsenberg-product-pages.ts",
      "messages/base/**",
      "messages/profiles/b2b-lead/**",
      "messages/profiles/catalog/**",
    ],
    forbidden: [
      "src/sites/message-overrides.ts",
      "src/sites/**/messages/**",
      "review-needed",
      "src/lib/lead-pipeline/**",
      "messages/en.json",
      "messages/zh.json",
      "scripts/cloudflare/**",
      "pnpm review:tier-a:staged",
      "pnpm review:lead-family",
      "pnpm review:homepage-sections",
      "pnpm review:locale-runtime",
      "pnpm review:clusters",
      "pnpm review:cluster",
      "pnpm quality:gate",
      "src/lib/lead-pipeline/metrics.ts",
      "src/lib/lead-pipeline/pipeline-observability.ts",
    ],
  },
  {
    file: "docs/项目基础/内容.md",
    required: [
      "content/config/content.json",
      "messages/profiles/b2b-lead/**",
      "messages/profiles/catalog/**",
      "pnpm messages:sync",
      "node scripts/starter-checks.js content-readiness",
    ],
  },
  {
    file: "docs/项目基础/项目基础.md",
    required: [
      "src/constants/tucsenberg-product-page-*.ts",
      "messages/profiles/b2b-lead/**",
      "messages/profiles/catalog/**",
      "pnpm messages:sync",
    ],
  },
  {
    file: "docs/项目基础/替换边界.md",
    required: ["content/config/content.json", "`content/pages/{locale}/*.mdx`"],
    forbidden: [
      "edit `src/config/single-site-product-catalog.ts`, `src/constants/product-standards.ts`, and `src/constants/product-specs/**` first",
    ],
  },
  {
    file: "docs/项目基础/配置.md",
    required: [
      "content/config/content.json",
      "src/constants/tucsenberg-product-pages.ts",
    ],
  },
  {
    file: "docs/项目基础/发布验证.md",
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
    file: "docs/项目基础/验证等级.md",
    required: [
      "src/config/single-site-page-expression.ts",
      "src/config/single-site-seo.ts",
    ],
    forbidden: ["src/sites/**", "pnpm ci:local", "pnpm quality:gate"],
  },
  {
    file: "docs/项目基础/架构图.svg",
    forbidden: [
      "scripts/cloudflare/**",
      "Showcase Website Starter Project Architecture Diagram",
      "Showcase Website Starter - Current Project Architecture",
      "bilingual content",
    ],
  },
  {
    file: "docs/项目基础/生命周期.md",
    forbidden: ["This starter has two lifecycle contexts:"],
  },
  {
    file: "docs/design/色彩系统.md",
    forbidden: [
      "# Showcase Website Starter Color System",
      "The starter should look clear, credible, modern, and easy to replace.",
    ],
  },
  {
    file: "docs/design/组件治理.md",
    forbidden: ["This starter is built for AI-assisted development."],
  },
  {
    file: "docs/design/设计真相.md",
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
    file: "docs/design/动效治理.md",
    required: ["canonical motion rulebook for the Tucsenberg site"],
    forbidden: [
      "canonical motion rulebook for the starter",
      "Motion in this starter",
    ],
  },
  {
    file: "docs/design/设计系统说明.md",
    required: [
      "Tucsenberg inherited design governance workspace",
      "必须服从 `docs/design/设计真相.md` 与当前运行态",
    ],
    forbidden: [
      "external/",
      "不作为 starter 当前真相源",
      "恢复为 starter baseline",
    ],
  },
  {
    file: "docs/design/页面模式.md",
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
    ...(file === "docs/技术难题/全量性能审计.md"
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
      "docs/superpowers/plans/**",
    ],
  },
  {
    file: ".claude/rules/i18n.md",
    required: [
      "messages/base/{locale}/{critical,deferred}.json",
      "messages/profiles/b2b-lead/{locale}/{critical,deferred}.json",
      "messages/profiles/catalog/{locale}/{critical,deferred}.json",
      "base -> b2b-lead -> catalog",
      "pnpm messages:sync",
    ],
    forbidden: [
      "messages/profiles/{profile}/{locale}/{critical,deferred}.json",
      "src/sites/**/messages/**",
    ],
  },
  {
    file: ".claude/rules/testing.md",
    required: ["docs/项目基础/行为合约.md"],
  },
];

const CURRENT_TRUTH_COMMAND_DOCS = [
  "docs/项目基础/维护规则.md",
  "docs/项目基础/发布验证.md",
  "docs/项目基础/验证等级.md",
  "docs/项目基础/上线验证.md",
  "docs/项目基础/部署.md",
  "docs/项目基础/技术栈.md",
  "docs/design/区块重设检查清单.md",
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

function collectMarkdownFiles(rootDir, relativeDir) {
  const startPath = path.join(rootDir, relativeDir);
  if (!fs.existsSync(startPath)) return [];

  const results = [];
  for (const entry of fs.readdirSync(startPath, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(rootDir, relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(relativePath);
    }
  }
  return results;
}

function isApprovedHistoricalDoc(relativePath) {
  return (
    HISTORICAL_DERIVATION_DOCS.has(relativePath) ||
    relativePath.startsWith("docs/superpowers/") ||
    relativePath.startsWith("docs/audits/") ||
    // 2026-07 全库审查的发现记录与交接是历史证据，不是当前 runtime truth。
    // 它们如实记载了已退役路由/API 名，不应被 forbidden pattern 追溯定罪——
    // 整目录纳入 historical 豁免（加横幅 + 文档清单登记），而不是改写 findings 内容。
    relativePath.startsWith("docs/技术难题/审查2026-07/") ||
    relativePath.startsWith("docs/技术难题/整库整改2026-07/")
  );
}

function inventoryMarksHistorical(inventory, relativePath) {
  return inventory
    .split("\n")
    .some(
      (line) =>
        line.includes(`\`${relativePath}\``) &&
        line.includes("historical-proof"),
    );
}

function collectMarkdownTruthFindings(rootDir) {
  const inventoryPath = path.join(rootDir, "docs/项目基础/文档清单.md");
  const inventory = fs.existsSync(inventoryPath)
    ? readTruthFile(rootDir, "docs/项目基础/文档清单.md")
    : "";
  const files = [
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    ...collectMarkdownFiles(rootDir, ".claude/rules"),
    ...collectMarkdownFiles(rootDir, "docs"),
  ]
    .filter((file, index, candidates) => candidates.indexOf(file) === index)
    .filter((file) => fs.existsSync(path.join(rootDir, file)));
  const failures = [];

  for (const file of files) {
    const content = readTruthFile(rootDir, file);
    if (isApprovedHistoricalDoc(file)) {
      if (!content.startsWith(HISTORICAL_BANNER)) {
        failures.push({
          file,
          error: `historical document must start with "${HISTORICAL_BANNER}"`,
        });
      }
      if (!inventoryMarksHistorical(inventory, file)) {
        failures.push({
          file,
          error:
            "historical document is not classified as historical-proof in docs/项目基础/文档清单.md",
        });
      }
      continue;
    }

    for (const pattern of RETIRED_PUBLIC_TRUTH_PATTERNS) {
      if (content.includes(pattern)) {
        failures.push({
          file,
          error: `forbidden retired current-truth pattern "${pattern}"`,
        });
      }
    }
  }

  return failures;
}

function extractFrontmatterPathGlobs(content) {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return [];
  return [...frontmatter[1].matchAll(/^\s*-\s*"([^"]+)"/gm)].map(
    (match) => match[1],
  );
}

function ruleGlobMatchesRealFile(glob, rootDir) {
  // A literal path (plain file like `next.config.ts`, or a Next.js route-group
  // directory like `src/app/[locale]/layout.tsx` where `[ ]` are glob character
  // classes rather than literal brackets) is alive when it exists on disk.
  if (fs.existsSync(path.join(rootDir, glob))) return true;
  try {
    return fs.globSync(glob, { cwd: rootDir }).length > 0;
  } catch {
    return false;
  }
}

// 护活真相：每个 .claude/rules/*.md 的 frontmatter `paths:` glob 都必须命中至少
// 一个真实文件。命中 0 个说明规则文件在为已删除/不存在的代码路径立规矩——
// 属于死 glob，必须失败，逼规则跟随真实代码路径。
function collectRuleFrontmatterGlobFindings(rootDir) {
  const rulesDir = ".claude/rules";
  const failures = [];
  for (const file of collectMarkdownFiles(rootDir, rulesDir)) {
    const content = readTruthFile(rootDir, file);
    for (const glob of extractFrontmatterPathGlobs(content)) {
      if (!ruleGlobMatchesRealFile(glob, rootDir)) {
        failures.push({
          file,
          error: `frontmatter paths glob matches no real file "${glob}"`,
        });
      }
    }
  }
  return failures;
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

  failures.push(...collectMarkdownTruthFindings(rootDir));
  failures.push(...collectRuleFrontmatterGlobFindings(rootDir));

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

  const runbookPath = path.join(rootDir, "docs/项目基础/发布验证.md");
  if (fs.existsSync(runbookPath)) {
    const runbook = readTruthFile(rootDir, "docs/项目基础/发布验证.md");
    const runbookCommandBlock = extractBashBlockAfterHeading(
      runbook,
      "## Current sequence",
    );
    if (runbookCommandBlock === null) {
      failures.push({
        file: "docs/项目基础/发布验证.md",
        error:
          'missing release-proof runbook command block after "## Current sequence"',
      });
    } else if (runbookCommandBlock !== getReleaseProofDocsCommandBlock()) {
      failures.push({
        file: "docs/项目基础/发布验证.md",
        error: "release-proof runbook command block drift from manifest",
      });
    }

    const runbookCommandLines = runbookCommandBlock
      ? runbookCommandBlock.split("\n")
      : [];

    for (const command of RELEASE_PROOF_SEQUENCE) {
      if (!runbookCommandLines.includes(command)) {
        failures.push({
          file: "docs/项目基础/发布验证.md",
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
        file: "docs/项目基础/发布验证.md",
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
  HISTORICAL_BANNER,
  HISTORICAL_DERIVATION_DOCS: [...HISTORICAL_DERIVATION_DOCS],
  RETIRED_PUBLIC_TRUTH_PATTERNS,
  collectCurrentTruthDocFindings,
  collectRuleFrontmatterGlobFindings,
  findCommandLineIndex,
  findOutOfOrderCommand,
  runTruthDocsCheck,
};
