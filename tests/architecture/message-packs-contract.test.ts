import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { StarterProfileId } from "@/config/starter-profiles";
import {
  getMessagePackIdsForProfile,
  type MessagePackId,
  type MessageType,
} from "@/lib/i18n/message-pack-config";
import { mergeObjects } from "@/lib/merge-objects";

const REQUIRED_PACK_FILES = [
  "messages/base/en/critical.json",
  "messages/base/en/deferred.json",
  "messages/base/zh/critical.json",
  "messages/base/zh/deferred.json",
  "messages/profiles/minimal/en/critical.json",
  "messages/profiles/minimal/en/deferred.json",
  "messages/profiles/minimal/zh/critical.json",
  "messages/profiles/minimal/zh/deferred.json",
  "messages/profiles/b2b-lead/en/critical.json",
  "messages/profiles/b2b-lead/en/deferred.json",
  "messages/profiles/b2b-lead/zh/critical.json",
  "messages/profiles/b2b-lead/zh/deferred.json",
  "messages/profiles/catalog/en/critical.json",
  "messages/profiles/catalog/en/deferred.json",
  "messages/profiles/catalog/zh/critical.json",
  "messages/profiles/catalog/zh/deferred.json",
  "messages/profiles/content-marketing/en/critical.json",
  "messages/profiles/content-marketing/en/deferred.json",
  "messages/profiles/content-marketing/zh/critical.json",
  "messages/profiles/content-marketing/zh/deferred.json",
  "messages/profiles/company-site/en/critical.json",
  "messages/profiles/company-site/en/deferred.json",
  "messages/profiles/company-site/zh/critical.json",
  "messages/profiles/company-site/zh/deferred.json",
  "messages/profiles/showcase-full/en/critical.json",
  "messages/profiles/showcase-full/en/deferred.json",
  "messages/profiles/showcase-full/zh/critical.json",
  "messages/profiles/showcase-full/zh/deferred.json",
  "messages/examples/ui-demo/en/critical.json",
  "messages/examples/ui-demo/en/deferred.json",
  "messages/examples/ui-demo/zh/critical.json",
  "messages/examples/ui-demo/zh/deferred.json",
];

const LOCALES = ["en", "zh"] as const;
const MESSAGE_TYPES = ["critical", "deferred"] as const;

function packFileExists(relativePath: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test checks fixed pack paths from REQUIRED_PACK_FILES
  return existsSync(relativePath);
}

function getPackPath(
  packId: MessagePackId,
  locale: (typeof LOCALES)[number],
  type: MessageType,
) {
  const packRoot =
    packId === "base" ? "messages/base" : `messages/profiles/${packId}`;

  return `${packRoot}/${locale}/${type}.json`;
}

function readJson(filePath: string): Record<string, unknown> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test reads fixed message pack paths from config
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

function composeProfileMessages(
  profileId: StarterProfileId,
  locale: (typeof LOCALES)[number],
  type: MessageType,
) {
  return getMessagePackIdsForProfile(profileId).reduce<Record<string, unknown>>(
    (messages, packId) =>
      mergeObjects(messages, readJson(getPackPath(packId, locale, type))),
    {},
  );
}

describe("physical message packs", () => {
  it("keeps every required pack file present", () => {
    for (const filePath of REQUIRED_PACK_FILES) {
      expect(packFileExists(filePath), filePath).toBe(true);
    }
  });

  it("moves runtime imports away from broad compatibility files", () => {
    const loader = readFileSync("src/lib/i18n/load-messages.ts", "utf8");
    const packLoader = readFileSync(
      "src/lib/i18n/message-pack-loader.ts",
      "utf8",
    );

    expect(packLoader).toContain("@messages/base/en/critical.json");
    expect(loader).not.toContain("@messages/en/critical.json");
    expect(packLoader).not.toContain("@messages/en/critical.json");
  });

  it("documents physical packs as authoring truth instead of generated compat files", () => {
    const readme = readFileSync("README.md", "utf8");
    const replace = readFileSync("docs/use/replace.md", "utf8");
    const messages = readFileSync("docs/ref/messages.md", "utf8");
    const currentTruthDocs = readFileSync(
      "scripts/quality/checks/current-truth-docs.js",
      "utf8",
    );

    expect(readme).toContain("messages/base/**");
    expect(readme).toContain("messages/profiles/company-site/**");
    expect(readme).toContain("generated compat");
    expect(readme).not.toContain(
      "UI 文案放在 `messages/{locale}/critical.json` 和 `messages/{locale}/deferred.json`",
    );

    expect(replace).toContain("physical packs first");
    expect(replace).toContain("不要先手改 generated compat 文件");
    expect(messages).toContain(
      "Physical message packs are the authoring truth",
    );
    expect(currentTruthDocs).toContain("messages/base/**");
    expect(currentTruthDocs).toContain("messages/profiles/**");
  });

  it("keeps generated compatibility messages synced from showcase-full physical packs", () => {
    for (const locale of LOCALES) {
      for (const type of MESSAGE_TYPES) {
        expect(readJson(`messages/${locale}/${type}.json`)).toEqual(
          composeProfileMessages("showcase-full", locale, type),
        );
      }
    }
  });
});
