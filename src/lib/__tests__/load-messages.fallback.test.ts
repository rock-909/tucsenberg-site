import { describe, expect, it, vi } from "vitest";
import {
  loadCompleteMessages,
  loadCompleteMessagesFromSource,
} from "@/lib/i18n/load-messages";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

describe("load-messages canonical runtime source", () => {
  it("sanitizes invalid locale to default locale when loading direct source", async () => {
    const invalidLocaleMessages =
      await loadCompleteMessagesFromSource("invalid-locale");
    const defaultLocaleMessages = await loadCompleteMessagesFromSource("en");

    expect(invalidLocaleMessages).toEqual(defaultLocaleMessages);
  });

  it("returns merged complete messages from physical packs", async () => {
    const messages = await loadCompleteMessagesFromSource("en");

    expect(messages).toHaveProperty("apiErrors");
    expect(messages).toHaveProperty("catalog");
    expect(messages).toHaveProperty("contact");
    expect(messages).not.toHaveProperty("common");
  });

  it("keeps cached and direct source loading shape-compatible", async () => {
    const direct = await loadCompleteMessagesFromSource("en");
    const cached = await loadCompleteMessages("en");

    expect(cached).toEqual(direct);
  });

  it("uses the shared composed packs without site-specific overlay drift", async () => {
    vi.resetModules();

    const messages = (await loadCompleteMessagesFromSource("en")) as {
      seo?: unknown;
      footer?: { description?: string };
      home?: { hero?: { title?: string } };
    };

    expect(messages.seo).toBeUndefined();
    expect(messages.footer?.description).toBeTruthy();
    expect(messages.home?.hero?.title).toBeTruthy();
  });
});
