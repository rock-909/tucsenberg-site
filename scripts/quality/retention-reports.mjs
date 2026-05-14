#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_KEEP_COUNT = 5;
const REPORTS_DIR = "reports";
const TRASH_DIR = "reports/.trash";
const GENERATED_MARKDOWN_FAMILY_PATTERN =
  /^reports\/architecture\/legacy-marker-audit[-_.]20/u;
const LATEST_FILE_PATTERN = /(?:^|[-_.])latest$/u;
const REPORT_EXTENSIONS = new Set([".json", ".sarif", ".txt", ".log"]);
const TIMESTAMPED_BASENAME_PATTERN =
  /^(?<prefix>.+?)[-_.](?<timestamp>20\d{2}(?:[-_.]?\d{2}){2}(?:[T_-]?\d{2}(?:[-_.:]?\d{2}){0,3})?)$/u;

function toRepoPath(rootDir, absolutePath) {
  return path.relative(rootDir, absolutePath).split(path.sep).join("/");
}

function toAbsolutePath(rootDir, repoPath) {
  return path.join(rootDir, ...repoPath.split("/"));
}

function normalizeTimestamp(timestamp) {
  return timestamp.replace(/\D/gu, "");
}

function createTrashBatchName() {
  return `retention-${new Date().toISOString().replace(/[:.]/gu, "-")}`;
}

function isLatestReport(repoPath) {
  const parsed = path.parse(repoPath);
  return LATEST_FILE_PATTERN.test(parsed.name);
}

function isGeneratedMarkdownCandidate(repoPath) {
  return GENERATED_MARKDOWN_FAMILY_PATTERN.test(repoPath);
}

function getReportCandidate(repoPath) {
  if (!repoPath.startsWith(`${REPORTS_DIR}/`)) return null;
  if (repoPath.startsWith(`${TRASH_DIR}/`)) return null;
  if (isLatestReport(repoPath)) return null;

  const parsed = path.parse(repoPath);
  const extension = parsed.ext.toLowerCase();
  const isReportExtension = REPORT_EXTENSIONS.has(extension);
  const isGeneratedMarkdown =
    extension === ".md" && isGeneratedMarkdownCandidate(repoPath);

  if (!isReportExtension && !isGeneratedMarkdown) return null;

  const match = parsed.name.match(TIMESTAMPED_BASENAME_PATTERN);
  const groups = match?.groups;
  if (!groups) return null;

  return {
    groupKey: path
      .join(parsed.dir, `${groups.prefix}${extension}`)
      .split(path.sep)
      .join("/"),
    repoPath,
    sortKey: normalizeTimestamp(groups.timestamp),
  };
}

function collectReportFiles(rootDir) {
  const reportsRoot = path.join(rootDir, REPORTS_DIR);
  const files = [];
  if (!fs.existsSync(reportsRoot)) return files;

  function walk(currentPath) {
    const repoPath = toRepoPath(rootDir, currentPath);
    if (repoPath === TRASH_DIR || repoPath.startsWith(`${TRASH_DIR}/`)) {
      return;
    }

    const stats = fs.lstatSync(currentPath);
    if (stats.isSymbolicLink()) return;

    if (stats.isDirectory()) {
      for (const entry of fs.readdirSync(currentPath, {
        withFileTypes: true,
      })) {
        walk(path.join(currentPath, entry.name));
      }
      return;
    }

    if (stats.isFile()) files.push(repoPath);
  }

  walk(reportsRoot);
  return files.sort((left, right) => left.localeCompare(right));
}

function buildMoveTarget(repoPath, trashBatchName) {
  return `${TRASH_DIR}/${trashBatchName}/${repoPath}`;
}

export function collectReportRetentionPlan(options) {
  const { rootDir = process.cwd(), keep = DEFAULT_KEEP_COUNT } = options;
  const trashBatchName = options.trashBatchName ?? createTrashBatchName();
  const candidatesByGroup = new Map();

  for (const repoPath of collectReportFiles(rootDir)) {
    const candidate = getReportCandidate(repoPath);
    if (!candidate) continue;

    const group = candidatesByGroup.get(candidate.groupKey) ?? [];
    group.push(candidate);
    candidatesByGroup.set(candidate.groupKey, group);
  }

  const groups = [];
  const moves = [];

  for (const [groupKey, candidates] of candidatesByGroup) {
    const sortedCandidates = candidates.toSorted((left, right) =>
      right.sortKey.localeCompare(left.sortKey),
    );
    const kept = sortedCandidates.slice(0, keep).map((item) => item.repoPath);
    const pruned = sortedCandidates.slice(keep).map((item) => item.repoPath);

    groups.push({ groupKey, kept, pruned });
    for (const repoPath of pruned) {
      moves.push({
        from: repoPath,
        to: buildMoveTarget(repoPath, trashBatchName),
      });
    }
  }

  return {
    groups: groups.toSorted((left, right) =>
      left.groupKey.localeCompare(right.groupKey),
    ),
    keep,
    moves,
    rootDir,
    trashBatchName,
  };
}

export function parseReportRetentionArgs(args) {
  const parsed = {
    dryRun: false,
    help: false,
    keep: DEFAULT_KEEP_COUNT,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args.at(index);
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--keep") {
      const value = args.at(index + 1);
      parsed.keep = parseKeepCount(value);
      index += 1;
      continue;
    }
    if (arg?.startsWith("--keep=")) {
      parsed.keep = parseKeepCount(arg.slice("--keep=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function parseKeepCount(value) {
  const keep = Number(value);
  if (!Number.isInteger(keep) || keep < 1) {
    throw new Error("--keep must be a positive integer.");
  }
  return keep;
}

export function runReportRetention(options) {
  const plan = collectReportRetentionPlan(options);
  if (options.dryRun) return { moved: [], plan };

  const moved = [];
  for (const move of plan.moves) {
    const source = toAbsolutePath(plan.rootDir, move.from);
    const target = toAbsolutePath(plan.rootDir, move.to);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(source, target);
    moved.push(move);
  }

  return { moved, plan };
}

function printHelp() {
  console.log(`Usage: node scripts/quality/retention-reports.mjs [options]

Options:
  --dry-run       Print files that would move without changing the filesystem
  --keep <count>  Keep newest timestamped reports per family (default: 5)
  -h, --help      Show this help

Cleanup is Trash-first: pruned files move to reports/.trash/retention-*/.`);
}

function printResult(result, dryRun) {
  const action = dryRun ? "would move" : "moved";
  if (result.plan.moves.length === 0) {
    console.log(
      "[reports-retention] no generated timestamped reports to prune",
    );
    return;
  }

  for (const move of result.plan.moves) {
    console.log(`[reports-retention] ${action}: ${move.from} -> ${move.to}`);
  }
}

function main() {
  try {
    const args = parseReportRetentionArgs(process.argv.slice(2));
    if (args.help) {
      printHelp();
      return;
    }

    const result = runReportRetention({
      dryRun: args.dryRun,
      keep: args.keep,
      rootDir: process.cwd(),
    });
    printResult(result, args.dryRun);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[reports-retention] ${message}`);
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  main();
}
