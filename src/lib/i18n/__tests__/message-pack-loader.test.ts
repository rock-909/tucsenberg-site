import { describe, expect, it } from "vitest";
import { CATALOG_MESSAGE_PACK_IDS } from "@/lib/i18n/message-pack-config";
import { loadComposedRawMessages } from "@/lib/i18n/message-pack-loader";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";

describe("catalog message loading", () => {
  it("uses the fixed catalog pack graph", () => {
    expect(CATALOG_MESSAGE_PACK_IDS).toEqual(["base", "b2b-lead", "catalog"]);
  });

  it("loads the current Tucsenberg catalog namespaces", async () => {
    const messages = await loadCompleteMessages("en");

    expect(messages).toHaveProperty("home");
    expect(messages).toHaveProperty("contact");
    expect(messages).toHaveProperty("requestQuote");
    expect(messages).toHaveProperty("catalog");
    expect(messages).toHaveProperty("emailTemplates");
    expect(messages).not.toHaveProperty("products");
    expect(messages).not.toHaveProperty("language");
    expect(messages).not.toHaveProperty("blog");
    expect(messages).not.toHaveProperty("customProject");
  });

  it("composes raw split messages without a selectable profile", async () => {
    await expect(loadComposedRawMessages("en", "critical")).resolves.toEqual(
      expect.objectContaining({ home: expect.any(Object) }),
    );
  });
});
