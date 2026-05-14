import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";
import { extractFaqFromMetadata } from "@/lib/content/mdx-faq";

describe("Contact page MDX i18n basics", () => {
  it("keeps en and zh contact FAQ ids aligned", async () => {
    const en = await getPageBySlug("contact", "en");
    const zh = await getPageBySlug("contact", "zh");

    expect(extractFaqFromMetadata(en.metadata).map((item) => item.id)).toEqual(
      extractFaqFromMetadata(zh.metadata).map((item) => item.id),
    );
  });

  it("keeps translated hero metadata in MDX", async () => {
    const en = await getPageBySlug("contact", "en");
    const zh = await getPageBySlug("contact", "zh");

    expect(en.metadata.title).toBe("Contact Us");
    expect(zh.metadata.title).toBe("联系我们");
  });
});
