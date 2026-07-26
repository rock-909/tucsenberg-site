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

// 这两个是登记体系本身的支点：清单是所有其他文档"必须存在"的来源，README 是
// 唯一不由清单登记的根入口。它们缺了，整个对账没有立足点。
//
// 其余文档的存在性由清单负责，双向对账：tracked 文档没登记会报，登记了的路径
// 不存在也会报。这里以前是一份 43 条硬编码路径的手抄清单外加两份命令文档清单，
// 三份都是文件系统的手抄镜像——漏登记一个新文档，它就一条都不检查，而且没有
// 任何信号。
//
// 语义上和旧清单有一处真实差别，是有意的：删一个文档时，只删文件会被清单撞红，
// 连登记行一起删则通过。那是一次显式的、diff 里看得见的退役决定，而不是悄悄
// 消失。旧写法要求改门禁脚本本身，强度差别只在这一步的显眼程度。
const REQUIRED_TRUTH_ANCHORS = ["README.md", "docs/项目基础/文档清单.md"];

// pnpm 自带子命令，不是 package script；还有 `pnpm 11` 这种版本号写法。
const PNPM_BUILTIN_COMMANDS = new Set([
  "add",
  "audit",
  "bin",
  "config",
  "create",
  "deploy",
  "dlx",
  "env",
  "exec",
  "fetch",
  "import",
  "init",
  "install",
  "licenses",
  "link",
  "list",
  "ls",
  "outdated",
  "pack",
  "patch",
  "prune",
  "publish",
  "rebuild",
  "remove",
  "root",
  "setup",
  "store",
  "unlink",
  "update",
  "why",
]);

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

const INVENTORY_PATH = "docs/项目基础/文档清单.md";

/**
 * One inventory row: `| \`path\` | \`label\`, \`label\` | notes |`.
 *
 * Cells are parsed positionally rather than by searching the whole line. A
 * line-wide `includes` lets a row's notes reclassify a different document —
 * mention `\`docs/current.md\`` in a `historical-proof` row and the real
 * current doc silently drops out of every derived check.
 */
function parseInventoryRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return null;

  const cells = trimmed
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cell.trim());
  if (cells.length < 3) return null;
  // 表头分隔行。
  if (/^:?-{3,}:?$/u.test(cells[0])) return null;

  const registered = cells[0].match(/^`([^`]+)`$/u)?.[1];
  if (!registered) return { malformed: cells[0] };

  return {
    registered,
    labels: new Set(
      [...cells[1].matchAll(/`([^`]+)`/gu)].map((match) => match[1]),
    ),
  };
}

function isSeparatorRow(line) {
  return /^\|(?:\s*:?-{3,}:?\s*\|)+$/u.test(line.trim());
}

function collectInventoryRows(rootDir) {
  const lines = readTruthFile(rootDir, INVENTORY_PATH).split("\n");

  return lines
    .map((line, index) =>
      // 表头行的下一行是分隔行，这是 Markdown 表格里表头的定义。
      isSeparatorRow(lines[index + 1] ?? "") ? null : parseInventoryRow(line),
    )
    .filter(Boolean);
}

/**
 * The other direction: the inventory registers a reason for every tracked doc,
 * so a row whose file is gone is a doc that was deleted while the registry
 * still vouches for it. `collectDocumentInventoryFindings` only walks
 * tracked → registered.
 */
function collectInventoryPathFindings(rootDir) {
  const findings = [];

  for (const row of collectInventoryRows(rootDir)) {
    // 第一格解析不出反引号路径的行不能静默跳过：它读起来仍然像一条登记，
    // 但两个方向的对账都看不见它。
    if (row.malformed !== undefined) {
      findings.push({
        file: INVENTORY_PATH,
        error: `inventory row does not name a backticked path "${row.malformed}"`,
      });
      continue;
    }
    // 目录行也要查——目录连同内容一起删掉、登记行留着，同样是清单在替一个
    // 不存在的东西背书。
    if (fs.existsSync(path.join(rootDir, row.registered))) continue;

    findings.push({
      file: INVENTORY_PATH,
      error: `inventory registers a path that no longer exists "${row.registered}"`,
    });
  }

  return findings;
}

