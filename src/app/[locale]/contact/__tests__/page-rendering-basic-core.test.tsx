import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page MDX rendering contract", () => {
  it("provides body sections for membrane inquiry and RFQ inputs", async () => {
    const page = await getPageBySlug("contact", "en");

    expect(page.content).toContain("## Send a replacement membrane inquiry");
    expect(page.content).toContain("## Useful RFQ inputs");
  });
});
