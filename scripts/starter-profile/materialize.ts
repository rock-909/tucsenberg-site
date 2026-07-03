import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildStarterProfileMaterializationPlan,
  REPO_ROOT,
  shouldIncludeRepoPath,
} from "./file-sets";
import { shouldSkipCopyDirectory } from "./path-rules";
import {
  buildMaterializedMessageSet,
  materializedMessageRelativePaths,
} from "./messages";
import {
  collectMissingSourceWarnings,
  copySelectedFilesToOutput,
} from "./safe-copy";
import type {
  MaterializedFileSet,
  MaterializationWarning,
  StarterProfileMaterializationPlan,
} from "./types";
import {
  DEFAULT_STARTER_PROFILE_ID,
  isStarterProfileId,
  type StarterProfileId,
} from "../../src/config/starter-profiles";

const REPO_FILE_WALK_SKIP_NAMES = new Set([".DS_Store", "Thumbs.db"]);

export interface MaterializeCliOptions {
  profileId: StarterProfileId;
  dryRun: boolean;
  outputDirectory?: string;
  json: boolean;
}

export interface MaterializationResult {
  plan: StarterProfileMaterializationPlan;
  fileSet: MaterializedFileSet;
  outputDirectory?: string;
  dryRun: boolean;
}

function listRepoFilesFromDisk(
  directory = REPO_ROOT,
  relativeDirectory = "",
): string[] {
  if (relativeDirectory && shouldSkipCopyDirectory(relativeDirectory)) {
    return [];
  }

  const absoluteDirectory = path.join(directory, relativeDirectory);
  const entries = fs.readdirSync(absoluteDirectory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (REPO_FILE_WALK_SKIP_NAMES.has(entry.name)) {
      continue;
    }

    const relativePath = relativeDirectory
      ? path.posix.join(relativeDirectory, entry.name)
      : entry.name;

    if (entry.isDirectory()) {
      if (shouldSkipCopyDirectory(relativePath)) {
        continue;
      }

      files.push(...listRepoFilesFromDisk(directory, relativePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath.replaceAll("\\", "/"));
    }
  }

  return files;
}

function listRepoFiles(): string[] {
  try {
    return execFileSync("git", ["ls-files", "-z"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    })
      .split("\0")
      .filter(Boolean)
      .map((relativePath) => relativePath.replaceAll("\\", "/"));
  } catch {
    return listRepoFilesFromDisk();
  }
}

function buildMaterializedFileSet(
  profileId: StarterProfileId,
): MaterializedFileSet {
  const plan = buildStarterProfileMaterializationPlan(profileId);
  const includedFiles: string[] = [];
  const excludedFiles: string[] = [];

  for (const relativePath of listRepoFiles()) {
    if (shouldIncludeRepoPath(relativePath, plan)) {
      includedFiles.push(relativePath);
      continue;
    }

    excludedFiles.push(relativePath);
  }

  return {
    profileId,
    includedFiles,
    excludedFiles,
    warnings: plan.warnings,
  };
}

function formatDryRunReport(result: MaterializationResult): string {
  const { plan, fileSet } = result;
  const messageSet = buildMaterializedMessageSet(plan.profileId);
  const lines = [
    `Profile: ${plan.profileId}`,
    "",
    "Included route roots:",
    ...plan.includedRouteRoots.map((root) => `  - ${root}`),
    "",
    "Excluded route roots:",
    ...plan.excludedRouteRoots.map((root) => `  - ${root}`),
    "",
    "Included fixture packs:",
    ...(plan.includedFixtureRoots.length > 0
      ? plan.includedFixtureRoots.map((root) => `  - ${root}`)
      : ["  - (none)"]),
    "",
    "Excluded fixture packs:",
    ...plan.excludedFixtureRoots.map((root) => `  - ${root}`),
    "",
    "Excluded source roots (dependency closure):",
    ...plan.excludedSourceRoots.map((root) => `  - ${root}`),
    "",
    "Included message pack roots:",
    ...plan.includedMessagePackRoots.map((root) => `  - ${root}`),
    "",
    "Excluded message pack roots:",
    ...plan.excludedMessagePackRoots.map((root) => `  - ${root}`),
    "",
    "Included message namespaces:",
    ...plan.includedMessageNamespaces.map((namespace) => `  - ${namespace}`),
    "",
    "Excluded message namespaces:",
    ...plan.excludedMessageNamespaces.map((namespace) => `  - ${namespace}`),
    "",
    `Selected files: ${fileSet.includedFiles.length}`,
    `Skipped files: ${fileSet.excludedFiles.length}`,
    `Message pack files: ${materializedMessageRelativePaths(plan.profileId).length}`,
    `Compatibility files (composed on write): messages/{locale}/{critical,deferred}.json`,
    `Locales: ${messageSet.locales.join(", ")}`,
  ];

  if (fileSet.warnings.length > 0) {
    lines.push("", "Warnings:");
    for (const warning of fileSet.warnings) {
      lines.push(`  - [${warning.code}] ${warning.message}`);
    }
  }

  return lines.join("\n");
}

export function runMaterialization(
  options: MaterializeCliOptions,
): MaterializationResult {
  const plan = buildStarterProfileMaterializationPlan(options.profileId);
  const fileSet = buildMaterializedFileSet(options.profileId);
  const warnings: MaterializationWarning[] = [...plan.warnings];

  if (options.dryRun) {
    collectMissingSourceWarnings({
      repoRoot: REPO_ROOT,
      includedFiles: fileSet.includedFiles,
      profileId: options.profileId,
      warnings,
    });
  } else {
    if (!options.outputDirectory) {
      throw new Error("Materialization requires --out <directory>");
    }

    copySelectedFilesToOutput({
      repoRoot: REPO_ROOT,
      outputDirectory: options.outputDirectory,
      includedFiles: fileSet.includedFiles,
      profileId: options.profileId,
      warnings,
    });
  }

  return {
    plan,
    fileSet: {
      ...fileSet,
      warnings,
    },
    outputDirectory: options.outputDirectory,
    dryRun: options.dryRun,
  };
}

function hasFatalMaterializationWarnings(
  warnings: readonly MaterializationWarning[],
): boolean {
  return warnings.some((warning) => warning.type === "missing-source");
}

export function printMaterializationResult(
  result: MaterializationResult,
  json: boolean,
): void {
  if (hasFatalMaterializationWarnings(result.fileSet.warnings)) {
    process.exitCode = 1;
  }

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(formatDryRunReport(result));

  if (!result.dryRun && result.outputDirectory) {
    console.log("");
    console.log(`Wrote materialized starter to: ${result.outputDirectory}`);
  }
}

export function parseMaterializeCliArgs(
  argv: readonly string[],
): MaterializeCliOptions {
  let profileId: StarterProfileId = DEFAULT_STARTER_PROFILE_ID;
  let dryRun = false;
  let outputDirectory: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--profile") {
      const value = argv[index + 1];
      if (!value || !isStarterProfileId(value)) {
        throw new Error(
          "Expected --profile <minimal|company-site|b2b-lead|catalog|content-marketing|showcase-full>",
        );
      }
      profileId = value;
      index += 1;
      continue;
    }

    if (arg === "--out") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Expected --out <directory>");
      }
      outputDirectory = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    profileId,
    dryRun,
    outputDirectory,
    json,
  };
}

export function printCliHelp(): void {
  console.log(`Usage:
  pnpm profile:dry-run -- [--profile <id>] [--json]
  pnpm profile:materialize -- --profile <id> --out <directory> [--json]

Profiles:
  minimal, company-site (default), b2b-lead, catalog, content-marketing, showcase-full

Safety:
  Requires --dry-run or --out. Refuses to overwrite a non-empty output directory.
  Never deletes or modifies source repository files.`);
}
