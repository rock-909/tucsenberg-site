import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page localized rendering content", () => {
  it("provides English body sections from MDX", async () => {
    const page = await getPageBySlug("contact", "en");

    expect(page.content).toContain("## Get in Touch");
    expect(page.content).toContain("## Response Expectations");
  });
});