/**
 * 规则文件必须在清单里登记。
 *
 * 这条是删除方向的守卫，不是整洁癖。`.claude/rules/*.md` 靠 frontmatter 的
 * `paths` 自动加载，删掉一个，它就只是安静地不再生效——没有 import 断裂、
 * 没有测试变红。登记之后，删文件必须同时删登记行，那是 diff 里看得见的一笔；
 * 只删文件的话，上面的 inventory→磁盘 对账会立刻报出来。
 */
function collectRuleFileInventoryFindings(rootDir) {
  const registered = new Set(
    collectInventoryRows(rootDir)
      .filter((row) => row.registered !== undefined)
      .map((row) => row.registered),
  );

  return collectMarkdownFiles(rootDir, ".claude/rules")
    .filter((file) => !registered.has(file))
    .map((file) => ({
      file: INVENTORY_PATH,
      error: `rule file is missing from inventory "${file}"`,
    }));
}

/**
 * 一个文档自己那行的标签，不看别人行里怎么提到它。
 *
 * 已知边界，是有意留的：把一份文档从 `current-reference` 改成
 * `historical-proof`，它就退出路径和命令对账。那是清单里一次显式的降级，
 * diff 上看得见，也正是"这份文档不再是当前真相"的正规说法。门禁的职责是让
 * 这一步必须写出来，不是让它做不到。
 */
