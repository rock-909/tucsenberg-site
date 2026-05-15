import { describe, expect, it } from "vitest";
import { getStaticContactPage } from "@/app/[locale]/contact/contact-page-data";

describe("contact page static content data", () => {
  it("falls Spanish contact MDX back to English content during Step 2", () => {
    const page = getStaticContactPage("es");

    expect(page.filePath).toBe("/content/pages/en/contact.mdx");
    expect(page.metadata.slug).toBe("contact");
    expect(page.content).toContain("## Response Expectations");
  });
});
