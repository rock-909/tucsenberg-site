const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const {
  collectConsumedGuardrailExceptionIds,
  collectRegisteredGuardrailExceptionIds,
  isProductionFile,
} = require("./eslint-disable");
const {
  getReleaseProofDocsCommandBlock,
  getReleaseProofSequence,
} = require("../release-proof-manifest");

const ROOT = process.cwd();
const RELEASE_PROOF_SEQUENCE = getReleaseProofSequence();
const RETIRED_PUBLIC_TRUTH_PATTERNS = ["/api/verify-turnstile"];
const HISTORICAL_BANNER = "> Historical.";
const HISTORICAL_DERIVATION_DOCS = new Set([
  "docs/项目基础/替换顺序.md",
  "docs/项目基础/派生起步.md",
  "docs/项目基础/派生配置.md",
  "docs/项目基础/派生干跑验证.md",
]);
const DOCUMENT_LIFECYCLE_CLASSES = new Set([
  "current-entry",
  "current-reference",
  "current-proof",
  "inherited-starter-reference",
  "historical-proof",
  "method-workflow",
  "candidate-backlog",
]);

// 锚点文档必须存在；措辞不再钉死 —— 措辞真相由文档清单与路径存在性检查守护。
const REQUIRED_TRUTH_FILES = [
  "docs/项目基础/文档清单.md",
  "docs/README.md",
  "README.md",
  "docs/项目基础/AI协作边界.md",
  "docs/项目基础/维护入口.md",
  "docs/技术难题/性能实验优化方法论.md",
  "docs/项目基础/项目基础索引.md",
  "docs/决策记录/Radix联系表单试点.md",
  "docs/技术难题/验证入口.md",
  "docs/技术难题/性能记录.md",
  "docs/项目基础/维护规则.md",
  "docs/项目基础/内容.md",
  "docs/项目基础/项目基础.md",
  "docs/项目基础/消息文案.md",
  "docs/项目基础/替换边界.md",
  "docs/项目基础/配置.md",
  "docs/项目基础/发布验证.md",
  "docs/项目基础/验证等级.md",
  "docs/项目基础/架构图.svg",
  "docs/项目基础/生命周期.md",
  "docs/design/色彩系统.md",
  "docs/design/组件治理.md",
  "docs/design/设计真相.md",
  "docs/design/动效治理.md",
  "docs/design/设计系统说明.md",
  "docs/design/页面模式.md",
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
  ".claude/rules/content.md",
  ".claude/rules/i18n.md",
  ".claude/rules/testing.md",
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

function hasGitMetadata(rootDir) {
  return fs.existsSync(path.join(rootDir, ".git"));
}

function collectTrackedDocFiles(rootDir) {
  if (!hasGitMetadata(rootDir)) return [];

  const output = execFileSync(
    "git",
    ["-c", "core.quotepath=false", "ls-files", "-z", "--", "docs"],
    { cwd: rootDir, encoding: "utf8" },
  );
  return output.split("\0").filter(Boolean).sort();
}

function collectTrackedMarkdownDocs(rootDir) {
  return collectTrackedDocFiles(rootDir).filter((file) => file.endsWith(".md"));
}

function inventoryHasFileEntry(inventory, file) {
  const expectedCell = `\`${file}\``;
  return inventory.split("\n").some((line) => {
    const cells = line
      .trim()
      .replace(/^\|/u, "")
      .replace(/\|$/u, "")
      .split("|")
      .map((cell) => cell.trim());
    if (cells.length < 3 || cells[0] !== expectedCell) return false;

    const lifecycleClasses = [...cells[1].matchAll(/`([^`]+)`/gu)].map(
      (match) => match[1],
    );
    const hasValidClasses =
      lifecycleClasses.length > 0 &&
      lifecycleClasses.every((value) => DOCUMENT_LIFECYCLE_CLASSES.has(value));
    return hasValidClasses && cells.slice(2).join("|").trim().length > 0;
  });
}

function collectDocumentInventoryFindings(rootDir, trackedDocs) {
  const inventoryPath = "docs/项目基础/文档清单.md";
  const inventory = readTruthFile(rootDir, inventoryPath);
  const docs = trackedDocs ?? collectTrackedDocFiles(rootDir);

  return docs
    .filter((file) => !inventoryHasFileEntry(inventory, file))
    .map((file) => ({
      file: inventoryPath,
      error: `tracked document is missing from inventory "${file}"`,
    }));
}

function inventoryMarksCurrent(inventory, relativePath) {
  return inventory
    .split("\n")
    .some(
      (line) =>
        line.includes(`\`${relativePath}\``) && line.includes("`current-"),
    );
}

function inventoryMarksHistoricalProof(inventory, relativePath) {
  return inventory
    .split("\n")
    .some(
      (line) =>
        line.includes(`\`${relativePath}\``) &&
        line.includes("`historical-proof`"),
    );
}

function normalizeDocumentedRepoPath(rawPath) {
  const trimmed = rawPath.trim().replace(/[.,;]$/u, "");
  if (/\s/u.test(trimmed)) return null;
  return trimmed.replace(/(?::\d[\d,-]*|#L\d+(?:-L\d+)?)$/u, "");
}

function documentedRepoPathExists(rootDir, documentedPath) {
  if (fs.existsSync(path.join(rootDir, documentedPath))) return true;

  try {
    const firstPatternIndex = documentedPath.search(/[?*{]/u);
    if (firstPatternIndex !== -1) {
      const staticPrefix = documentedPath
        .slice(0, firstPatternIndex)
        .replace(/\/$/u, "");
      const staticRoot = path.join(rootDir, staticPrefix);
      if (staticPrefix && fs.existsSync(staticRoot)) {
        const relativePattern = documentedPath
          .slice(staticPrefix.length)
          .replace(/^\/+/, "");
        return fs.globSync(relativePattern, { cwd: staticRoot }).length > 0;
      }
    }
    return fs.globSync(documentedPath, { cwd: rootDir }).length > 0;
  } catch {
    return false;
  }
}

// 显式豁免：默认所有反引号 src/tests 路径都必须存在；只有行内带
// truth-docs:allow-missing 标记（HTML 注释形式）的行允许路径缺失。
// 混合句（同行既有活路径又有故意缺失路径）应拆句后再打标记。
const ALLOW_MISSING_MARKER = "truth-docs:allow-missing";

function lineAllowsMissingDocumentedPath(content, lineStart, matchIndex) {
  const lineEnd = content.indexOf("\n", matchIndex);
  const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return line.includes(ALLOW_MISSING_MARKER);
}

function collectBacktickedRepoPathFindings(rootDir, documentedFiles) {
  if (documentedFiles === undefined && !hasGitMetadata(rootDir)) return [];

  const inventory = readTruthFile(rootDir, "docs/项目基础/文档清单.md");
  const currentDocs = documentedFiles ?? [
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    ...collectMarkdownFiles(rootDir, ".claude/rules"),
    ...collectTrackedMarkdownDocs(rootDir).filter(
      (file) =>
        inventoryMarksCurrent(inventory, file) &&
        !inventoryMarksHistoricalProof(inventory, file) &&
        !file.startsWith("docs/技术难题/整库审查2026-07/"),
    ),
  ];
  const findings = [];

  for (const file of currentDocs) {
    const content = readTruthFile(rootDir, file);
    for (const match of content.matchAll(/`((?:src|tests)\/[^`\n]+)`/gu)) {
      const documentedPath = normalizeDocumentedRepoPath(match[1]);
      if (!documentedPath) continue;
      if (documentedRepoPathExists(rootDir, documentedPath)) continue;
      const lineStart = content.lastIndexOf("\n", match.index) + 1;
      if (lineAllowsMissingDocumentedPath(content, lineStart, match.index)) {
        continue;
      }
      findings.push({
        file,
        error: `documented repository path does not exist "${documentedPath}"`,
      });
    }
  }

  return findings;
}

function collectGuardrailRegistryFindings(rootDir, productionSourceFiles) {
  if (productionSourceFiles === undefined && !hasGitMetadata(rootDir))
    return [];

  const registerPath = "docs/项目基础/维护规则.md";
  const registeredIds = collectRegisteredGuardrailExceptionIds(
    readTruthFile(rootDir, registerPath),
  );
  if (registeredIds.size === 0) return [];

  const candidateSourceFiles =
    productionSourceFiles ??
    execFileSync(
      "git",
      ["ls-files", "-z", "--", "src", "*.js", "*.mjs", "*.ts", "*.tsx"],
      { cwd: rootDir, encoding: "utf8" },
    )
      .split("\0")
      .filter(Boolean);
  const sourceFiles = candidateSourceFiles.filter(
    (file) => isProductionFile(file) && /\.(?:[cm]?[jt]sx?)$/u.test(file),
  );
  const consumedIds = new Set();

  for (const file of sourceFiles) {
    const content = readTruthFile(rootDir, file);
    for (const id of collectConsumedGuardrailExceptionIds(file, content)) {
      consumedIds.add(id);
    }
  }

  return [...registeredIds]
    .filter((id) => !consumedIds.has(id))
    .map((id) => ({
      file: registerPath,
      error: `registered guardrail exception has no production consumer "${id}"`,
    }));
}

function collectDocLivenessFindings(rootDir) {
  return [
    ...collectDocumentInventoryFindings(rootDir),
    ...collectBacktickedRepoPathFindings(rootDir),
    ...collectGuardrailRegistryFindings(rootDir),
  ];
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
    relativePath.startsWith("docs/技术难题/整库整改2026-07/") ||
    relativePath.startsWith("docs/技术难题/门禁机械遵守审查2026-07/")
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

  for (const file of REQUIRED_TRUTH_FILES) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      failures.push({
        file,
        error: `missing required current-truth file "${file}"`,
      });
    }
  }

  failures.push(...collectMarkdownTruthFindings(rootDir));
  failures.push(...collectRuleFrontmatterGlobFindings(rootDir));
  failures.push(...collectDocLivenessFindings(rootDir));

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
  REQUIRED_TRUTH_FILES,
  CURRENT_TRUTH_COMMAND_DOCS,
  HISTORICAL_BANNER,
  HISTORICAL_DERIVATION_DOCS: [...HISTORICAL_DERIVATION_DOCS],
  RETIRED_PUBLIC_TRUTH_PATTERNS,
  collectCurrentTruthDocFindings,
  collectBacktickedRepoPathFindings,
  collectDocumentInventoryFindings,
  collectGuardrailRegistryFindings,
  collectRuleFrontmatterGlobFindings,
  findCommandLineIndex,
  findOutOfOrderCommand,
  runTruthDocsCheck,
};
