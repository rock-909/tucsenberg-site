import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";
import { extractFaqFromMetadata } from "@/lib/content/mdx-faq";

describe("Contact page rendering data", () => {
  it("keeps FAQ ids kebab-case safe for direct FaqSection mode", async () => {
    const page = await getPageBySlug("contact", "en");
    const ids = extractFaqFromMetadata(page.metadata).map((item) => item.id);

    expect(ids).toEqual([
      "response-time",
      "inquiry-details",
      "samples-or-demos",
      "form-routing",
    ]);
  });
});
