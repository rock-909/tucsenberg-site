import fs from "node:fs";
import path from "node:path";
import { getStubOverrideForPath } from "./dependency-closure";
import { REPO_ROOT } from "./file-sets";
import { shouldSkipCopyDirectory } from "./path-rules";
import { transformMaterializedFileContent } from "./transforms";
import { composeMessagesForProfileFromFiles } from "./messages";
import type { MaterializationWarning } from "./types";
import type { StarterProfileId } from "../../src/config/starter-profiles";

const MESSAGE_RELATIVE_PATHS = [
  "messages/en/critical.json",
  "messages/en/deferred.json",
  "messages/zh/critical.json",
  "messages/zh/deferred.json",
] as const;

interface CopySelectedFilesOptions {
  repoRoot: string;
  outputDirectory: string;
  includedFiles: readonly string[];
  profileId: StarterProfileId;
  warnings: MaterializationWarning[];
}

interface MissingSourceWarningOptions {
  repoRoot: string;
  includedFiles: readonly string[];
  profileId: StarterProfileId;
  warnings: MaterializationWarning[];
}

function assertSafeOutputDirectory(
  repoRoot: string,
  outputDirectory: string,
): void {
  const resolvedRepoRoot = fs.realpathSync.native(path.resolve(repoRoot));
  const resolvedOutputTarget = path.resolve(outputDirectory);

  if (resolvedOutputTarget === resolvedRepoRoot) {
    throw new Error("Output directory cannot be the repository root");
  }

  if (resolvedOutputTarget.startsWith(`${resolvedRepoRoot}${path.sep}`)) {
    throw new Error(
      "Output directory cannot be inside the repository. Choose a path outside the starter checkout.",
    );
  }

  if (fs.existsSync(resolvedOutputTarget)) {
    const entries = fs.readdirSync(resolvedOutputTarget);
    if (entries.length > 0) {
      throw new Error(
        `Output directory is not empty: ${resolvedOutputTarget}. Choose a new path instead of overwriting.`,
      );
    }
  }
}

function ensureParentDirectory(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function isBinaryAssetPath(relativePath: string): boolean {
  const extension = path.extname(relativePath).toLowerCase();
  return [
    ".png",
    ".ico",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".woff",
    ".woff2",
  ].includes(extension);
}

function readSourceContent(
  repoRoot: string,
  relativePath: string,
  profileId: StarterProfileId,
): string {
  const stubPath = getStubOverrideForPath(profileId, relativePath);
  const sourcePath = stubPath ?? path.join(repoRoot, relativePath);
  return fs.readFileSync(sourcePath, "utf8");
}

function copyBinaryFile(
  repoRoot: string,
  outputDirectory: string,
  relativePath: string,
  profileId: StarterProfileId,
): void {
  const stubPath = getStubOverrideForPath(profileId, relativePath);
  const sourcePath = stubPath ?? path.join(repoRoot, relativePath);
  const destinationPath = path.join(outputDirectory, relativePath);
  ensureParentDirectory(destinationPath);
  fs.copyFileSync(sourcePath, destinationPath);
}

function writeOutputFile(
  outputDirectory: string,
  relativePath: string,
  content: string,
): void {
  const destinationPath = path.join(outputDirectory, relativePath);
  ensureParentDirectory(destinationPath);
  fs.writeFileSync(destinationPath, content);
}

function writeComposedMessageFile(
  repoRoot: string,
  outputDirectory: string,
  relativePath: string,
  profileId: StarterProfileId,
): void {
  const composedMessages = composeMessagesForProfileFromFiles({
    repoRoot,
    profileId,
    relativePath,
  });

  writeOutputFile(
    outputDirectory,
    relativePath,
    `${JSON.stringify(composedMessages, null, 2)}\n`,
  );
}

function recordMissingSourceWarning(
  warnings: MaterializationWarning[],
  relativePath: string,
): void {
  warnings.push({
    code: "missing-source",
    message: `Missing included source file: ${relativePath}`,
    path: relativePath,
    type: "missing-source",
  });
}

function copyRegularFile(
  repoRoot: string,
  outputDirectory: string,
  relativePath: string,
  profileId: StarterProfileId,
): void {
  if (isBinaryAssetPath(relativePath)) {
    copyBinaryFile(repoRoot, outputDirectory, relativePath, profileId);
    return;
  }

  const rawContent = readSourceContent(repoRoot, relativePath, profileId);
  const transformedContent = transformMaterializedFileContent(
    relativePath,
    rawContent,
    profileId,
  );
  writeOutputFile(outputDirectory, relativePath, transformedContent);
}

export function collectMissingSourceWarnings(
  options: MissingSourceWarningOptions,
): void {
  const { repoRoot, includedFiles, profileId, warnings } = options;
  const messagePaths = new Set<string>(MESSAGE_RELATIVE_PATHS);

  for (const relativePath of includedFiles) {
    if (
      shouldSkipCopyDirectory(relativePath) ||
      messagePaths.has(relativePath)
    ) {
      continue;
    }

    const sourcePath = path.join(repoRoot, relativePath);
    const stubPath = getStubOverrideForPath(profileId, relativePath);

    if (!stubPath && !fs.existsSync(sourcePath)) {
      recordMissingSourceWarning(warnings, relativePath);
    }
  }
}

export function copySelectedFilesToOutput(
  options: CopySelectedFilesOptions,
): void {
  const { repoRoot, outputDirectory, includedFiles, profileId } = options;
  const resolvedOutput = path.resolve(outputDirectory);

  assertSafeOutputDirectory(repoRoot, resolvedOutput);
  fs.mkdirSync(resolvedOutput, { recursive: true });

  const messagePaths = new Set<string>(MESSAGE_RELATIVE_PATHS);

  for (const relativePath of includedFiles) {
    if (shouldSkipCopyDirectory(relativePath)) {
      continue;
    }

    const sourcePath = path.join(repoRoot, relativePath);
    const stubPath = getStubOverrideForPath(profileId, relativePath);

    if (messagePaths.has(relativePath)) {
      writeComposedMessageFile(
        repoRoot,
        resolvedOutput,
        relativePath,
        profileId,
      );
      continue;
    }

    if (!stubPath && !fs.existsSync(sourcePath)) {
      recordMissingSourceWarning(options.warnings, relativePath);
      continue;
    }

    copyRegularFile(repoRoot, resolvedOutput, relativePath, profileId);
  }
}

export function assertOutputDirectoryOutsideRepo(
  outputDirectory: string,
): void {
  assertSafeOutputDirectory(REPO_ROOT, outputDirectory);
}
