import { describe, expect, it, vi } from "vitest";
import { STARTER_PROFILE_IDS } from "@/config/starter-profiles";
import {
  getMessagePackIdsForProfile,
  loadCompleteMessagesForProfile,
} from "@/lib/i18n/load-messages";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

function expectHasNamespaces(
  messages: Record<string, unknown>,
  namespaces: readonly string[],
): void {
  for (const namespace of namespaces) {
    expect(messages, `expected ${namespace}`).toHaveProperty(namespace);
  }
}

function expectMissingNamespaces(
  messages: Record<string, unknown>,
  namespaces: readonly string[],
): void {
  for (const namespace of namespaces) {
    expect(messages, `did not expect ${namespace}`).not.toHaveProperty(
      namespace,
    );
  }
}

describe("message pack loader", () => {
  it("maps every starter profile to an explicit pack graph", () => {
    expect(STARTER_PROFILE_IDS).toEqual([
      "minimal",
      "company-site",
      "b2b-lead",
      "catalog",
      "content-marketing",
      "showcase-full",
    ]);
    expect(getMessagePackIdsForProfile("minimal")).toEqual(["base", "minimal"]);
    expect(getMessagePackIdsForProfile("b2b-lead")).toEqual([
      "base",
      "minimal",
      "b2b-lead",
    ]);
    expect(getMessagePackIdsForProfile("catalog")).toEqual([
      "base",
      "b2b-lead",
      "catalog",
    ]);
    expect(() => getMessagePackIdsForProfile("company-site")).toThrow(
      /not available in this materialized starter/u,
    );
    expect(() => getMessagePackIdsForProfile("content-marketing")).toThrow(
      /not available in this materialized starter/u,
    );
    expect(() => getMessagePackIdsForProfile("showcase-full")).toThrow(
      /not available in this materialized starter/u,
    );
  });

  it("loads catalog messages with Tucsenberg product namespaces", async () => {
    const messages = (await loadCompleteMessagesForProfile(
      "en",
      "catalog",
    )) as Record<string, unknown>;

    expectHasNamespaces(messages, [
      "common",
      "navigation",
      "footer",
      "home",
      "catalog",
      "products",
      "contact",
      "requestQuote",
      "privacy",
      "terms",
    ]);
    expectMissingNamespaces(messages, [
      "blog",
      "article",
      "resources",
      "customProject",
      "themeDemo",
    ]);
    expect(JSON.stringify(messages)).not.toContain("Primary Offer Example");
    expect(JSON.stringify(messages)).not.toContain("Example Standard");
    expect(JSON.stringify(messages)).not.toContain("platform.resources");
    expect(JSON.stringify(messages)).not.toContain("Starter launch articles");
    expect(JSON.stringify(messages)).not.toContain("solutionPartners");
    expect(JSON.stringify(messages)).not.toContain("SDK");
  });

  it("loads b2b-lead messages without optional catalog, blog, or full-demo namespaces", async () => {
    const messages = (await loadCompleteMessagesForProfile(
      "en",
      "b2b-lead",
    )) as Record<string, unknown>;

    expectHasNamespaces(messages, [
      "common",
      "navigation",
      "footer",
      "home",
      "contact",
      "requestQuote",
      "privacy",
      "terms",
      "legal",
    ]);
    expectMissingNamespaces(messages, [
      "catalog",
      "products",
      "blog",
      "article",
      "resources",
      "customProject",
      "themeDemo",
    ]);
    expect(JSON.stringify(messages)).not.toContain("Example Standard A");
    expect(JSON.stringify(messages)).not.toContain("Primary Offer Example");
  });

  it("loads the catalog pack and rejects retired optional packs", async () => {
    const catalog = await loadCompleteMessagesForProfile("en", "catalog");

    expectHasNamespaces(catalog as Record<string, unknown>, [
      "catalog",
      "products",
    ]);
    expectMissingNamespaces(catalog as Record<string, unknown>, [
      "blog",
      "article",
      "resources",
      "customProject",
    ]);

    await expect(
      loadCompleteMessagesForProfile("en", "content-marketing"),
    ).rejects.toThrow(/not available in this materialized starter/u);
    await expect(
      loadCompleteMessagesForProfile("en", "showcase-full"),
    ).rejects.toThrow(/not available in this materialized starter/u);
  });
});
