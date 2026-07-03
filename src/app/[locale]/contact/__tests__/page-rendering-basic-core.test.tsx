import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page MDX rendering contract", () => {
  it("provides body sections for get in touch and response expectations", async () => {
    const page = await getPageBySlug("contact", "en");

    expect(page.content).toContain("## Get in Touch");
    expect(page.content).toContain("## Response Expectations");
  });
});
