import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GitHubIcon, SocialIconLink } from "../social-icons";

describe("Social icons integration", () => {
  it("uses mapped icons by default for platform-link callers", () => {
    render(
      <SocialIconLink
        href="https://example.com/github"
        platform="github"
        aria-label="Open GitHub"
        data-testid="social-link"
        iconSize={28}
      />,
    );

    const link = screen.getByTestId("social-link");
    const icon = link.querySelector("svg");
    expect(link).toHaveAttribute("href", "https://example.com/github");
    expect(link).toHaveClass("inline-flex", "justify-center");
    expect(icon).toHaveAttribute("width", "28");
  });

  it("allows platform-link callers to provide custom children", () => {
    render(
      <SocialIconLink
        href="https://example.com/custom"
        platform="custom"
        aria-label="Open custom network"
      >
        <GitHubIcon data-testid="custom-icon" />
      </SocialIconLink>,
    );

    const link = screen.getByRole("link", { name: "Open custom network" });
    expect(link).toContainElement(screen.getByTestId("custom-icon"));
  });
});
