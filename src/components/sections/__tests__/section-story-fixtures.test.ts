import * as fixtures from "@/components/sections/section-story-fixtures";
import { describe, expect, it } from "vitest";

const bannedMotifs = [
  /vercel/i,
  /geist/i,
  /developer platform/i,
  /\bdeploy\b/i,
  /\bconsole\b/i,
  /ai workflow/i,
] as const;

const fakeProofPatterns = [
  /\b\d[\d.]*\s*(?:[+%]|x\b)/iu,
  /\b\d+\s+(?:countries|customers|clients|projects)\b/iu,
  /\bfortune\s*500\b/iu,
  /\btrusted by\b/iu,
  /\buptime\b/iu,
] as const;

describe("shared section Storybook fixtures", () => {
  it("keeps shared section fixtures out of Vercel/developer-platform motifs", () => {
    const text = JSON.stringify(fixtures);

    for (const pattern of bannedMotifs) {
      expect(text).not.toMatch(pattern);
    }

    for (const pattern of fakeProofPatterns) {
      expect(text).not.toMatch(pattern);
    }
  });
});
