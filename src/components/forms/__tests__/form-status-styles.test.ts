import { describe, expect, it } from "vitest";
import {
  FORM_FIELD_REQUIRED_CLASS_NAME,
  FORM_STATUS_CLASS_NAMES,
} from "../form-status-styles";

const RAW_PALETTE_PATTERN =
  /\b(?:bg|text|border)-(?:green|red|blue|amber)-\d{2,3}\b/;

describe("form status styles", () => {
  it("uses semantic tokens for every form status tone", () => {
    for (const [tone, className] of Object.entries(FORM_STATUS_CLASS_NAMES)) {
      expect(className, tone).toContain("var(--");
      expect(className.match(RAW_PALETTE_PATTERN), tone).toBeNull();
    }
  });

  it("uses destructive semantics for required indicators", () => {
    expect(FORM_FIELD_REQUIRED_CLASS_NAME).toBe(
      "after:ml-0.5 after:text-destructive after:content-['*']",
    );
  });
});
