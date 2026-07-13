import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CONTACT_CLIENT_MESSAGE_NAMESPACES,
  getClientMessageNamespaces,
  loadClientMessages,
  pickMessages,
  pickClientMessages,
} from "@/lib/i18n/client-messages";

const LAYOUT_SOURCE_PATH = "src/app/[locale]/layout.tsx";

describe("client message scoping", () => {
  it("keeps only namespaces needed site-wide by client islands", () => {
    const scoped = pickClientMessages({
      home: { hero: "server-only" },
      faq: { sectionTitle: "server-only" },
      accessibility: { skipToContent: "Skip" },
      language: { selectLanguage: "Select Language" },
      navigation: { home: "Home" },
      cookie: { title: "Cookies" },
      contact: { form: { title: "Contact" } },
      apiErrors: { UNKNOWN_ERROR: "Unknown" },
      errors: { contact: { title: "Unavailable" } },
      theme: { switchToDark: "Switch to dark theme" },
    });

    expect(scoped).toEqual({
      accessibility: { skipToContent: "Skip" },
      language: { selectLanguage: "Select Language" },
      navigation: { home: "Home" },
      cookie: { title: "Cookies" },
      errors: { contact: { title: "Unavailable" } },
      theme: { switchToDark: "Switch to dark theme" },
    });
  });

  it("tracks the intended site-wide namespace allowlist", () => {
    expect(getClientMessageNamespaces()).toEqual([
      "accessibility",
      "cookie",
      "errors",
      "language",
      "navigation",
      "theme",
    ]);
  });

  it("keeps the contact form copy off the site-wide client payload", () => {
    // Only the contact form consumes these on the client; they must be
    // supplied by the contact route's local provider, not shipped everywhere.
    expect(getClientMessageNamespaces()).not.toContain("contact");
    expect(getClientMessageNamespaces()).not.toContain("apiErrors");
    expect([...CONTACT_CLIENT_MESSAGE_NAMESPACES].sort()).toEqual([
      "accessibility",
      "apiErrors",
      "contact",
    ]);
  });

  it("can scope the contact route subset when needed", () => {
    const scoped = pickMessages(
      {
        accessibility: { turnstileTestMode: "Test" },
        contact: { form: { title: "Contact" } },
        apiErrors: { UNKNOWN_ERROR: "Unknown" },
        home: { hero: "Server only" },
      },
      CONTACT_CLIENT_MESSAGE_NAMESPACES,
    );

    expect(scoped).toEqual({
      accessibility: { turnstileTestMode: "Test" },
      contact: { form: { title: "Contact" } },
      apiErrors: { UNKNOWN_ERROR: "Unknown" },
    });
  });

  it("loads only site-wide client provider namespaces from split bundles", async () => {
    const scoped = await loadClientMessages("en");

    expect(Object.keys(scoped).sort()).toEqual(
      [...getClientMessageNamespaces()].sort(),
    );
    expect(scoped).toHaveProperty("accessibility");
    expect(scoped).toHaveProperty("cookie");
    expect(scoped).toHaveProperty("errors");
    expect(scoped).toHaveProperty("language");
    expect(scoped).toHaveProperty("navigation");
    expect(scoped).toHaveProperty("theme");
    expect(scoped).not.toHaveProperty("contact");
    expect(scoped).not.toHaveProperty("apiErrors");
    expect(scoped).not.toHaveProperty("footer");
    expect(scoped).not.toHaveProperty("home");
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