function getInventoryLabels(rows, relativePath) {
  const labels = new Set();
  for (const row of rows) {
    if (row.registered !== relativePath) continue;
    for (const label of row.labels) labels.add(label);
  }
  return labels;
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

// 显式豁免：默认所有反引号 src / tests / docs / .claude 路径都必须存在。
// 标记必须点名它豁免哪条路径：
//
//   <!-- truth-docs:allow-missing docs/plans/** -->
//
// 整行豁免不行。混合句里既有故意缺失的路径又有当前活路径，整行豁免会把活
// 路径一起放过，后面往同一行塞任何坏路径都不会被发现。
const ALLOW_MISSING_MARKER =
  /truth-docs:allow-missing\s+([^\s>]+(?:\s+[^\s>]+)*?)\s*-->/gu;

function collectAllowedMissingPaths(line) {
  const allowed = new Set();
  for (const match of line.matchAll(ALLOW_MISSING_MARKER)) {
    for (const documentedPath of match[1].split(/\s+/u)) {
      allowed.add(documentedPath.replace(/^`|`$/gu, ""));
    }
  }
  return allowed;
}

function lineAllowsMissingDocumentedPath(
  content,
  lineStart,
  matchIndex,
  documentedPath,
) {
  const lineEnd = content.indexOf("\n", matchIndex);
  const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return collectAllowedMissingPaths(line).has(documentedPath);
}

/**
 * The docs that currently claim to be true: the root README, the rule files,
 * and every tracked doc the inventory marks `current-*`.
 *
 * Derived, not listed. A hand list here would need editing every time a doc is
 * added, and the direction it fails in is silent — a new doc simply is not
 * checked. `AGENTS.md` / `CLAUDE.md` stay out by construction: instruction
 * files carry no machine-enforced content assertions (see 判断准则 in
 * `AGENTS.md`).
 */
function collectCurrentDocumentedFiles(rootDir) {
  if (!fs.existsSync(path.join(rootDir, INVENTORY_PATH))) return [];
  const rows = collectInventoryRows(rootDir);

  return [
    "README.md",
    ...collectMarkdownFiles(rootDir, ".claude/rules"),
    ...collectTrackedMarkdownDocs(rootDir).filter((file) => {
      // 同时挂 current-* 和 historical-proof 的文档算当前文档：它自己声明
      // 里面有仍在用的参考。以前"带 historical-proof 就排除"，等于改一个
      // 标签就能让整份文档退出路径和命令对账。
      const labels = getInventoryLabels(rows, file);
      return (
        [...labels].some((label) => label.startsWith("current-")) &&
        !file.startsWith("docs/技术难题/整库审查2026-07/")
      );
    }),
  ];
}

function collectBacktickedRepoPathFindings(rootDir, documentedFiles) {
  if (documentedFiles === undefined && !hasGitMetadata(rootDir)) return [];

  const currentDocs = documentedFiles ?? collectCurrentDocumentedFiles(rootDir);
  const findings = [];

  for (const file of currentDocs) {
    const content = readTruthFile(rootDir, file);
    // `docs/` and `.claude/` are in scope alongside source paths: a live doc
    // pointing at a deleted doc or rule file is the same broken reference.
    for (const match of content.matchAll(
      /`((?:src|tests|docs|\.claude)\/[^`\n]+)`/gu,
    )) {
      const documentedPath = normalizeDocumentedRepoPath(match[1]);
      if (!documentedPath) continue;
      if (documentedRepoPathExists(rootDir, documentedPath)) continue;
      const lineStart = content.lastIndexOf("\n", match.index) + 1;
      if (
        lineAllowsMissingDocumentedPath(
          content,
          lineStart,
          match.index,
          documentedPath,
        )
      ) {
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

// 审查/整改记录按日期开目录，例如 docs/技术难题/门禁断言审查2026-07-24/。
// 它们如实记载已退役的路由/API 名，不该被 forbidden pattern 追溯定罪。
// 原来这里逐个列目录名，意味着每开一轮审查都要改这个脚本，漏改的目录会安静地
// 掉回 current-truth 分支——已经漏了 3 个。改成按目录命名规则判定。
const DATED_AUDIT_DIRECTORY_PATTERN =
  /^docs\/技术难题\/[^/]*\d{4}-\d{2}[^/]*\//u;

function isDatedAuditDoc(relativePath) {
  return DATED_AUDIT_DIRECTORY_PATTERN.test(relativePath);
}

function isApprovedHistoricalDoc(relativePath) {
  return (
    HISTORICAL_DERIVATION_DOCS.has(relativePath) ||
    relativePath.startsWith("docs/superpowers/") ||
    relativePath.startsWith("docs/audits/") ||
    isDatedAuditDoc(relativePath)
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
    ...collectMarkdownFiles(rootDir, ".claude/rules"),
    ...collectMarkdownFiles(rootDir, "docs"),
  ]
    .filter((file, index, candidates) => candidates.indexOf(file) === index)
    .filter((file) => fs.existsSync(path.join(rootDir, file)));
  const failures = [];

  for (const file of files) {
    const content = readTruthFile(rootDir, file);

    // A dated audit directory declares itself in the path every reader already
    // sees. Demanding a banner and an inventory class on top made the same fact
    // true in three places, and the two extra places are what kept breaking CI.
    if (isDatedAuditDoc(file)) continue;

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
    const explicitRun = match[1] !== undefined;
    const scriptName = match[2];
    // `pnpm run audit` 明确说了要跑 package script。裸 `pnpm audit` 才是
    // pnpm 自带子命令，两者不能一起跳过——否则把内置名写在 run 后面就永远
    // 不会被查出来。
    if (!explicitRun && PNPM_BUILTIN_COMMANDS.has(scriptName)) continue;
    // `pnpm 11`：文档在写运行时版本要求，不是在调脚本。只放行纯版本号，
    // 数字开头的真实脚本名（`2fa:check`）仍然要查。
    if (/^\d[\d.]*$/u.test(scriptName)) continue;

    const lineStart = content.lastIndexOf("\n", match.index) + 1;
    const lineEnd = content.indexOf("\n", match.index);
    const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (line.includes("没有 canonical")) continue;
    // 记录一个已退役脚本时用 `<!-- truth-docs:allow-missing pnpm:名字 -->`，
    // 和路径豁免同一套标记，同样必须点名，不是整行放行。
    if (collectAllowedMissingPaths(line).has(`pnpm:${scriptName}`)) continue;

    commands.push({ line, scriptName });
  }

  return commands;
}

function collectCurrentTruthDocFindings(rootDir = ROOT) {
  const failures = [];

  for (const file of REQUIRED_TRUTH_ANCHORS) {
    if (!fs.existsSync(path.join(rootDir, file))) {
      failures.push({
        file,
        error: `missing required current-truth file "${file}"`,
      });
    }
  }

  failures.push(...collectInventoryPathFindings(rootDir));
  failures.push(...collectRuleFileInventoryFindings(rootDir));

  failures.push(...collectMarkdownTruthFindings(rootDir));
  failures.push(...collectRuleFrontmatterGlobFindings(rootDir));
  failures.push(...collectDocLivenessFindings(rootDir));

  const packageJsonPath = path.join(rootDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readTruthFile(rootDir, "package.json"));
    const scripts = getPackageScripts(packageJson);
    // 每一份还在声称"当前为真"的文档都要过这一关，不是七份手工点名的。
    const commandDocs = collectCurrentDocumentedFiles(rootDir);

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
  REQUIRED_TRUTH_ANCHORS,
  collectCurrentDocumentedFiles,
  collectInventoryPathFindings,
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
