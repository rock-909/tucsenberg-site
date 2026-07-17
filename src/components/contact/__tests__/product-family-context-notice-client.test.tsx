import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getComposedMessages } from "@/lib/i18n/composed-messages";
import { ProductFamilyContextNoticeClient } from "@/components/contact/product-family-context-notice-client";

const mockUseSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

const enMessages = getComposedMessages("en");

describe("ProductFamilyContextNoticeClient", () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders nothing when the URL has no product family query", () => {
    render(
      <ProductFamilyContextNoticeClient
        label="You are asking about:"
        messages={enMessages}
      />,
    );

    expect(
      screen.queryByTestId("product-family-context-notice"),
    ).not.toBeInTheDocument();
  });

  it("renders validated product family context from client search params", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({
        intent: "product-family",
        market: "abs-flood-barriers",
        family: "abs-boxwall",
      }),
    );

    render(
      <ProductFamilyContextNoticeClient
        label="You are asking about:"
        messages={enMessages}
      />,
    );

    expect(screen.getByText("You are asking about:")).toBeInTheDocument();
    expect(
      screen.getByText(/ABS Interlocking Boxwall Flood Barriers/),
    ).toBeInTheDocument();
    expect(screen.getByText(/ABS boxwall units/)).toBeInTheDocument();
  });

  it("ignores invalid product family query values", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({
        intent: "product-family",
        market: "abs-flood-barriers",
        family: "<script>alert(1)</script>",
      }),
    );

    render(
      <ProductFamilyContextNoticeClient
        label="You are asking about:"
        messages={enMessages}
      />,
    );

    expect(
      screen.queryByTestId("product-family-context-notice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("<script>alert(1)</script>"),
    ).not.toBeInTheDocument();
  });
});
