import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  CATALOG_MESSAGE_PACK_IDS,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";
import { mergeObjects } from "@/lib/merge-objects";
import { syncMessageCompat } from "../../scripts/quality/sync-message-compat";

const LOCALES = ["en"] as const;
const REQUIRED_PACK_FILES = [
  ...CATALOG_MESSAGE_PACK_IDS.flatMap((packId) =>
    LOCALES.map((locale) => getPackPath(packId, locale)),
  ),
];
const TEMP_TRASH_ROOT = path.join(os.tmpdir(), "catalog-message-sync-trash");
const tempRoots: string[] = [];

function packFileExists(relativePath: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test checks fixed pack paths from REQUIRED_PACK_FILES
  return fs.existsSync(relativePath);
}

function getPackPath(packId: MessagePackId, locale: (typeof LOCALES)[number]) {
  const packRoot =
    packId === "base" ? "messages/base" : `messages/profiles/${packId}`;

  return `${packRoot}/${locale}/messages.json`;
}

function readJson(filePath: string): Record<string, unknown> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed message pack paths from config
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
    string,
    unknown
  >;
}

function composeCatalogMessages(locale: (typeof LOCALES)[number]) {
  return CATALOG_MESSAGE_PACK_IDS.reduce<Record<string, unknown>>(
    (messages, packId) =>
      mergeObjects(messages, readJson(getPackPath(packId, locale))),
    {},
  );
}

function createTempMessageRoot(): string {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "catalog-message-sync-"),
  );
  tempRoots.push(rootDir);
  for (const [index, packId] of CATALOG_MESSAGE_PACK_IDS.entries()) {
    const filePath = path.join(rootDir, getPackPath(packId, "en"));
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test fixture path is inside a test-owned temporary directory
    fs.writeFileSync(
      filePath,
      `${JSON.stringify({ shared: index, [packId]: "messages" }, null, 2)}\n`,
    );
  }
  return rootDir;
}

describe("physical message packs", () => {
  afterEach(() => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup uses a fixed recoverable temporary trash directory
    fs.mkdirSync(TEMP_TRASH_ROOT, { recursive: true });
    for (const rootDir of tempRoots.splice(0)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup only checks test-owned temporary directories
      if (!fs.existsSync(rootDir)) continue;
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- cleanup moves fixtures to a recoverable temporary trash directory
      fs.renameSync(
        rootDir,
        path.join(TEMP_TRASH_ROOT, `${path.basename(rootDir)}-${Date.now()}`),
      );
    }
  });

  it("provides a supported catalog-only compatibility sync command", () => {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["messages:sync"]).toBe(
      "tsx scripts/quality/sync-message-compat.ts",
    );
    expect(fs.existsSync("scripts/quality/sync-message-compat.ts")).toBe(true);
  });

  it("regenerates flat compatibility files from the fixed catalog graph", () => {
    const rootDir = createTempMessageRoot();

    syncMessageCompat(rootDir);

    expect(readJson(path.join(rootDir, "messages/en/messages.json"))).toEqual({
      shared: 2,
      base: "messages",
      "b2b-lead": "messages",
      catalog: "messages",
    });
  });

  it("keeps every required pack file present", () => {
    for (const filePath of REQUIRED_PACK_FILES) {
      expect(packFileExists(filePath), filePath).toBe(true);
    }
  });

  it("moves runtime imports away from broad compatibility files", () => {
    const loader = fs.readFileSync("src/lib/i18n/load-messages.ts", "utf8");
    const packLoader = fs.readFileSync(
      "src/lib/i18n/message-pack-loader.ts",
      "utf8",
    );

    expect(packLoader).toContain("@messages/base/en/messages.json");
    expect(loader).not.toContain("@messages/en/messages.json");
    expect(packLoader).not.toContain("@messages/en/messages.json");
  });

  it("documents physical packs as authoring truth instead of generated compat files", () => {
    const readme = fs.readFileSync("README.md", "utf8");
    const replace = fs.readFileSync("docs/项目基础/替换顺序.md", "utf8");
    const messages = fs.readFileSync("docs/项目基础/消息文案.md", "utf8");
    const currentTruthDocs = fs.readFileSync(
      "scripts/quality/checks/current-truth-docs.js",
      "utf8",
    );

    expect(readme).toContain("messages/base/**");
    expect(readme).toContain("messages/profiles/b2b-lead/**");
    expect(readme).toContain("messages/profiles/catalog/**");
    expect(readme).toContain("generated compat");
    expect(readme).not.toContain(
      "UI 文案放在 `messages/{locale}/messages.json`",
    );

    expect(replace).toContain("physical packs first");
    expect(replace).toContain("不要先手改 generated compat 文件");
    expect(messages).toContain(
      "Physical message packs are the authoring truth",
    );
    expect(currentTruthDocs).toContain("messages/base/**");
    expect(currentTruthDocs).toContain("messages/profiles/b2b-lead/**");
    expect(currentTruthDocs).toContain("messages/profiles/catalog/**");
  });

  it("keeps generated compatibility messages synced from the active catalog physical packs", () => {
    for (const locale of LOCALES) {
      expect(readJson(`messages/${locale}/messages.json`)).toEqual(
        composeCatalogMessages(locale),
      );
    }
  });
});
