import { describe, expect, it, vi } from "vitest";
import {
  loadCompleteMessages,
  loadCompleteMessagesFromSource,
  loadCriticalMessages,
  loadDeferredMessages,
} from "@/lib/i18n/load-messages";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

describe("load-messages canonical runtime source", () => {
  it("loads critical messages from split source", async () => {
    const messages = await loadCriticalMessages("en");

    expect(messages).toBeTruthy();
    expect(typeof messages).toBe("object");
    expect(Object.keys(messages).length).toBeGreaterThan(0);
  });

  it("loads deferred messages from split source", async () => {
    const messages = await loadDeferredMessages("zh");

    expect(messages).toBeTruthy();
    expect(typeof messages).toBe("object");
    expect(Object.keys(messages).length).toBeGreaterThan(0);
  });

  it("sanitizes invalid locale to default locale when loading direct source", async () => {
    const invalidLocaleMessages =
      await loadCompleteMessagesFromSource("invalid-locale");
    const defaultLocaleMessages = await loadCompleteMessagesFromSource("en");

    expect(invalidLocaleMessages).toEqual(defaultLocaleMessages);
  });

  it("returns merged complete messages from split source", async () => {
    const messages = await loadCompleteMessagesFromSource("en");

    expect(messages).toHaveProperty("apiErrors");
    expect(messages).toHaveProperty("common");
  });

  it("keeps cached and direct source loading shape-compatible", async () => {
    const direct = await loadCompleteMessagesFromSource("zh");
    const cached = await loadCompleteMessages("zh");

    expect(cached).toEqual(direct);
  });

  it("uses the shared split bundles without site-specific overlay drift", async () => {
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

  it("keeps explicit b2b-lead and showcase-full profile loading separate", async () => {
    const [{ loadCompleteMessagesForProfile }] = await Promise.all([
      import("@/lib/i18n/load-messages"),
    ]);

    const b2bLead = (await loadCompleteMessagesForProfile(
      "en",
      "b2b-lead",
    )) as Record<string, unknown>;
    const showcaseFull = (await loadCompleteMessagesForProfile(
      "en",
      "showcase-full",
    )) as Record<string, unknown>;

    expect(b2bLead).not.toHaveProperty("catalog");
    expect(b2bLead).not.toHaveProperty("blog");
    expect(showcaseFull).toHaveProperty("catalog");
    expect(showcaseFull).toHaveProperty("blog");
  });
});
