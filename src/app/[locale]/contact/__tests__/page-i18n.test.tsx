import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";
import { extractFaqFromMetadata } from "@/lib/content/mdx-faq";

describe("Contact page MDX i18n", () => {
  it("stores contact FAQ copy in localized MDX frontmatter", async () => {
    const en = extractFaqFromMetadata(
      (await getPageBySlug("contact", "en")).metadata as unknown as Record<
        string,
        unknown
      >,
    );
    const zh = extractFaqFromMetadata(
      (await getPageBySlug("contact", "zh")).metadata as unknown as Record<
        string,
        unknown
      >,
    );

    expect(en[0]?.question).toContain("How fast should a real site respond?");
    expect(zh[0]?.question).toContain("真实网站应该多久回复？");
  });
});
