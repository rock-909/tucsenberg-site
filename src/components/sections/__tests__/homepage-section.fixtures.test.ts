import {
  homepageStoryFinalCta,
  homepageStoryFinalCtaZh,
  homepageStoryHero,
  homepageStoryHeroLongCopy,
  homepageStoryHeroZh,
  homepageStoryProducts,
  homepageStoryProductsZh,
  homepageStoryQuality,
  homepageStoryQualityZh,
  homepageStoryScenarios,
  homepageStoryScenariosZh,
} from "@/components/sections/homepage-section.fixtures";
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

function serialized(value: unknown): string {
  return JSON.stringify(value);
}

function expectNoBannedMotifs(value: unknown) {
  const text = serialized(value);

  for (const pattern of bannedMotifs) {
    expect(text).not.toMatch(pattern);
  }
}

function expectNoFakeProofMetrics(value: unknown) {
  const text = serialized(value);

  for (const pattern of fakeProofPatterns) {
    expect(text).not.toMatch(pattern);
  }
}

describe("homepage Storybook fixtures", () => {
  it("keeps hero fixtures aligned with the B2B proof slice", () => {
    expect(homepageStoryHero.title).toContain("products");
    expect(homepageStoryHero.title).toContain("applications");
    expect(homepageStoryHero.proofItems).toHaveLength(4);
    expect(homepageStoryHero.diagram.kind).toBe("boxwall");
    expect(homepageStoryHero.diagram.caption.trim().length).toBeGreaterThan(0);

    expect(homepageStoryHeroZh.title).toContain("产品");
    expect(homepageStoryHeroZh.proofItems).toHaveLength(4);
    expect(homepageStoryHeroZh.diagram.kind).toBe("boxwall");
  });

  it("keeps the long-copy fixture in the same B2B proof domain", () => {
    expect(homepageStoryHeroLongCopy.title).toContain("B2B showcase starter");
    expect(homepageStoryHeroLongCopy.title).toContain("product systems");
    expect(homepageStoryHeroLongCopy.title).toContain("application fit");
    expect(homepageStoryHeroLongCopy.title).toContain("delivery proof");
    expect(homepageStoryHeroLongCopy.title).toContain("inquiry content");
  });

  it("keeps hero shape and CTA paths aligned across EN and ZH", () => {
    expect(homepageStoryHero.proofItems).toHaveLength(
      homepageStoryHeroZh.proofItems.length,
    );
    expect(homepageStoryHero.diagram.kind).toBe(
      homepageStoryHeroZh.diagram.kind,
    );
    expect(homepageStoryHero.primaryCta.href).toBe("/products");
    expect(homepageStoryHero.secondaryCta.href).toBe("/contact");
  });

  it("keeps product fixtures parity-aligned with safe inquiry links", () => {
    expect(homepageStoryProducts.map((item) => item.id)).toStrictEqual(
      homepageStoryProductsZh.map((item) => item.id),
    );
    expect(
      homepageStoryProducts.every(
        (item) => item.link === "/products" || item.link === "/contact",
      ),
    ).toBe(true);
  });

  it("avoids Vercel/developer-platform motifs and fake proof metrics", () => {
    for (const fixture of [
      homepageStoryHero,
      homepageStoryHeroZh,
      homepageStoryHeroLongCopy,
      homepageStoryProducts,
      homepageStoryProductsZh,
      homepageStoryQuality,
      homepageStoryQualityZh,
      homepageStoryScenarios,
      homepageStoryScenariosZh,
      homepageStoryFinalCta,
      homepageStoryFinalCtaZh,
    ]) {
      expectNoBannedMotifs(fixture);
      expectNoFakeProofMetrics(fixture);
    }
  });
});
