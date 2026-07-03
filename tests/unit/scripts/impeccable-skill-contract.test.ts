/* eslint-disable security/detect-non-literal-fs-filename -- tests create isolated temp fixtures and read fixed skill files */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-impeccable-skill-test-trash",
);
const CODEX_ONLY_TRACKED_IMPECCABLE_FILES = [
  "agents/impeccable_asset_producer.toml",
  "agents/openai.yaml",
] as const;
const CODEX_ONLY_TRACKED_IMPECCABLE_FILE_SET = new Set<string>(
  CODEX_ONLY_TRACKED_IMPECCABLE_FILES,
);

interface ImpeccablePathsModule {
  moveToTrash(targetPath: string): string;
  resolveExistingRepoFile(
    rootDir: string,
    inputPath: string,
  ): { absolutePath: string; relativePath: string };
}

interface LiveInjectModule {
  resolveFiles(
    rootDir: string,
    config: {
      commentSyntax: "html" | "jsx";
      files: string[];
      insertBefore: string;
    },
  ): string[];
}

function skillPath(relativePath: string): string {
  return path.join(REPO_ROOT, relativePath);
}

async function importSkillModule<TModule>(
  relativePath: string,
): Promise<TModule> {
  return (await import(pathToFileURL(skillPath(relativePath)).href)) as TModule;
}

function createFixtureRoot(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function moveFixtureToTempTrash(rootDir: string): void {
  if (!fs.existsSync(rootDir)) {
    return;
  }

  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  fs.renameSync(
    rootDir,
    path.join(TEMP_TRASH_ROOT, `${path.basename(rootDir)}-${Date.now()}`),
  );
}

function listFiles(rootDir: string): string[] {
  const results: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        results.push(
          path.relative(rootDir, absolutePath).replaceAll("\\", "/"),
        );
      }
    }
  }

  return results.sort();
}

function listTrackedFiles(rootRelativePath: string): string[] {
  const normalizedRoot = `${rootRelativePath.replaceAll("\\", "/")}/`;
  return execFileSync("git", ["ls-files", rootRelativePath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  })
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((filePath) => {
      const normalizedPath = filePath.replaceAll("\\", "/");
      if (!normalizedPath.startsWith(normalizedRoot)) {
        throw new Error(
          `Tracked file ${normalizedPath} is outside ${normalizedRoot}`,
        );
      }

      return normalizedPath.slice(normalizedRoot.length);
    })
    .sort();
}

function readSkillText(relativePath: string): string {
  return fs.readFileSync(skillPath(relativePath), "utf8");
}

