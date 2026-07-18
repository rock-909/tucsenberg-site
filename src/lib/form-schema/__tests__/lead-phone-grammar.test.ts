import { describe, expect, it } from "vitest";
import { isValidLeadPhone } from "@/lib/form-schema/lead-phone-grammar";

describe("isValidLeadPhone", () => {
  it("accepts common international and formatted numbers", () => {
    expect(isValidLeadPhone("+8613800138000")).toBe(true);
    expect(isValidLeadPhone("+1 (415) 555-1234")).toBe(true);
    expect(isValidLeadPhone("(415) 555-1234")).toBe(true);
    expect(isValidLeadPhone("415-555-1234")).toBe(true);
  });

  it("rejects illegal hyphen placement and duplicate plus signs", () => {
    for (const invalid of ["-123456", "--123", "123-", "+12+34", "abc123"]) {
      expect(isValidLeadPhone(invalid)).toBe(false);
    }
  });
});
