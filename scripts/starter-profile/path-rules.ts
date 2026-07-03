const COPY_SKIP_DIRECTORY_ROOTS = [
  ".git",
  ".next",
  "node_modules",
  "reports",
  "coverage",
  "storybook-static",
  "playwright-report",
  "test-results",
  ".agents",
  ".antigravitycli",
  ".context",
  ".superpowers",
  ".codex",
  ".claude/skills",
  ".impeccable",
  ".open-next",
  ".lighthouseci",
  ".omx",
  ".cursor",
  ".worktrees",
  ".wrangler",
  "docs/archive",
  "docs/superpowers",
] as const;

const COPY_SKIP_FILE_PATHS = [
  ".coderabbit.yaml",
  ".eslintcache",
  ".claude/settings.json",
  ".claude/settings.local.json",
  ".claude/git.local.md",
  "conductor.json",
  "conductor-setup.sh",
  "FINDINGS.md",
  "REPAIR-BACKLOG.md",
  "NEXT-WAVE.md",
  "skills-lock.json",
  "unified_inbox.json",
] as const;

export function normalizeRepoRelativePath(relativePath: string): string {
  return relativePath.replaceAll("\\", "/");
}

export function isUnderRepoRoot(relativePath: string, root: string): boolean {
  const normalizedPath = normalizeRepoRelativePath(relativePath);
  const normalizedRoot = normalizeRepoRelativePath(root).replace(/\/\*\*$/, "");

  return (
    normalizedPath === normalizedRoot ||
    normalizedPath.startsWith(`${normalizedRoot}/`)
  );
}

export function shouldSkipCopyDirectory(relativePath: string): boolean {
  const normalizedPath = normalizeRepoRelativePath(relativePath);

  return COPY_SKIP_DIRECTORY_ROOTS.some((skipRoot) => {
    const normalizedSkip = normalizeRepoRelativePath(skipRoot);
    return (
      normalizedPath === normalizedSkip ||
      normalizedPath.startsWith(`${normalizedSkip}/`)
    );
  });
}

export function isLocalOnlyFile(relativePath: string): boolean {
  const normalizedPath = normalizeRepoRelativePath(relativePath);

  return (
    COPY_SKIP_FILE_PATHS.includes(
      normalizedPath as (typeof COPY_SKIP_FILE_PATHS)[number],
    ) || normalizedPath.endsWith(".tsbuildinfo")
  );
}
