import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createContentManifestContext,
  generateContentManifest,
} from "../../../scripts/starter-checks.js";

const TEMP_TRASH_ROOT = path.join(
  os.tmpdir(),
  "showcase-profile-fixture-manifest-trash",
);

function createFixture(files: Record<string, string>): string {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "showcase-profile-fixture-manifest-"),
  );

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootDir, relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside test-owned temp dir
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside test-owned temp dir
    fs.writeFileSync(fullPath, content, "utf8");
  }

  return rootDir;
}

function moveFixtureToTrash(rootDir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only checks test-owned temp fixture dir
  if (!fs.existsSync(rootDir)) return;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to recoverable temp trash folder
  fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
  const targetDir = path.join(
    TEMP_TRASH_ROOT,
    `${path.basename(rootDir)}-${Date.now()}`,
  );

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixture cleanup uses recoverable rename instead of permanent deletion
  fs.renameSync(rootDir, targetDir);
}

describe("content manifest profile fixture sources", () => {
  const fixtureRoots: string[] = [];

  afterEach(() => {
    for (const rootDir of fixtureRoots.splice(0)) {
      moveFixtureToTrash(rootDir);
    }
  });

  it("includes showcase-full page fixtures without keeping them in content/pages", () => {
    const rootDir = createFixture({
      "content/pages/en/about.mdx": [
        "---",
        "locale: en",
        "title: About",
        "description: About page",
        "slug: about",
        "publishedAt: '2026-05-20'",
        "updatedAt: '2026-05-20'",
        "seo:",
        "  title: About",
        "  description: About page",
        "---",
        "Default about content.",
      ].join("\n"),
      "profile-fixtures/showcase-full/content/pages/en/capabilities.mdx": [
        "---",
        "locale: en",
        "title: Capabilities",
        "description: Showcase-full fixture page",
        "slug: capabilities",
        "publishedAt: '2026-05-20'",
        "updatedAt: '2026-05-20'",
        "seo:",
        "  title: Capabilities",
        "  description: Showcase-full fixture page",
        "---",
        "Fixture capabilities content.",
      ].join("\n"),
    });
    fixtureRoots.push(rootDir);

    const manifest = generateContentManifest(
      createContentManifestContext(rootDir),
    );

    expect(manifest.byKey["pages/en/about"]).toMatchObject({
      source: "active-content",
      relativePath: "content/pages/en/about.mdx",
    });
    expect(manifest.byKey["pages/en/capabilities"]).toMatchObject({
      source: "profile-fixture",
      profileId: "showcase-full",
      relativePath:
        "profile-fixtures/showcase-full/content/pages/en/capabilities.mdx",
    });
  });
});
