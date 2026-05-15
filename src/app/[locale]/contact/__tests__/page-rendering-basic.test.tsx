import { describe, expect, it } from "vitest";
import { getPageBySlug } from "@/lib/content-query/queries";

describe("Contact page localized rendering content", () => {
  it("provides Chinese body sections from MDX", async () => {
    const page = await getPageBySlug("contact", "zh");

    expect(page.content).toContain("## 提交替换膜片询价");
    expect(page.content).toContain("## 有用的 RFQ 输入");
  });
});
