import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page localized rendering content", () => {
  it("provides English Tucsenberg contact body from MDX", async () => {
    const page = await getPageBySlug("contact", "en");

    expect(page.content).toContain(
      "**Fastest route**: the [RFQ form](/request-quote)",
    );
    expect(page.content).toContain("**Email**: sales@tucsenberg.com");
    expect(page.content).not.toContain("**WhatsApp**:");
  });
});
