/* eslint-disable security/detect-non-literal-fs-filename -- test creates temp dirs with dynamic names for fixture isolation */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const {
  validateMdxSlugSync,
} = require("../../../scripts/quality/checks/content-slugs.js");

interface SlugSyncResult {
  ok: boolean;
  issues: Array<{ type: string }>;
  stats: {
    totalPairs: number;
  };
}

describe("content-slug-sync profile fixtures", () => {
  let tmpDir: string;
  const tempTrashRoot = path.join(
    os.tmpdir(),
    "showcase-mdx-slug-profile-fixture-trash",
  );

  function moveTempDirToTrash(dir: string): void {
    if (!dir || !fs.existsSync(dir)) return;

    fs.mkdirSync(tempTrashRoot, { recursive: true });
    const targetDir = path.join(
      tempTrashRoot,
      `${path.basename(dir)}-${Date.now()}`,
    );

    fs.renameSync(dir, targetDir);
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "mdx-slug-profile-fixture-test-"),
    );
  });

  afterEach(() => {
    moveTempDirToTrash(tmpDir);
  });

  it("validates showcase-full fixture pages under profile-fixtures/showcase-full/content", () => {
    const showcaseRoot = path.join(
      tmpDir,
      "profile-fixtures",
      "showcase-full",
      "content",
    );
    fs.mkdirSync(path.join(showcaseRoot, "pages", "en"), { recursive: true });
    fs.mkdirSync(path.join(showcaseRoot, "pages", "zh"), { recursive: true });

    for (const slug of [
      "capabilities",
      "how-it-works",
      "custom-project-support",
    ]) {
      for (const locale of ["en", "zh"]) {
        fs.writeFileSync(
          path.join(showcaseRoot, "pages", locale, `${slug}.mdx`),
          `---\nslug: ${JSON.stringify(slug)}\n---\n\nFixture page`,
        );
      }
    }

    const result: SlugSyncResult = validateMdxSlugSync({
      rootDir: tmpDir,
      collections: ["pages"],
      locales: ["en", "zh"],
      contentRoots: ["profile-fixtures/showcase-full/content"],
    });

    expect(result.ok).toBe(true);
    expect(result.stats.totalPairs).toBe(3);
  });

  it("detects missing zh showcase-full fixture counterpart", () => {
    const showcaseRoot = path.join(
      tmpDir,
      "profile-fixtures",
      "showcase-full",
      "content",
      "pages",
      "en",
    );
    fs.mkdirSync(showcaseRoot, { recursive: true });
    fs.writeFileSync(
      path.join(showcaseRoot, "capabilities.mdx"),
      '---\nslug: "capabilities"\n---\n\nFixture page',
    );

    const result: SlugSyncResult = validateMdxSlugSync({
      rootDir: tmpDir,
      collections: ["pages"],
      locales: ["en", "zh"],
      contentRoots: ["profile-fixtures/showcase-full/content"],
    });

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.type).toBe("missing_pair");
  });
});
