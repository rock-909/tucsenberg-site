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
    expect(homepageStoryHero.preview.items).toEqual([
      "Product system",
      "Application fit",
      "Delivery proof",
      "Inquiry path",
    ]);
    expect(homepageStoryHero.proofItems).toHaveLength(4);
    expect(homepageStoryHero.preview.items).not.toContain("Pages");
    expect(homepageStoryHero.preview.items).not.toContain("AI workflow");

    expect(homepageStoryHeroZh.title).toContain("产品");
    expect(homepageStoryHeroZh.preview.items).toEqual([
      "产品体系",
      "应用适配",
      "交付证据",
      "询盘路径",
    ]);
    expect(homepageStoryHeroZh.proofItems).toHaveLength(4);
    expect(homepageStoryHeroZh.preview.items).not.toContain("页面");
    expect(homepageStoryHeroZh.preview.items).not.toContain("AI 工作流");
  });

  it("keeps the long-copy fixture in the same B2B proof domain", () => {
    expect(homepageStoryHeroLongCopy.title).toContain("B2B showcase starter");
    expect(homepageStoryHeroLongCopy.title).toContain("product systems");
    expect(homepageStoryHeroLongCopy.title).toContain("application fit");
    expect(homepageStoryHeroLongCopy.title).toContain("delivery proof");
    expect(homepageStoryHeroLongCopy.title).toContain("inquiry content");
  });

  it("keeps hero/preview shape and CTA paths aligned across EN and ZH", () => {
    expect(homepageStoryHero.preview.items).toHaveLength(4);
    expect(homepageStoryHeroZh.preview.items).toHaveLength(4);
    expect(homepageStoryHero.proofItems).toHaveLength(
      homepageStoryHeroZh.proofItems.length,
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
