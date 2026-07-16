import { describe, expect, it } from "vitest";
import { scanBrandContent } from "../../../scripts/quality/checks/brand.js";

describe("brand residue check", () => {
  const marker = ["Tian", "ze"].join("");

  it.each([["TIAN", "ZE"].join(""), ["tian", "ze"].join(""), marker])(
    "detects old brand residue regardless of case: %s",
    (content) => {
      expect(scanBrandContent(content, "fixture.md")).toContainEqual({
        file: "fixture.md",
        line: 1,
        marker,
      });
    },
  );
});
