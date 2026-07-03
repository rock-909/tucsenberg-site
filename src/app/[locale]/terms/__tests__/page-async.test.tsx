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
    React.createElement("main", { "data-testid": "legal-shell" }, "Terms"),
  ),
}));

vi.mock("@/lib/seo-metadata", () => ({
  generateMetadataForPath: vi.fn(() => ({
    title: "Terms of Service",
    description: "Terms description",
  })),
}));

vi.mock("@/app/[locale]/generate-static-params", () => ({
  generateLocaleStaticParams: () => [{ locale: "en" }, { locale: "zh" }],
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
}));

describe("TermsContent async invocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLoadLegalPage.mockResolvedValue({
      content: "## Introduction {#introduction}\nWelcome.",
      headings: [{ level: 2, text: "Introduction", id: "introduction" }],
      metadata: {
        slug: "terms",
        title: "Terms of Service",
        publishedAt: "2024-01-01",
        updatedAt: "2024-06-01",
        layout: "legal",
        showToc: true,
        lastReviewed: "2024-06-01",
      },
    });
  });

  it("should load terms legal page with await in TermsContent", async () => {
    const { default: TermsPage } = await import("@/app/[locale]/terms/page");

    const pageElement = await TermsPage({
      params: Promise.resolve({ locale: "en" }),
    });

    await act(async () => {
      render(pageElement);
    });

    expect(mockLoadLegalPage).toHaveBeenCalledWith("terms", "en");
  });
});
