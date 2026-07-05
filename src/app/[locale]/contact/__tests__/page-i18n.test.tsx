import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page MDX i18n", () => {
  it("stores Tucsenberg contact copy in English MDX", async () => {
    const en = await getPageBySlug("contact", "en");

    expect(en.metadata.seo?.title).toBe(
      "Contact Tucsenberg — Flood Barrier Supplier, China",
    );
    expect(en.content).toContain(
      "**Fastest route**: the [RFQ form](/request-quote)",
    );
  });
});
