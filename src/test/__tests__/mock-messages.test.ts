import { describe, expect, it } from "vitest";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { combinedMessages } from "@/test/constants/mock-messages";

describe("shared test messages", () => {
  it("keeps the theme selector name aligned with production messages", () => {
    expect(combinedMessages.accessibility.themeSelector).toBe(
      getComposedMessages("en").accessibility.themeSelector,
    );
  });
});
