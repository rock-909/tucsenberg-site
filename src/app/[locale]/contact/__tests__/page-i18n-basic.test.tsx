import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page MDX i18n basics", () => {
  it("does not keep starter FAQ ids in English MDX", async () => {
    const en = await getPageBySlug("contact", "en");

    expect(en.metadata.faq).toBeUndefined();
  });

  it("keeps English hero metadata in MDX", async () => {
    const en = await getPageBySlug("contact", "en");

    expect(en.metadata.title).toBe("Contact");
    expect(en.metadata.seo?.title).toBe(
      "Contact Tucsenberg — Flood Barrier Supplier, China",
    );
  });
});