describe("Impeccable project-local skill contract", () => {
  const fixtureRoots: string[] = [];
  const originalHome = process.env.HOME;

  afterEach(() => {
    process.env.HOME = originalHome;
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTempTrash(rootDir);
    }
  });

  it("keeps Claude and Codex skill bundles synchronized except harness path prefixes", () => {
    const claudeRoot = skillPath(".claude/skills/impeccable");
    const codexRoot = skillPath(".codex/skills/impeccable");
    const claudeFiles = listTrackedFiles(".claude/skills/impeccable");
    const codexFiles = listTrackedFiles(".codex/skills/impeccable");
    const codexOnlyFiles = codexFiles.filter(
      (relativePath) => !claudeFiles.includes(relativePath),
    );
    const comparableCodexFiles = codexFiles.filter(
      (relativePath) =>
        !CODEX_ONLY_TRACKED_IMPECCABLE_FILE_SET.has(relativePath),
    );

    expect(codexOnlyFiles).toEqual(CODEX_ONLY_TRACKED_IMPECCABLE_FILES);
    expect(comparableCodexFiles).toEqual(claudeFiles);

    for (const relativePath of claudeFiles) {
      const claudeText = fs
        .readFileSync(path.join(claudeRoot, relativePath), "utf8")
        .replaceAll(".claude/skills/impeccable", ".codex/skills/impeccable");
      const codexText = fs.readFileSync(
        path.join(codexRoot, relativePath),
        "utf8",
      );

      expect(codexText, relativePath).toBe(claudeText);
    }
  });

  it("does not read or write ignored .agents harness state", () => {
    for (const root of [
      ".claude/skills/impeccable",
      ".codex/skills/impeccable",
    ]) {
      for (const relativePath of listFiles(skillPath(root))) {
        const text = readSkillText(`${root}/${relativePath}`);

        expect(text, `${root}/${relativePath}`).not.toContain(".agents");
      }
    }
  });

  it("uses shell-free child-process calls in local helper scripts", () => {
    for (const root of [
      ".claude/skills/impeccable/scripts",
      ".codex/skills/impeccable/scripts",
    ]) {
      for (const relativePath of listFiles(skillPath(root))) {
        if (!relativePath.endsWith(".mjs") && !relativePath.endsWith(".js")) {
          continue;
        }

        const text = readSkillText(`${root}/${relativePath}`);
        expect(text, `${root}/${relativePath}`).not.toMatch(/\bexecSync\s*\(/u);
      }
    }
  });

  it("moves files and directories to Trash without overwriting collisions", async () => {
    const { moveToTrash } = await importSkillModule<ImpeccablePathsModule>(
      ".codex/skills/impeccable/scripts/impeccable-paths.mjs",
    );
    const homeDir = createFixtureRoot("showcase-impeccable-home-");
    fixtureRoots.push(homeDir);
    const trashDir = path.join(homeDir, ".Trash");
    fs.mkdirSync(trashDir);
    process.env.HOME = homeDir;

    const filePath = path.join(homeDir, "context.json");
    const collisionPath = path.join(trashDir, "context.json");
    fs.writeFileSync(filePath, "current", "utf8");
    fs.writeFileSync(collisionPath, "existing", "utf8");

    const movedFilePath = moveToTrash(filePath);

    expect(fs.existsSync(filePath)).toBe(false);
    expect(fs.readFileSync(collisionPath, "utf8")).toBe("existing");
    expect(movedFilePath).not.toBe(collisionPath);
    expect(fs.readFileSync(movedFilePath, "utf8")).toBe("current");

    const dirPath = path.join(homeDir, "session");
    fs.mkdirSync(dirPath);
    fs.writeFileSync(path.join(dirPath, "server.json"), "{}", "utf8");

    const movedDirPath = moveToTrash(dirPath);

    expect(fs.existsSync(dirPath)).toBe(false);
    expect(fs.existsSync(path.join(movedDirPath, "server.json"))).toBe(true);
  });

  it("refuses destructive fallback when HOME or Trash is unavailable", async () => {
    const { moveToTrash } = await importSkillModule<ImpeccablePathsModule>(
      ".codex/skills/impeccable/scripts/impeccable-paths.mjs",
    );
    const rootDir = createFixtureRoot("showcase-impeccable-trash-");
    fixtureRoots.push(rootDir);
    const targetPath = path.join(rootDir, "server.json");
    fs.writeFileSync(targetPath, "{}", "utf8");

    delete process.env.HOME;
    expect(() => moveToTrash(targetPath)).toThrow(/HOME is not set/u);
    expect(fs.existsSync(targetPath)).toBe(true);

    process.env.HOME = rootDir;
    expect(() => moveToTrash(targetPath)).toThrow(/\.Trash/u);
    expect(fs.existsSync(targetPath)).toBe(true);
  });

  it("rejects repo-root escapes for live source helpers", async () => {
    const { resolveExistingRepoFile } =
      await importSkillModule<ImpeccablePathsModule>(
        ".codex/skills/impeccable/scripts/impeccable-paths.mjs",
      );
    const rootDir = createFixtureRoot("showcase-impeccable-root-");
    const externalDir = createFixtureRoot("showcase-impeccable-external-");
    fixtureRoots.push(rootDir, externalDir);
    fs.writeFileSync(path.join(rootDir, "index.html"), "<main></main>", "utf8");
    fs.writeFileSync(
      path.join(externalDir, "outside.html"),
      "<main></main>",
      "utf8",
    );
    fs.symlinkSync(
      path.join(externalDir, "outside.html"),
      path.join(rootDir, "linked.html"),
    );

    expect(resolveExistingRepoFile(rootDir, "index.html")).toMatchObject({
      relativePath: "index.html",
    });
    expect(() => resolveExistingRepoFile(rootDir, "../outside.html")).toThrow(
      /outside project root/u,
    );
    expect(() =>
      resolveExistingRepoFile(rootDir, path.join(rootDir, "index.html")),
    ).toThrow(/absolute paths/u);
    expect(() => resolveExistingRepoFile(rootDir, "linked.html")).toThrow(
      /outside project root/u,
    );
  });

  it("applies the same repo-boundary guard to live-inject literal files", async () => {
    const { resolveFiles } = await importSkillModule<LiveInjectModule>(
      ".codex/skills/impeccable/scripts/live-inject.mjs",
    );
    const rootDir = createFixtureRoot("showcase-impeccable-inject-");
    fixtureRoots.push(rootDir);
    fs.mkdirSync(path.join(rootDir, "public"), { recursive: true });
    fs.writeFileSync(
      path.join(rootDir, "public/index.html"),
      "<body></body>",
      "utf8",
    );

    expect(
      resolveFiles(rootDir, {
        files: ["public/index.html"],
        insertBefore: "</body>",
        commentSyntax: "html",
      }),
    ).toEqual(["public/index.html"]);
    expect(() =>
      resolveFiles(rootDir, {
        files: ["../outside.html"],
        insertBefore: "</body>",
        commentSyntax: "html",
      }),
    ).toThrow(/outside project root/u);
    expect(() =>
      resolveFiles(rootDir, {
        files: [path.join(rootDir, "public/index.html")],
        insertBefore: "</body>",
        commentSyntax: "html",
      }),
    ).toThrow(/absolute paths/u);
    expect(
      resolveFiles(rootDir, {
        files: ["node_modules/example.html"],
        insertBefore: "</body>",
        commentSyntax: "html",
      }),
    ).toEqual([]);
  });
});
