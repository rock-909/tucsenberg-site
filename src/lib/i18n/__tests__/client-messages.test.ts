import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getClientMessageNamespaces,
  loadClientMessages,
  pickMessages,
  pickClientMessages,
} from "@/lib/i18n/client-messages";

const LAYOUT_SOURCE_PATH = "src/app/[locale]/layout.tsx";

describe("client message scoping", () => {
  it("keeps only namespaces needed by client islands", () => {
    const scoped = pickClientMessages({
      home: { hero: { searchLabel: "Compatibility search" } },
      faq: { sectionTitle: "server-only" },
      language: { selectLanguage: "Select Language" },
      navigation: { home: "Home" },
      cookie: { title: "Cookies" },
      contact: { form: { title: "Contact" } },
      apiErrors: { UNKNOWN_ERROR: "Unknown" },
      errors: { contact: { title: "Unavailable" } },
    });

    expect(scoped).toEqual({
      apiErrors: { UNKNOWN_ERROR: "Unknown" },
      home: { hero: { searchLabel: "Compatibility search" } },
      language: { selectLanguage: "Select Language" },
      navigation: { home: "Home" },
      contact: { form: { title: "Contact" } },
      cookie: { title: "Cookies" },
      errors: { contact: { title: "Unavailable" } },
    });
  });

  it("tracks the intended namespace allowlist", () => {
    expect(getClientMessageNamespaces()).toEqual([
      "accessibility",
      "apiErrors",
      "contact",
      "cookie",
      "errors",
      "home",
      "language",
      "navigation",
      "search",
    ]);
  });

  it("can scope a page-specific subset when needed", () => {
    const scoped = pickMessages(
      {
        contact: { form: { title: "Contact" } },
        apiErrors: { UNKNOWN_ERROR: "Unknown" },
        home: { hero: "Server only" },
      },
      ["contact", "apiErrors"],
    );

    expect(scoped).toEqual({
      contact: { form: { title: "Contact" } },
      apiErrors: { UNKNOWN_ERROR: "Unknown" },
    });
  });

  it("loads only client provider namespaces from split message bundles", async () => {
    const scoped = await loadClientMessages("en");

    expect(Object.keys(scoped).sort()).toEqual(
      [...getClientMessageNamespaces()].sort(),
    );
    expect(scoped).toHaveProperty("accessibility");
    expect(scoped).toHaveProperty("apiErrors");
    expect(scoped).toHaveProperty("contact");
    expect(scoped).toHaveProperty("cookie");
    expect(scoped).toHaveProperty("errors");
    expect(scoped).toHaveProperty("language");
    expect(scoped).toHaveProperty("navigation");
    expect(scoped).toHaveProperty("home");
    expect(scoped).not.toHaveProperty("footer");
    expect(scoped).not.toHaveProperty("faq");
    expect(scoped).not.toHaveProperty("products");
  });

  it("keeps the root layout on the narrow client message loader", () => {
    const source = readFileSync(LAYOUT_SOURCE_PATH, "utf8");

    expect(source).toContain("loadClientMessages");
    expect(source).not.toContain("loadCompleteMessages");
    expect(source).not.toContain("pickClientMessages(messages)");
  });
});
