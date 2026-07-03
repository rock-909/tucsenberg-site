import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Storybook preview i18n contract", () => {
  it("loads only generated compatibility messages for component previews", () => {
    const messageSource = readFileSync(
      "src/lib/i18n/storybook-messages.ts",
      "utf8",
    );

    expect(messageSource).toContain('from "@messages/en/critical.json"');
    expect(messageSource).toContain('from "@messages/en/deferred.json"');
    expect(messageSource).toContain('from "@messages/zh/critical.json"');
    expect(messageSource).toContain('from "@messages/zh/deferred.json"');
    expect(messageSource).not.toMatch(
      /messages\/profiles|\.env|server-only|@\/lib\/env|NEXT_SERVER/u,
    );
  });

  it("wraps stories with next-intl client context for localized links and labels", () => {
    const preview = readFileSync(".storybook/preview.ts", "utf8");

    expect(preview).toContain(
      'import { NextIntlClientProvider } from "next-intl";',
    );
    expect(preview).toContain('from "@/lib/i18n/storybook-messages";');
    expect(preview).toContain("React.createElement(");
    expect(preview).toContain("NextIntlClientProvider");
    expect(preview).toContain("locale: storybookLocale");
    expect(preview).toContain(
      "messages: getStorybookMessages(storybookLocale)",
    );
  });

  it("uses runtime-equivalent deep message merging for duplicate namespaces", async () => {
    const { getStorybookMessages } =
      await import("@/lib/i18n/storybook-messages");

    const englishMessages = getStorybookMessages("en") as {
      article?: { defaultAuthor?: string; meta?: { section?: string } };
    };

    expect(englishMessages.article?.meta?.section).toBe("Company-site guide");
    expect(englishMessages.article?.defaultAuthor).toBe("{companyName}");
  });

  it("supports Chinese locale context for Chinese story states", async () => {
    const { getStorybookMessages } =
      await import("@/lib/i18n/storybook-messages");
    const preview = readFileSync(".storybook/preview.ts", "utf8");
    const heroViewStories = readFileSync(
      "src/components/sections/hero-section-view.stories.tsx",
      "utf8",
    );
    const heroStories = readFileSync(
      "src/components/sections/hero-section.stories.tsx",
      "utf8",
    );
    const chineseMessages = getStorybookMessages("zh") as {
      article?: { defaultAuthor?: string; meta?: { section?: string } };
    };

    expect(preview).toContain("context.globals.locale");
    expect(preview).toContain("getStorybookMessages(storybookLocale)");
    expect(chineseMessages.article?.meta?.section).toBe("企业站指南");
    expect(chineseMessages.article?.defaultAuthor).toBe("{companyName}");
    expect(heroViewStories).toContain('locale: "zh"');
    expect(heroStories).toContain('locale: "zh"');
  });
});
