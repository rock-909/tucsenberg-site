import React from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockLoadLegalPage } = vi.hoisted(() => ({
  mockLoadLegalPage: vi.fn(),
}));

vi.mock("@/lib/content/legal-page", () => ({
  loadLegalPage: mockLoadLegalPage,
}));

vi.mock("@/components/content/legal-page-shell", () => ({
  LegalPageShell: vi.fn(() =>
    React.createElement("main", { "data-testid": "legal-shell" }, "Privacy"),
  ),
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: vi.fn(() => ({
    title: "Privacy Policy",
    description: "Privacy description",
  })),
}));

vi.mock("@/app/[locale]/generate-static-params", () => ({
  generateLocaleStaticParams: () => [{ locale: "en" }, { locale: "zh" }],
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}));

describe("PrivacyContent async invocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadLegalPage.mockResolvedValue({
      content:
        "## Information We Collect {#info-collect}\nWe collect data.\n## How We Use {#how-we-use}\nWe use data.",
      headings: [
        { level: 2, text: "Information We Collect", id: "info-collect" },
        { level: 2, text: "How We Use", id: "how-we-use" },
      ],
      metadata: {
        slug: "privacy",
        title: "Privacy Policy",
        publishedAt: "2024-01-01",
        updatedAt: "2024-02-01",
        layout: "legal",
        showToc: true,
        lastReviewed: "2024-02-01",
      },
    });
  });

  it("should load privacy legal page with await in PrivacyContent", async () => {
    const { default: PrivacyPage } =
      await import("@/app/[locale]/privacy/page");

    const pageElement = await PrivacyPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await act(async () => {
      render(pageElement);
    });

    expect(mockLoadLegalPage).toHaveBeenCalledWith("privacy", "en");
  });
});
