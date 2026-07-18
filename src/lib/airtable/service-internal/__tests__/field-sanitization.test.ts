import { describe, expect, it } from "vitest";
import {
  sanitizeAirtablePhoneField,
  sanitizeAirtableTextField,
} from "@/lib/airtable/service-internal/field-sanitization";

describe("sanitizeAirtablePhoneField", () => {
  it("preserves validated international numbers that start with +", () => {
    expect(sanitizeAirtablePhoneField("+8613800138000")).toBe("+8613800138000");
    expect(sanitizeAirtablePhoneField("+8613800138000")).not.toMatch(/^'/);
  });

  it("escapes spreadsheet formula prefixes except validated leading + phones", () => {
    expect(sanitizeAirtablePhoneField("=123456")).toBe("'=123456");
    expect(sanitizeAirtablePhoneField("@123456")).toBe("'@123456");
    expect(sanitizeAirtablePhoneField("-123456")).toBe("'-123456");
    expect(sanitizeAirtablePhoneField("+not-a-phone")).toBe("'+not-a-phone");
  });
});

describe("sanitizeAirtableTextField", () => {
  it("reuses the shared spreadsheet formula prefix truth", () => {
    expect(sanitizeAirtableTextField("-Acme")).toBe("'-Acme");
    expect(sanitizeAirtableTextField("+SUM(1,1)")).toBe("'+SUM(1,1)");
  });
});
