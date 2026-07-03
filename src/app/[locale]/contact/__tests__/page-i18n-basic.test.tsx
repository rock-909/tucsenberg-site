import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";
import { extractFaqFromMetadata } from "@/lib/content/mdx-faq";

describe("Contact page MDX i18n basics", () => {
  it("keeps contact FAQ ids in English MDX", async () => {
    const en = await getPageBySlug("contact", "en");

    expect(extractFaqFromMetadata(en.metadata).map((item) => item.id)).toEqual([
      "response-time",
      "inquiry-details",
      "samples-or-demos",
      "form-routing",
    ]);
  });

  it("keeps English hero metadata in MDX", async () => {
    const en = await getPageBySlug("contact", "en");

    expect(en.metadata.title).toBe("Contact Us");
  });
});
