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
    expect(getMessagePackIdsForProfile("company-site")).toEqual([
      "base",
      "minimal",
      "b2b-lead",
      "company-site",
    ]);
    expect(getMessagePackIdsForProfile("b2b-lead")).toEqual([
      "base",
      "minimal",
      "b2b-lead",
    ]);
    expect(getMessagePackIdsForProfile("catalog")).toEqual([
      "base",
      "minimal",
      "b2b-lead",
      "catalog",
    ]);
    expect(getMessagePackIdsForProfile("content-marketing")).toEqual([
      "base",
      "minimal",
      "b2b-lead",
      "content-marketing",
    ]);
    expect(getMessagePackIdsForProfile("showcase-full")).toEqual([
      "base",
      "minimal",
      "b2b-lead",
      "catalog",
      "content-marketing",
      "company-site",
      "showcase-full",
    ]);
  });

  it("loads company-site messages with default product, blog, and resources namespaces", async () => {
    const messages = (await loadCompleteMessagesForProfile(
      "en",
      "company-site",
    )) as Record<string, unknown>;

    expectHasNamespaces(messages, [
      "common",
      "navigation",
      "footer",
      "home",
      "catalog",
      "blog",
      "article",
      "resources",
      "contact",
      "privacy",
      "terms",
    ]);
    expectMissingNamespaces(messages, ["customProject", "themeDemo"]);
    expect(JSON.stringify(messages)).not.toContain("Primary Offer Example");
    expect(JSON.stringify(messages)).not.toContain("Example Standard");
    expect(JSON.stringify(messages)).not.toContain("catalog.markets");
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

  it("loads optional catalog, content-marketing, and showcase-full packs only for owning profiles", async () => {
    const [catalog, contentMarketing, showcaseFull] = await Promise.all([
      loadCompleteMessagesForProfile("en", "catalog"),
      loadCompleteMessagesForProfile("en", "content-marketing"),
      loadCompleteMessagesForProfile("en", "showcase-full"),
    ]);

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

    expectHasNamespaces(contentMarketing as Record<string, unknown>, [
      "blog",
      "article",
    ]);
    expectMissingNamespaces(contentMarketing as Record<string, unknown>, [
      "catalog",
      "products",
      "resources",
      "customProject",
    ]);

    expectHasNamespaces(showcaseFull as Record<string, unknown>, [
      "catalog",
      "products",
      "blog",
      "article",
      "resources",
      "customProject",
    ]);
  });
});
