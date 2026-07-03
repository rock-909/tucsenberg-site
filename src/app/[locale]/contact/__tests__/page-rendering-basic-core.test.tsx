import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page MDX rendering contract", () => {
  it("provides Tucsenberg contact body from MDX", async () => {
    const page = await getPageBySlug("contact", "en");

    expect(page.content).toContain(
      "**Fastest route**: the [RFQ form](/request-quote/)",
    );
    expect(page.content).toContain("**Email**: sales@tucsenberg.com");
    expect(page.content).toContain(
      "**WhatsApp**: @Tucsenberg (business account)",
    );
  });
});
