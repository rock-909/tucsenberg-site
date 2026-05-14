import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SocialIconLink, TwitterIcon } from "../social-icons";

describe("Social icons accessibility", () => {
  it("renders legacy social links with accessible names and hidden labels", () => {
    render(
      <SocialIconLink
        href="https://example.com/twitter"
        icon="twitter"
        label="Twitter"
        ariaLabel="Follow us on Twitter"
      />,
    );

    const link = screen.getByRole("link", { name: "Follow us on Twitter" });
    expect(link).toHaveAttribute("href", "https://example.com/twitter");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Twitter")).toHaveClass("sr-only");
  });

  it("renders platform links with caller-provided accessible names", () => {
    render(
      <SocialIconLink
        href="https://example.com/linkedin"
        platform="linkedin"
        aria-label="Visit LinkedIn"
        data-testid="link"
      />,
    );

    expect(screen.getByTestId("link")).toHaveAccessibleName("Visit LinkedIn");
  });

  it("keeps decorative SVGs hidden from the accessibility tree", () => {
    render(<TwitterIcon data-testid="icon" />);

    expect(screen.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
  });
});
