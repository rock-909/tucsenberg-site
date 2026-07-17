import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CATALOG_MESSAGE_PACK_IDS,
  type MessagePackId,
} from "@/lib/i18n/message-pack-config";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { mergeObjects } from "@/lib/merge-objects";

const LOCALES = ["en"] as const;
const REQUIRED_PACK_FILES = [
  ...CATALOG_MESSAGE_PACK_IDS.flatMap((packId) =>
    LOCALES.map((locale) => getPackPath(packId, locale)),
  ),
];

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

describe("physical message packs", () => {
  it("does not keep a generated compatibility sync command", () => {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["messages:sync"]).toBeUndefined();
    expect(fs.existsSync("scripts/quality/sync-message-compat.ts")).toBe(false);
    expect(fs.existsSync("messages/en")).toBe(false);
  });

  it("keeps every required pack file present", () => {
    for (const filePath of REQUIRED_PACK_FILES) {
      expect(packFileExists(filePath), filePath).toBe(true);
    }
  });

  it("keeps runtime and static helpers on physical packs only", () => {
    const loader = fs.readFileSync("src/lib/i18n/load-messages.ts", "utf8");
    const packLoader = fs.readFileSync(
      "src/lib/i18n/message-pack-loader.ts",
      "utf8",
    );
    const composed = fs.readFileSync(
      "src/lib/i18n/composed-messages.ts",
      "utf8",
    );

    expect(packLoader).toContain("@messages/base/en/messages.json");
    expect(composed).toContain("@messages/base/en/messages.json");
    expect(loader).not.toContain("@messages/en/messages.json");
    expect(packLoader).not.toContain("@messages/en/messages.json");
    expect(composed).not.toContain("@messages/en/messages.json");
  });

  it("documents physical packs as the only message authoring surface", () => {
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
    expect(readme).not.toContain("generated compat");
    expect(readme).not.toContain("pnpm messages:sync");
    expect(readme).not.toContain(
      "UI 文案放在 `messages/{locale}/messages.json`",
    );

    expect(replace).toContain("physical packs first");
    expect(replace).not.toContain("不要先手改 generated compat 文件");
    expect(messages).toContain(
      "Physical message packs are the authoring truth",
    );
    expect(messages).not.toContain("pnpm messages:sync");
    expect(currentTruthDocs).toContain("messages/base/**");
    expect(currentTruthDocs).toContain("messages/profiles/b2b-lead/**");
    expect(currentTruthDocs).toContain("messages/profiles/catalog/**");
  });

  it("keeps the shared composition helper aligned with pack merge order", () => {
    for (const locale of LOCALES) {
      expect(getComposedMessages(locale)).toEqual(
        composeCatalogMessages(locale),
      );
    }
  });

  it("has no leftover generated locale message directory", () => {
    const messagesRoot = path.join(process.cwd(), "messages");
    const entries = fs.readdirSync(messagesRoot);

    expect(entries).toEqual(
      expect.arrayContaining(["base", "profiles", "message-packs.json"]),
    );
    expect(entries).not.toContain("en");
  });
});
