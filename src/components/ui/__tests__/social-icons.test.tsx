import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ExternalLinkIcon,
  FacebookIcon,
  GitHubIcon,
  LinkedInIcon,
  SocialIconMapper,
  TwitterIcon,
  YouTubeIcon,
} from "../social-icons";

describe("Social icons", () => {
  it.each([
    [TwitterIcon, "twitter"],
    [LinkedInIcon, "linkedin"],
    [FacebookIcon, "facebook"],
    [YouTubeIcon, "youtube"],
    [GitHubIcon, "github"],
  ] as const)("renders %s as a hidden SVG icon", (Icon, testId) => {
    render(<Icon className="custom-icon" size={32} data-testid={testId} />);

    const icon = screen.getByTestId(testId);
    expect(icon.tagName).toBe("svg");
    expect(icon).toHaveAttribute("width", "32");
    expect(icon).toHaveAttribute("height", "32");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("fill", "currentColor");
    expect(icon).toHaveClass("custom-icon");
  });

  it("renders the external link icon with stroke-based styling", () => {
    const { container } = render(
      <ExternalLinkIcon data-testid="external-icon" />,
    );

    const icon = screen.getByTestId("external-icon");
    expect(icon).toHaveAttribute("width", "16");
    expect(icon).toHaveAttribute("fill", "none");
    expect(icon).toHaveAttribute("stroke", "currentColor");
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it.each([
    ["twitter", "fill"],
    ["x", "fill"],
    ["linkedin", "fill"],
    ["facebook", "fill"],
    ["youtube", "fill"],
    ["github", "fill"],
    ["unknown", "stroke"],
  ] as const)(
    "maps platform %s to the expected icon family",
    (platform, attr) => {
      const { container } = render(
        <SocialIconMapper
          platform={platform}
          className="mapped-icon"
          size={24}
          data-testid="mapped"
        />,
      );

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("width", "24");
      expect(icon).toHaveClass("mapped-icon");
      expect(icon).toHaveAttribute(attr);
    },
  );
});
