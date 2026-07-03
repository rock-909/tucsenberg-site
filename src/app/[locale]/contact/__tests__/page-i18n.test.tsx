import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";
import { extractFaqFromMetadata } from "@/lib/content/mdx-faq";

describe("Contact page MDX i18n", () => {
  it("stores contact FAQ copy in English MDX frontmatter", async () => {
    const en = extractFaqFromMetadata(
      (await getPageBySlug("contact", "en")).metadata as unknown as Record<
        string,
        unknown
      >,
    );

    expect(en[0]?.question).toContain("How fast should a real site respond?");
  });
});
